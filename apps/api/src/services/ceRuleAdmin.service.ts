/**
 * CRUD for the Coordinated Entry rule tables (`CeQuestion`+`CeAnswerOption`,
 * `CeScoreBand`, `CeFlagOverride`) plus the `CeRuleChange` audit-log read
 * side. Every route these back is gated by `requirePermission('ce:manage-rules')`
 * (see `middlewares/requirePermission.ts`), and every write goes through the
 * model layer's `*WithAudit` functions so the `CeRuleChange` row is created
 * in the same transaction as the underlying write.
 */
import type {
  CeFlagOverride,
  CeFlagOverrideInput,
  CeFlagOverrideUpdateInput,
  CeQuestion,
  CeQuestionInput,
  CeQuestionUpdateInput,
  CeRuleChange,
  CeScoreBand,
  CeScoreBandInput,
  CeScoreBandUpdateInput,
} from '@housing360/types';
import {
  createAnswerOptionWithAudit,
  createFlagOverrideWithAudit,
  createQuestionWithAudit,
  createScoreBandWithAudit,
  deleteAnswerOptionWithAudit,
  deleteFlagOverrideWithAudit,
  deleteQuestionWithAudit,
  deleteScoreBandWithAudit,
  findAllFlagOverrides,
  findAllScoreBands,
  findAnswerOptionById,
  findFlagOverrideById,
  findQuestionById,
  findRuleChanges,
  findScoreBandById,
  updateAnswerOptionWithAudit,
  updateFlagOverrideWithAudit,
  updateQuestionWithAudit,
  updateScoreBandWithAudit,
} from '../models/coordinatedEntry.model';
import { toCeFlagOverride, toCeQuestion, toCeRuleChange, toCeScoreBand } from '../models/coordinatedEntry.mapper';
import { AppError } from '../utils/AppError';

const VALID_BEHAVIORS = new Set(['replace', 'add']);

// ---- CeQuestion ----

export async function createCeQuestion(input: CeQuestionInput, actorId: number): Promise<CeQuestion> {
  if (!input?.text?.trim()) {
    throw new AppError(400, 'text is required');
  }
  if (!input.answerOptions || input.answerOptions.length === 0) {
    throw new AppError(400, 'At least one answer option is required');
  }
  const row = await createQuestionWithAudit(
    {
      text: input.text.trim(),
      clientFacingPrompt: input.clientFacingPrompt ?? null,
      sequence: input.sequence,
      isActive: input.isActive,
      weightNote: input.weightNote ?? null,
      answerOptions: input.answerOptions,
    },
    actorId
  );
  return toCeQuestion(row);
}

export async function updateCeQuestion(
  id: string,
  input: CeQuestionUpdateInput,
  actorId: number
): Promise<CeQuestion> {
  const existing = await findQuestionById(id);
  if (!existing) {
    throw new AppError(404, 'Question not found');
  }
  if (input.text !== undefined && !input.text.trim()) {
    throw new AppError(400, 'text cannot be blank');
  }
  const row = await updateQuestionWithAudit(
    id,
    {
      text: input.text,
      clientFacingPrompt: input.clientFacingPrompt,
      sequence: input.sequence,
      isActive: input.isActive,
      weightNote: input.weightNote,
    },
    actorId
  );
  return toCeQuestion(row);
}

export async function deleteCeQuestion(id: string, actorId: number): Promise<void> {
  const existing = await findQuestionById(id);
  if (!existing) {
    throw new AppError(404, 'Question not found');
  }
  await deleteQuestionWithAudit(id, actorId);
}

// ---- CeAnswerOption ----
// Deliberately no standalone "get one answer option" endpoint — the question
// list (`GET /api/ce/questions`) already nests them; these routes only add/
// edit/remove a row under a question the caller already has.

export async function addCeAnswerOption(
  questionId: string,
  input: { text: string; score: number },
  actorId: number
) {
  const question = await findQuestionById(questionId);
  if (!question) {
    throw new AppError(404, 'Question not found');
  }
  if (!input?.text?.trim()) {
    throw new AppError(400, 'text is required');
  }
  const row = await createAnswerOptionWithAudit(questionId, { text: input.text.trim(), score: input.score }, actorId);
  return { id: row.id, questionId: row.questionId, text: row.text, score: row.score };
}

