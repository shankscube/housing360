import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

// ---------------------------------------------------------------------------
// Question bank (client-facing form + scoring engine reads)
// ---------------------------------------------------------------------------

const QUESTION_INCLUDE = {
  answerOptions: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.CeQuestionInclude;

export type CeQuestionRow = Prisma.CeQuestionGetPayload<{ include: typeof QUESTION_INCLUDE }>;
export type CeAnswerOptionRow = Prisma.CeAnswerOptionGetPayload<Record<string, never>>;
export type CeScoreBandRow = Prisma.CeScoreBandGetPayload<Record<string, never>>;
export type CeFlagOverrideRow = Prisma.CeFlagOverrideGetPayload<Record<string, never>>;
export type CeRuleChangeRow = Prisma.CeRuleChangeGetPayload<{ include: { actor: true } }>;

/** `GET /api/ce/questions` — active only, ordered by `sequence`. */
export function findActiveQuestions(): Promise<CeQuestionRow[]> {
  return prisma.ceQuestion.findMany({
    where: { isActive: true },
    include: QUESTION_INCLUDE,
    orderBy: { sequence: 'asc' },
  });
}

export function findQuestionById(id: string): Promise<CeQuestionRow | null> {
  return prisma.ceQuestion.findUnique({ where: { id }, include: QUESTION_INCLUDE });
}

export function findAnswerOptionsByIds(ids: string[]): Promise<CeAnswerOptionRow[]> {
  return prisma.ceAnswerOption.findMany({ where: { id: { in: ids } } });
}

export function findAnswerOptionById(id: string): Promise<CeAnswerOptionRow | null> {
  return prisma.ceAnswerOption.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// Score bands / flag overrides (scoring engine reads)
// ---------------------------------------------------------------------------

/** The band whose `[minScore, maxScore]` (inclusive both ends) contains `score`. */
export function findScoreBandContainingScore(score: number): Promise<CeScoreBandRow | null> {
  return prisma.ceScoreBand.findFirst({
    where: { minScore: { lte: score }, maxScore: { gte: score } },
  });
}

export function findScoreBandById(id: string): Promise<CeScoreBandRow | null> {
  return prisma.ceScoreBand.findUnique({ where: { id } });
}

export function findAllScoreBands(): Promise<CeScoreBandRow[]> {
  return prisma.ceScoreBand.findMany({ orderBy: { minScore: 'asc' } });
}

export function findAllFlagOverrides(): Promise<CeFlagOverrideRow[]> {
  return prisma.ceFlagOverride.findMany();
}

export function findFlagOverrideById(id: string): Promise<CeFlagOverrideRow | null> {
  return prisma.ceFlagOverride.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// CeAssessment / CeResponse
// ---------------------------------------------------------------------------

const CE_ASSESSMENT_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
  band: true,
  responses: { include: { question: true, answerOption: true } },
} satisfies Prisma.CeAssessmentInclude;

export type CeAssessmentRow = Prisma.CeAssessmentGetPayload<{ include: typeof CE_ASSESSMENT_INCLUDE }>;

export interface CreateCeAssessmentInput {
  clientId: string;
  assessedById: number;
  totalScore: number;
  bandId: string | null;
  flags: { veteran: boolean; unaccompaniedYouth: boolean; safetyAlert: boolean };
  responses: { questionId: string; answerOptionId: string; score: number }[];
}

/** `POST /api/ce/assessments` — one `CeAssessment` row plus one `CeResponse`
 * row per answered question, in a single transaction. */
export async function createCeAssessment(input: CreateCeAssessmentInput): Promise<CeAssessmentRow> {
  return prisma.$transaction(async (tx) => {
    const assessment = await tx.ceAssessment.create({
      data: {
        clientId: input.clientId,
        assessedById: input.assessedById,
        totalScore: input.totalScore,
        bandId: input.bandId,
        flags: input.flags as Prisma.InputJsonValue,
      },
    });

    if (input.responses.length > 0) {
      await tx.ceResponse.createMany({
        data: input.responses.map((response) => ({
          ceAssessmentId: assessment.id,
          questionId: response.questionId,
          answerOptionId: response.answerOptionId,
          score: response.score,
        })),
      });
    }

    return tx.ceAssessment.findUniqueOrThrow({
      where: { id: assessment.id },
      include: CE_ASSESSMENT_INCLUDE,
    });
  });
}

export function findCeAssessmentById(id: string): Promise<CeAssessmentRow | null> {
  return prisma.ceAssessment.findUnique({ where: { id }, include: CE_ASSESSMENT_INCLUDE });
}

export function findLatestCeAssessmentByClient(clientId: string): Promise<CeAssessmentRow | null> {
  return prisma.ceAssessment.findFirst({
    where: { clientId },
    include: CE_ASSESSMENT_INCLUDE,
    orderBy: { assessedAt: 'desc' },
  });
}

/** A client's prior CE assessments, newest first, optionally excluding one id
 * (the one just created/being viewed) — feeds `CeAssessmentDetail.previousAssessments`. */
export function findPreviousCeAssessmentsByClient(
  clientId: string,
  excludeId?: string
): Promise<CeAssessmentRow[]> {
  return prisma.ceAssessment.findMany({
    where: { clientId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: CE_ASSESSMENT_INCLUDE,
    orderBy: { assessedAt: 'desc' },
  });
}

export function attachReferralToCeAssessment(id: string, referralId: string): Promise<CeAssessmentRow> {
  return prisma.ceAssessment.update({
    where: { id },
    data: { referralId },
    include: CE_ASSESSMENT_INCLUDE,
  });
}

/**
 * The Priority Queue's base candidate set — every client's *latest*
 * `CeAssessment`. `AWAITING_REFERRAL` filtering (service layer) is simply
 * "this row's `referralId` is null" — much simpler than the old
 * `VulnerabilityAssessment`-era definition, which cross-checked active
 * enrollments too.
 */
export async function findLatestCeAssessmentsForQueue(): Promise<CeAssessmentRow[]> {
  const rows = await prisma.ceAssessment.findMany({
    include: CE_ASSESSMENT_INCLUDE,
    orderBy: { assessedAt: 'desc' },
  });

  const latestByClient = new Map<string, CeAssessmentRow>();
  for (const row of rows) {
    if (!latestByClient.has(row.clientId)) {
      latestByClient.set(row.clientId, row);
    }
  }
  return Array.from(latestByClient.values());
}

// ---------------------------------------------------------------------------
// Rule administration CRUD — every write also creates a `CeRuleChange` row,
// in the same transaction as the underlying write (coordinated-entry spec's
// "Rule Administration Requires the ce:manage-rules Permission and Is
// Audited" requirement).
// ---------------------------------------------------------------------------

async function recordRuleChange(
  tx: Prisma.TransactionClient,
  ruleTable: string,
  ruleId: string,
  actorId: number,
  before: unknown,
  after: unknown
): Promise<void> {
  await tx.ceRuleChange.create({
    data: {
      ruleTable,
      ruleId,
      actorId,
      before: before === null || before === undefined ? Prisma.JsonNull : (before as Prisma.InputJsonValue),
      after: after === null || after === undefined ? Prisma.JsonNull : (after as Prisma.InputJsonValue),
    },
  });
}

// -- CeQuestion (+ nested CeAnswerOption on create) --

export interface CreateQuestionInput {
  text: string;
  clientFacingPrompt?: string | null;
  sequence?: number;
  isActive?: boolean;
  weightNote?: string | null;
  answerOptions: { text: string; score: number }[];
}

export async function createQuestionWithAudit(
  input: CreateQuestionInput,
  actorId: number
): Promise<CeQuestionRow> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.ceQuestion.create({
      data: {
        text: input.text,
        clientFacingPrompt: input.clientFacingPrompt ?? null,
        sequence: input.sequence ?? 0,
        isActive: input.isActive ?? true,
        weightNote: input.weightNote ?? null,
        answerOptions: { create: input.answerOptions.map((o) => ({ text: o.text, score: o.score })) },
      },
      include: QUESTION_INCLUDE,
    });
    await recordRuleChange(tx, 'CeQuestion', created.id, actorId, null, created);
    return created;
  });
}

