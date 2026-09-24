import { Prisma } from '@prisma/client';
import type { AssessmentFilter, AssessmentTypeFilter } from '@housing360/types';
import { prisma } from './prismaClient';

/** Full row shape for an `Assessment`, including every Living-Situation /
 * Income-Benefits-Insurance / Health-DV field — there is no list-safe subset
 * for assessments (unlike `Client`), since nothing here is PII in the same
 * sense SSN/DOB are. */
export type AssessmentRow = Prisma.AssessmentGetPayload<Record<string, never>>;

/** Client/program-enrollment names, joined once and reused by both the global
 * Assessment Command Center list and the per-enrollment Assessments tab list
 * — see `case.model.ts`'s `LIST_INCLUDE` for the identical pattern. */
const LIST_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
  programEnrollment: { select: { name: true } },
} satisfies Prisma.AssessmentInclude;

export type AssessmentListRow = Prisma.AssessmentGetPayload<{ include: typeof LIST_INCLUDE }>;

/** `GET /api/assessments/:id` needs the score breakdown and disability rows
 * the list/global views don't — a separate include so `findAssessments`'s
 * paginated query never pulls them unnecessarily. */
const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  disabilities: true,
  scoreContributions: true,
  // `assessment-and-ce-workspace` frontend work (Assessment detail page,
  // Resume Draft pre-fill) needs the assessor's display name and the full
  // section-field values — `assessor` join added here (mirrors
  // `case.model.ts`'s `createdBy`/`updatedBy` -> name pattern); the section
  // fields themselves are already present as plain scalars on `AssessmentRow`
  // (Prisma includes every scalar column by default), so no `select` change
  // was needed for those — only `toAssessmentDetail` needed updating to stop
  // dropping them.
  assessor: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AssessmentInclude;

export type AssessmentDetailRow = Prisma.AssessmentGetPayload<{ include: typeof DETAIL_INCLUDE }>;

const ENTRY_STAGE = 1;

/** Maps the `stage` query param (`GET /enrollments/:id/assessments?stage=entry`)
 * to the numeric `dataCollectionStage` column. Entry (`1`) is the only stage
 * this phase ever writes/reads — see design.md's Non-Goals. */
export function stageParamToDataCollectionStage(stage: string | undefined): number {
  if (stage === 'entry' || stage === undefined) {
    return ENTRY_STAGE;
  }
  // Unknown stage values fall back to Entry rather than erroring — this
  // phase only ever deals with stage 1, so there's nothing else to map to.
  return ENTRY_STAGE;
}

/** `cycleNumber` defaults to `1` — the only value the intake wizard's Entry
 * Assessment (and every pre-existing call site) ever uses. Annual/exit
 * assessments pass an explicit cycle to address a later recurrence. */
export function findAssessmentByEnrollmentAndStage(
  programEnrollmentId: string,
  dataCollectionStage: number,
  cycleNumber = 1
): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({
    where: {
      programEnrollmentId_dataCollectionStage_cycleNumber: {
        programEnrollmentId,
        dataCollectionStage,
        cycleNumber,
      },
    },
  });
}

export function findAssessmentById(id: string): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({ where: { id } });
}

/** `case-workspace`'s Assessments tab list — every stage recorded for an enrollment, not just Entry. */
export function findAssessmentsByEnrollment(programEnrollmentId: string): Promise<AssessmentListRow[]> {
  return prisma.assessment.findMany({
    where: { programEnrollmentId },
    include: LIST_INCLUDE,
    orderBy: { dataCollectionStage: 'asc' },
  });
}

export function deleteAssessment(id: string): Promise<AssessmentRow> {
  return prisma.assessment.delete({ where: { id } });
}

/** Minimal shape `AssessmentEligibilityService` needs — a lighter query than
 * `findAssessmentsByEnrollment`'s joined list-row shape, since eligibility
 * never renders client/program names. */
export interface EligibilityAssessmentRow {
  id: string;
  dataCollectionStage: number;
  status: string;
  assessmentDate: Date;
  cycleNumber: number;
}

export function findAssessmentsForEligibility(programEnrollmentId: string): Promise<EligibilityAssessmentRow[]> {
  return prisma.assessment.findMany({
    where: { programEnrollmentId },
    select: { id: true, dataCollectionStage: true, status: true, assessmentDate: true, cycleNumber: true },
    orderBy: { assessmentDate: 'desc' },
  });
}

/** `GET /api/enrollments/:id/recommended-care-plan-templates` and
 * `carePlan.service.ts`'s `getRecommendedCarePlanTemplates` — the enrollment's
 * latest completed assessment, used for its `score`/field values. Returns the
 * full scalar row (not the joined list shape) since `fieldCondition` rules can
 * reference any Assessment column. */