export async function updateCeAnswerOption(
  id: string,
  input: { text?: string; score?: number },
  actorId: number
) {
  const existing = await findAnswerOptionById(id);
  if (!existing) {
    throw new AppError(404, 'Answer option not found');
  }
  const row = await updateAnswerOptionWithAudit(id, input, actorId);
  return { id: row.id, questionId: row.questionId, text: row.text, score: row.score };
}

export async function deleteCeAnswerOption(id: string, actorId: number): Promise<void> {
  const existing = await findAnswerOptionById(id);
  if (!existing) {
    throw new AppError(404, 'Answer option not found');
  }
  await deleteAnswerOptionWithAudit(id, actorId);
}

// ---- CeScoreBand ----

export async function listCeScoreBands(): Promise<CeScoreBand[]> {
  const rows = await findAllScoreBands();
  return rows.map(toCeScoreBand);
}

function validateScoreBandRange(minScore: number, maxScore: number): void {
  if (minScore > maxScore) {
    throw new AppError(400, 'minScore cannot be greater than maxScore');
  }
}

export async function createCeScoreBand(input: CeScoreBandInput, actorId: number): Promise<CeScoreBand> {
  if (!input?.name?.trim()) {
    throw new AppError(400, 'name is required');
  }
  if (!input.recommendedProjectTypeCodes?.trim()) {
    throw new AppError(400, 'recommendedProjectTypeCodes is required');
  }
  validateScoreBandRange(input.minScore, input.maxScore);
  const row = await createScoreBandWithAudit(input, actorId);
  return toCeScoreBand(row);
}

export async function updateCeScoreBand(
  id: string,
  input: CeScoreBandUpdateInput,
  actorId: number
): Promise<CeScoreBand> {
  const existing = await findScoreBandById(id);
  if (!existing) {
    throw new AppError(404, 'Score band not found');
  }
  const minScore = input.minScore ?? existing.minScore;
  const maxScore = input.maxScore ?? existing.maxScore;
  validateScoreBandRange(minScore, maxScore);
  const row = await updateScoreBandWithAudit(id, input, actorId);
  return toCeScoreBand(row);
}

export async function deleteCeScoreBand(id: string, actorId: number): Promise<void> {
  const existing = await findScoreBandById(id);
  if (!existing) {
    throw new AppError(404, 'Score band not found');
  }
  await deleteScoreBandWithAudit(id, actorId);
}

// ---- CeFlagOverride ----

export async function listCeFlagOverrides(): Promise<CeFlagOverride[]> {
  const rows = await findAllFlagOverrides();
  return rows.map(toCeFlagOverride);
}

function validateFlagOverrideBehavior(behavior: string): void {
  if (!VALID_BEHAVIORS.has(behavior)) {
    throw new AppError(400, "behavior must be 'replace' or 'add'");
  }
}

export async function createCeFlagOverride(input: CeFlagOverrideInput, actorId: number): Promise<CeFlagOverride> {
  if (!input?.flag?.trim()) {
    throw new AppError(400, 'flag is required');
  }
  validateFlagOverrideBehavior(input.behavior);
  const row = await createFlagOverrideWithAudit(input, actorId);
  return toCeFlagOverride(row);
}

export async function updateCeFlagOverride(
  id: string,
  input: CeFlagOverrideUpdateInput,
  actorId: number
): Promise<CeFlagOverride> {
  const existing = await findFlagOverrideById(id);
  if (!existing) {
    throw new AppError(404, 'Flag override not found');
  }
  if (input.behavior !== undefined) {
    validateFlagOverrideBehavior(input.behavior);
  }
  const row = await updateFlagOverrideWithAudit(id, input, actorId);
  return toCeFlagOverride(row);
}

export async function deleteCeFlagOverride(id: string, actorId: number): Promise<void> {
  const existing = await findFlagOverrideById(id);
  if (!existing) {
    throw new AppError(404, 'Flag override not found');
  }
  await deleteFlagOverrideWithAudit(id, actorId);
}

// ---- CeRuleChange (audit log, read-only) ----

export async function listRuleChanges(
  page: number,
  pageSize: number
): Promise<{ items: CeRuleChange[]; total: number; page: number; pageSize: number }> {
  const [rows, total] = await findRuleChanges(page, pageSize);
  return { items: rows.map(toCeRuleChange), total, page, pageSize };
}