export interface UpdateQuestionInput {
  text?: string;
  clientFacingPrompt?: string | null;
  sequence?: number;
  isActive?: boolean;
  weightNote?: string | null;
}

export async function updateQuestionWithAudit(
  id: string,
  input: UpdateQuestionInput,
  actorId: number
): Promise<CeQuestionRow> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.ceQuestion.findUnique({ where: { id }, include: QUESTION_INCLUDE });
    const updated = await tx.ceQuestion.update({ where: { id }, data: input, include: QUESTION_INCLUDE });
    await recordRuleChange(tx, 'CeQuestion', id, actorId, before, updated);
    return updated;
  });
}

export async function deleteQuestionWithAudit(id: string, actorId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.ceQuestion.findUnique({ where: { id }, include: QUESTION_INCLUDE });
    await tx.ceQuestion.delete({ where: { id } });
    await recordRuleChange(tx, 'CeQuestion', id, actorId, before, null);
  });
}

// -- CeAnswerOption (added/edited/removed on an existing question) --

export async function createAnswerOptionWithAudit(
  questionId: string,
  input: { text: string; score: number },
  actorId: number
): Promise<CeAnswerOptionRow> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.ceAnswerOption.create({
      data: { questionId, text: input.text, score: input.score },
    });
    await recordRuleChange(tx, 'CeAnswerOption', created.id, actorId, null, created);
    return created;
  });
}