export function findLatestCompletedAssessmentForEnrollment(programEnrollmentId: string): Promise<AssessmentRow | null> {
  return prisma.assessment.findFirst({
    where: { programEnrollmentId, status: COMPLETED_STATUS },
    orderBy: { assessmentDate: 'desc' },
  });
}

/** `GET /api/enrollments/:id/latest-assessment-values` — "Carry forward
 * previous answers" pre-fill, scoped to one enrollment only (never another
 * enrollment's assessment, even for the same client). Prefers the most
 * recently completed assessment; falls back to the most recently updated one
 * (which may still be a draft) only when nothing has been completed yet. */
export async function findLatestAssessmentForCarryForward(programEnrollmentId: string): Promise<AssessmentRow | null> {
  const completed = await prisma.assessment.findFirst({
    where: { programEnrollmentId, status: COMPLETED_STATUS },
    orderBy: { assessmentDate: 'desc' },
  });
  if (completed) {
    return completed;
  }
  return prisma.assessment.findFirst({
    where: { programEnrollmentId },
    orderBy: { updatedAt: 'desc' },
  });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const COMPLETED_STATUS = 'completed';
const IN_PROGRESS_STATUS = 'in_progress';

function dueTodayWhere(): Prisma.AssessmentWhereInput {
  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  return {
    status: { not: COMPLETED_STATUS },
    dueDate: { gte: todayStart, lt: todayEnd },
  };
}

function overdueWhere(): Prisma.AssessmentWhereInput {
  const todayStart = startOfDay(new Date());
  return {
    status: { not: COMPLETED_STATUS },
    dueDate: { lt: todayStart },
  };
}

/** Single-select filter, same "combines with search, never with another
 * filter value" contract as `case.model.ts`'s `filterWhere`. */
function statusFilterWhere(filter: AssessmentFilter): Prisma.AssessmentWhereInput {
  switch (filter) {
    case 'overdue':
      return overdueWhere();
    case 'dueToday':
      return dueTodayWhere();
    case 'inProgress':
      return { status: IN_PROGRESS_STATUS };
    case 'completed':
      return { status: COMPLETED_STATUS };
    case 'all':
    default:
      return {};
  }
}

function typeFilterWhere(typeFilter: AssessmentTypeFilter | undefined): Prisma.AssessmentWhereInput {
  if (!typeFilter || typeFilter === 'all') {
    return {};
  }
  return { type: typeFilter };
}

interface FindAssessmentsParams {
  page: number;
  pageSize: number;
  filter: AssessmentFilter;
  typeFilter?: AssessmentTypeFilter;
  search?: string;
}

/** Global, cross-case list backing the Assessment Command Center — status and
 * type filters AND together (design.md's "Status and Type Filters Combine"
 * spec requirement), distinct from `findAssessmentsByEnrollment`'s
 * single-enrollment scope. */
export async function findAssessments({
  page,
  pageSize,
  filter,
  typeFilter,
  search,
}: FindAssessmentsParams): Promise<{ rows: AssessmentListRow[]; total: number }> {
  const where: Prisma.AssessmentWhereInput = {
    AND: [
      statusFilterWhere(filter),
      typeFilterWhere(typeFilter),
      search
        ? {
            client: {
              is: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] },
            },
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      include: LIST_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dueDate: 'asc' },
    }),
    prisma.assessment.count({ where }),
  ]);

  return { rows, total };
}

export interface AssessmentKpiCountRows {
  dueToday: number;
  inProgress: number;
  completed: number;
  completedThisMonth: number;
  total: number;
}

/** First moment of the current calendar month, in local time — matches
 * `startOfDay`'s local-time convention rather than UTC. */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function countAssessmentKpis(): Promise<AssessmentKpiCountRows> {
  const [dueToday, inProgress, completed, completedThisMonth, total] = await Promise.all([
    prisma.assessment.count({ where: dueTodayWhere() }),
    prisma.assessment.count({ where: { status: IN_PROGRESS_STATUS } }),
    prisma.assessment.count({ where: { status: COMPLETED_STATUS } }),
    prisma.assessment.count({
      where: { status: COMPLETED_STATUS, assessmentDate: { gte: startOfCurrentMonth() } },
    }),
    prisma.assessment.count(),
  ]);
  return { dueToday, inProgress, completed, completedThisMonth, total };
}

export function findAssessmentDetailById(id: string): Promise<AssessmentDetailRow | null> {
  return prisma.assessment.findUnique({ where: { id }, include: DETAIL_INCLUDE });
}

/** Contribution rows to persist alongside a scored assessment — see
 * `HousingStabilityScoringService.scoreAssessment`. `null` means "this save
 * didn't complete the assessment, don't touch scoring at all" (as opposed to
 * an empty array, which means "completed, but no rule matched"). */