export async function updateAnswerOptionWithAudit(
  id: string,
  input: { text?: string; score?: number },
  actorId: number
): Promise<CeAnswerOptionRow> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.ceAnswerOption.findUnique({ where: { id } });
    const updated = await tx.ceAnswerOption.update({ where: { id }, data: input });
    await recordRuleChange(tx, 'CeAnswerOption', id, actorId, before, updated);
    return updated;
  });
}

export async function deleteAnswerOptionWithAudit(id: string, actorId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.ceAnswerOption.findUnique({ where: { id } });
    await tx.ceAnswerOption.delete({ where: { id } });
    await recordRuleChange(tx, 'CeAnswerOption', id, actorId, before, null);
  });
}

// -- CeScoreBand --

export interface CeScoreBandWriteInput {
  name: string;
  minScore: number;
  maxScore: number;
  description?: string | null;
  badgeColor?: string | null;
  recommendedProjectTypeCodes: string;
}

export async function createScoreBandWithAudit(
  input: CeScoreBandWriteInput,
  actorId: number
): Promise<CeScoreBandRow> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.ceScoreBand.create({ data: input });
    await recordRuleChange(tx, 'CeScoreBand', created.id, actorId, null, created);
    return created;
  });
}

export async function updateScoreBandWithAudit(
  id: string,
  input: Partial<CeScoreBandWriteInput>,
  actorId: number
): Promise<CeScoreBandRow> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.ceScoreBand.findUnique({ where: { id } });
    const updated = await tx.ceScoreBand.update({ where: { id }, data: input });
    await recordRuleChange(tx, 'CeScoreBand', id, actorId, before, updated);
    return updated;
  });
}

export async function deleteScoreBandWithAudit(id: string, actorId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.ceScoreBand.findUnique({ where: { id } });
    await tx.ceScoreBand.delete({ where: { id } });
    await recordRuleChange(tx, 'CeScoreBand', id, actorId, before, null);
  });
}

// -- CeFlagOverride --

export interface CeFlagOverrideWriteInput {
  flag: string;
  triggerQuestionId?: string | null;
  triggerMinScore?: number | null;
  behavior: string;
  externalReferralMessage?: string | null;
}

export async function createFlagOverrideWithAudit(
  input: CeFlagOverrideWriteInput,
  actorId: number
): Promise<CeFlagOverrideRow> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.ceFlagOverride.create({ data: input });
    await recordRuleChange(tx, 'CeFlagOverride', created.id, actorId, null, created);
    return created;
  });
}

export async function updateFlagOverrideWithAudit(
  id: string,
  input: Partial<CeFlagOverrideWriteInput>,
  actorId: number
): Promise<CeFlagOverrideRow> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.ceFlagOverride.findUnique({ where: { id } });
    const updated = await tx.ceFlagOverride.update({ where: { id }, data: input });
    await recordRuleChange(tx, 'CeFlagOverride', id, actorId, before, updated);
    return updated;
  });
}

export async function deleteFlagOverrideWithAudit(id: string, actorId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.ceFlagOverride.findUnique({ where: { id } });
    await tx.ceFlagOverride.delete({ where: { id } });
    await recordRuleChange(tx, 'CeFlagOverride', id, actorId, before, null);
  });
}

// -- CeRuleChange (read side) --

export async function findRuleChanges(
  page: number,
  pageSize: number
): Promise<[CeRuleChangeRow[], number]> {
  return Promise.all([
    prisma.ceRuleChange.findMany({
      include: { actor: true },
      orderBy: { changedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ceRuleChange.count(),
  ]);
}