export interface ScoringWriteInput {
  contributions: { field: string; value: string | null; contribution: number }[];
}

/** Exit Details to persist as a `ProgramExit` row — see design.md Decision 3.
 * `null` means this save didn't complete an Exit-stage assessment. */
export interface ExitWriteInput {
  programEnrollmentId: string;
  destinationType: string | null;
  destination: string | null;
  caseManagerExitReason: string | null;
  exitDate: Date;
}

/** Shared by `upsertAssessment`/`updateAssessment` below — clears and
 * re-writes the assessment's score-contribution rows (design.md's "score
 * equals the sum of persisted contributions" requirement) and, for an Exit
 * completion, creates the `ProgramExit` row and closes the enrollment, all
 * within the caller's transaction. */
async function applyScoringAndExit(
  tx: Prisma.TransactionClient,
  assessmentId: string,
  scoring: ScoringWriteInput | null,
  exit: ExitWriteInput | null
): Promise<void> {
  if (scoring) {
    await tx.assessmentScoreContribution.deleteMany({ where: { assessmentId } });
    if (scoring.contributions.length > 0) {
      await tx.assessmentScoreContribution.createMany({
        data: scoring.contributions.map((c) => ({
          assessmentId,
          field: c.field,
          value: c.value,
          contribution: c.contribution,
        })),
      });
    }
  }
  if (exit) {
    await tx.programExit.create({
      data: {
        assessmentId,
        programEnrollmentId: exit.programEnrollmentId,
        exitDate: exit.exitDate,
        destinationType: exit.destinationType,
        destination: exit.destination,
        caseManagerExitReason: exit.caseManagerExitReason,
      },
    });
    await tx.programEnrollment.update({
      where: { id: exit.programEnrollmentId },
      data: { status: 'exited', endDate: exit.exitDate },
    });
  }
}

/** Upsert keyed on the compound unique `(programEnrollmentId, dataCollectionStage, cycleNumber)` —
 * required so re-saving the same enrollment's Entry Assessment (steps 4-6
 * resubmitted) never creates a second row. See design.md's "Exactly one Entry
 * Assessment per enrollment" decision. `cycleNumber` defaults to `1`, matching
 * every existing call site (entry assessments never set it) — the
 * `assessments-and-coordinated-entry` change adds this column solely so an
 * annual/exit assessment can recur under a new cycle without colliding with
 * an earlier one on the same enrollment+stage.
 *
 * `scoring`/`exit` (added by `assessment-and-ce-workspace`) are optional —
 * when the caller's save completed the assessment, they carry the score
 * contribution rows and/or Exit Details to write in the SAME transaction as
 * the assessment row itself (design.md Decisions 3 and 4). */
export function upsertAssessment(
  programEnrollmentId: string,
  dataCollectionStage: number,
  createData: Prisma.AssessmentUncheckedCreateInput,
  updateData: Prisma.AssessmentUncheckedUpdateInput,
  cycleNumber = 1,
  scoring: ScoringWriteInput | null = null,
  exit: ExitWriteInput | null = null
): Promise<AssessmentRow> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.assessment.upsert({
      where: {
        programEnrollmentId_dataCollectionStage_cycleNumber: {
          programEnrollmentId,
          dataCollectionStage,
          cycleNumber,
        },
      },
      create: createData,
      update: updateData,
    });
    await applyScoringAndExit(tx, row.id, scoring, exit);
    return row;
  });
}

export function updateAssessment(
  id: string,
  data: Prisma.AssessmentUncheckedUpdateInput,
  scoring: ScoringWriteInput | null = null,
  exit: ExitWriteInput | null = null
): Promise<AssessmentRow> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.assessment.update({ where: { id }, data });
    await applyScoringAndExit(tx, id, scoring, exit);
    return row;
  });
}

/**
 * `POST /api/enrollments/:id/exit` — a standalone, directly-callable version
 * of the exit-recording half of `applyScoringAndExit`, for manual/internal
 * invocation against an assessment that's already completed (task 4.6 allows
 * this to be "a thin internal helper reused by [Exit-completion]'s
 * transaction rather than a separately user-triggered endpoint" — this is
 * that helper, exposed as its own endpoint too since the task also requires
 * the route to exist). `ProgramExit.assessmentId` is a required unique
 * column, so this always needs an already-existing assessment id — there's
 * no schema-valid way to record an exit with no assessment at all.
 */
export function recordProgramExit(assessmentId: string, exit: ExitWriteInput): Promise<void> {
  return prisma.$transaction(async (tx) => {
    await applyScoringAndExit(tx, assessmentId, null, exit);
  });
}
