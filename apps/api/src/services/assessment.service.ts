import type {
  Assessment,
  AssessmentDetail,
  AssessmentInput,
  AssessmentListItem,
  AssessmentListQuery,
  AssessmentListResult,
  AssessmentUpdateInput,
} from '@housing360/types';
import {
  countAssessmentKpis,
  deleteAssessment as deleteAssessmentRow,
  findAssessmentByEnrollmentAndStage,
  findAssessmentById,
  findAssessmentDetailById,
  findAssessments,
  findAssessmentsByEnrollment,
  findLatestAssessmentForCarryForward,
  recordProgramExit,
  stageParamToDataCollectionStage,
  updateAssessment as updateAssessmentRow,
  upsertAssessment,
  type ExitWriteInput,
  type ScoringWriteInput,
} from '../models/assessment.model';
import {
  assessmentSectionFieldsToWriteData,
  toAssessment,
  toAssessmentDetail,
  toAssessmentListItem,
} from '../models/assessment.mapper';
import { findDisabilitiesByAssessmentId } from '../models/disability.model';
import { scoreAssessment as computeHousingStabilityScore } from './housingStabilityScoring.service';
import { assessmentTypeToStage, stageToAssessmentType } from '../constants/assessmentTypes';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = 1;
const EXIT_STAGE = assessmentTypeToStage('exit');
const DEFAULT_STATUS = 'in_progress';
const COMPLETED_STATUS = 'completed';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePagination(query: AssessmentListQuery): { page: number; pageSize: number } {
  const page =
    query.page !== undefined && Number.isFinite(query.page) && query.page > 0
      ? Math.floor(query.page)
      : DEFAULT_PAGE;
  const pageSize =
    query.pageSize !== undefined && Number.isFinite(query.pageSize) && query.pageSize > 0
      ? Math.min(Math.floor(query.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

/**
 * `GET /enrollments/:id/assessments?stage=entry` — "no assessment yet" is a normal
 * state, not a failure, so this returns `null` rather than throwing/404ing.
 */
export async function getAssessmentForEnrollment(
  programEnrollmentId: string,
  stageParam: string | undefined
): Promise<Assessment | null> {
  const dataCollectionStage = stageParamToDataCollectionStage(stageParam);
  const row = await findAssessmentByEnrollmentAndStage(programEnrollmentId, dataCollectionStage);
  return row ? toAssessment(row) : null;
}

interface ExitDetailsSource {
  destinationType?: string | null;
  destination?: string | null;
  caseManagerExitReason?: string | null;
  exitDate?: string | null;
}

interface ScoringAndExitParams {
  status: string;
  resolvedType: string;
  dataCollectionStage: number;
  programEnrollmentId: string;
  /** The assessment row this save is updating, if one already exists — used
   * both for the disability-count lookup and to fill in any field this
   * particular save didn't touch (see `fields` below). `null` for a brand
   * new assessment (which, by construction, can't have disability rows yet). */
  existingAssessmentId: string | null;
  /** Every field value the scoring engine might reference, merged from the
   * existing row (if any) and this save's own input — a `ScoringRule` can
   * target any Assessment column, not just the ones this particular PATCH
   * happened to include. */
  fields: Record<string, unknown>;
  exitDetails: ExitDetailsSource;
}

interface ScoringAndExitResult {
  score: number | null;
  scoreLabel: string | null;
  scoringWrite: ScoringWriteInput | null;
  exitWrite: ExitWriteInput | null;
}

/**
 * Computes the score (via `HousingStabilityScoringService`, the only place
 * `score`/`scoreLabel` may be produced — see the assessment-tracking spec's
 * "Scoring Is Produced by a Dedicated Scoring Service" requirement) and the
 * Exit Details write, both only when this save transitions the assessment to
 * `completed`; otherwise both come back `null` so the caller leaves the
 * existing score/scoreLabel and skips `ProgramExit` entirely (design.md
 * Decisions 3 and 4).
 */
async function computeScoringAndExit(params: ScoringAndExitParams): Promise<ScoringAndExitResult> {
  if (params.status !== COMPLETED_STATUS) {
    return { score: null, scoreLabel: null, scoringWrite: null, exitWrite: null };
  }

  const disabilityCount = params.existingAssessmentId
    ? (await findDisabilitiesByAssessmentId(params.existingAssessmentId)).length
    : 0;
  const { score, label, contributions } = await computeHousingStabilityScore(params.fields, disabilityCount);

  const isExitStage = params.dataCollectionStage === EXIT_STAGE || params.resolvedType === 'exit';
  const exitWrite: ExitWriteInput | null = isExitStage
    ? {
        programEnrollmentId: params.programEnrollmentId,
        destinationType: params.exitDetails.destinationType ?? null,
        destination: params.exitDetails.destination ?? null,
        caseManagerExitReason: params.exitDetails.caseManagerExitReason ?? null,
        exitDate: params.exitDetails.exitDate ? new Date(params.exitDetails.exitDate) : new Date(),
      }
    : null;

  return { score, scoreLabel: label, scoringWrite: { contributions }, exitWrite };
}

/**
 * `POST /assessments` — upsert keyed on the compound unique
 * `(programEnrollmentId, dataCollectionStage, cycleNumber)` so re-submitting the same
 * enrollment's Entry Assessment (steps 4-6 resubmitted) never creates a second row.
 * `status` isn't part of the typed `AssessmentInput` shape but is accepted as an
 * optional passthrough field, defaulting to `'in_progress'` on create. `score`/
 * `scoreLabel` are never accepted from the request body — they're computed via
 * `HousingStabilityScoringService` whenever the resulting status is `completed`.
 * `assessorId` (`assessment-and-ce-workspace`) is always taken from `req.user.id`,
 * never accepted from the body — same "who did this" convention as `Case.createdById`/
 * `updatedById` — and is (re)written on every save, so it always reflects whoever
 * most recently recorded the assessment.
 */
export async function createOrUpsertAssessment(
  input: AssessmentInput & { status?: string; score?: unknown; scoreLabel?: unknown },
  assessorId: number
): Promise<Assessment> {
  // `dataCollectionStage` is derived from `type` when the caller supplies a
  // type but not an explicit stage — the Launch Assessment modal (and any
  // other assessment-and-ce-workspace caller) always passes `type`, never
  // `dataCollectionStage`. Without this, every such create silently defaulted
  // to `ENTRY_STAGE` and, via the upsert-by-(programEnrollmentId,
  // dataCollectionStage, cycleNumber) key, clobbered whatever Entry
  // assessment already existed on the enrollment — found via a live
  // end-to-end run of the Annual-assessment flow (task 11.1), not by any
  // unit-level check. Only the intake wizard's own calls (which never pass
  // `type`) still rely on the `ENTRY_STAGE` fallback below.
  const dataCollectionStage =
    input.dataCollectionStage ?? (input.type ? assessmentTypeToStage(input.type) : ENTRY_STAGE);
  const cycleNumber = input.cycleNumber ?? 1;
  const {
    clientId,
    programEnrollmentId,
    caseId,
    status,
    type,
    dueDate,
    score: clientSuppliedScore,
    scoreLabel: clientSuppliedScoreLabel,
    dataCollectionStage: inputDataCollectionStage,
    cycleNumber: inputCycleNumber,
    destinationType,
    destination,
    caseManagerExitReason,
    exitDate,
    ...sectionFields
  } = input;
  void inputDataCollectionStage;
  void inputCycleNumber;
  void clientSuppliedScore;
  void clientSuppliedScoreLabel;

  // `type` mirrors `dataCollectionStage` (design.md Decision 1) — the intake
  // wizard's own calls never pass `type` explicitly, so it's derived from the
  // stage whenever the caller doesn't supply one, the same way `cycleNumber`
  // defaults to `1` for every pre-existing call site.
  const resolvedType = type ?? stageToAssessmentType(dataCollectionStage);
  const writeData = assessmentSectionFieldsToWriteData(sectionFields);
  const resolvedStatus = status ?? DEFAULT_STATUS;

  // Resubmitting an existing row (e.g. steps 4-6 re-saved) via the upsert —
  // fetched up front so scoring sees the full field set, not just this call's.
  const existing = await findAssessmentByEnrollmentAndStage(programEnrollmentId, dataCollectionStage, cycleNumber);
  const mergedFields: Record<string, unknown> = { ...(existing ?? {}), ...sectionFields };

  const { score, scoreLabel, scoringWrite, exitWrite } = await computeScoringAndExit({
    status: resolvedStatus,
    resolvedType,
    dataCollectionStage,
    programEnrollmentId,
    existingAssessmentId: existing?.id ?? null,
    fields: mergedFields,
    exitDetails: { destinationType, destination, caseManagerExitReason, exitDate },
  });

  const row = await upsertAssessment(
    programEnrollmentId,
    dataCollectionStage,
    {
      ...writeData,
      clientId,
      programEnrollmentId,
      caseId,
      dataCollectionStage,
      cycleNumber,
      type: resolvedType,
      dueDate: dueDate ?? null,
      status: resolvedStatus,
      score,
      scoreLabel,
      assessorId,
    },
    {
      ...writeData,
      cycleNumber,
      type: resolvedType,
      dueDate: dueDate ?? null,
      status: resolvedStatus,
      score,
      scoreLabel,
      assessorId,
    },
    cycleNumber,
    scoringWrite,
    exitWrite
  );

  return toAssessment(row);
}

/** Global Assessment Command Center list (`GET /api/assessments`) — status +
 * type filters AND together; `kpis` reflects the full unfiltered set, same
 * "KPI row loads from one fetch, independent of the active filter" contract
 * as `case.service.ts`'s `listCases`. Also serves as the "dashboard" fetch
 * (task 4.1) — see this file's controller for why no separate `/dashboard`
 * route was added. */
export async function listAssessments(query: AssessmentListQuery): Promise<AssessmentListResult> {
  const { page, pageSize } = normalizePagination(query);
  const filter = query.filter ?? 'all';

  const [{ rows, total }, kpis] = await Promise.all([
    findAssessments({ page, pageSize, filter, typeFilter: query.typeFilter, search: query.search }),
    countAssessmentKpis(),
  ]);

  return { items: rows.map(toAssessmentListItem), total, page, pageSize, kpis };
}

/** `GET /api/assessments/:id` — score/scoreLabel/contributions/disabilities
 * included for the detail view; score fields are `null` until the assessment
 * reaches `completed`. */
export async function getAssessmentDetail(id: string): Promise<AssessmentDetail> {
  const row = await findAssessmentDetailById(id);
  if (!row) {
    throw new AppError(404, 'Assessment not found');
  }
  return toAssessmentDetail(row);
}

/** `case-workspace`'s Assessments tab — every stage on this enrollment, not just Entry. */
export async function listAssessmentsByEnrollment(programEnrollmentId: string): Promise<AssessmentListItem[]> {
  const rows = await findAssessmentsByEnrollment(programEnrollmentId);
  return rows.map(toAssessmentListItem);
}

/** `GET /api/enrollments/:id/latest-assessment-values` — "Carry forward
 * previous answers," scoped to this one enrollment only (assessment-tracking
 * spec's "Carry Forward Pre-Fills From the Most Recent Assessment on the
 * Enrollment" requirement). */
export async function getLatestAssessmentValuesForEnrollment(
  programEnrollmentId: string
): Promise<Assessment | null> {
  const row = await findLatestAssessmentForCarryForward(programEnrollmentId);
  return row ? toAssessment(row) : null;
}

/**
 * `POST /api/enrollments/:id/exit` — see `assessment.model.ts`'s
 * `recordProgramExit` for why this always needs an already-existing
 * assessment id (`ProgramExit.assessmentId` is a required unique column).
 * Primarily reused internally by Exit-assessment completion (task 3.4, via
 * `computeScoringAndExit`/`upsertAssessment`/`updateAssessment`'s own
 * transaction) — this standalone endpoint exists so the route is directly
 * callable too, per task 4.6.
 */
export async function exitEnrollment(
  programEnrollmentId: string,
  input: { assessmentId: string } & ExitDetailsSource
): Promise<void> {
  const assessment = await findAssessmentById(input.assessmentId);
  if (!assessment || assessment.programEnrollmentId !== programEnrollmentId) {
    throw new AppError(404, 'Assessment not found on this enrollment');
  }
  await recordProgramExit(input.assessmentId, {
    programEnrollmentId,
    destinationType: input.destinationType ?? null,
    destination: input.destination ?? null,
    caseManagerExitReason: input.caseManagerExitReason ?? null,
    exitDate: input.exitDate ? new Date(input.exitDate) : new Date(),
  });
}

/** `DELETE /api/assessments/:id` — 409 (not 400) for a completed assessment,
 * per the assessment-tracking spec's "Discarding an Assessment Is Limited to
 * Drafts" requirement. Cascades to `Disability`/`AssessmentScoreContribution`
 * rows via the schema's own `onDelete: Cascade`. */
export async function discardAssessment(id: string): Promise<void> {
  const existing = await findAssessmentById(id);
  if (!existing) {
    throw new AppError(404, 'Assessment not found');
  }
  if (existing.status === COMPLETED_STATUS) {
    throw new AppError(409, 'A completed assessment cannot be discarded');
  }
  await deleteAssessmentRow(id);
}

/** `PATCH /assessments/:id` — plain update by id; sets whichever fields were provided.
 * `score`/`scoreLabel` are never accepted from the request body (destructured out and
 * discarded below) — they're recomputed via `HousingStabilityScoringService` whenever
 * the resulting status is `completed`. `assessorId` is always `req.user.id` — see
 * `createOrUpsertAssessment`'s doc comment. */
export async function patchAssessment(
  id: string,
  input: AssessmentUpdateInput & { score?: unknown; scoreLabel?: unknown },
  assessorId: number
): Promise<Assessment> {
  const existing = await findAssessmentById(id);
  if (!existing) {
    throw new AppError(404, 'Assessment not found');
  }

  const {
    dataCollectionStage,
    type,
    dueDate,
    cycleNumber,
    status,
    score,
    scoreLabel,
    destinationType,
    destination,
    caseManagerExitReason,
    exitDate,
    ...sectionFields
  } = input;
  void score;
  void scoreLabel;
  const writeData = assessmentSectionFieldsToWriteData(sectionFields);

  const resolvedStatus = status ?? existing.status;
  const resolvedStage = dataCollectionStage ?? existing.dataCollectionStage;
  const resolvedType = type ?? existing.type ?? stageToAssessmentType(resolvedStage);
  // Merge with the existing row so scoring sees every field, not just the
  // ones this particular PATCH happened to include.
  const mergedFields: Record<string, unknown> = { ...existing, ...sectionFields };

  const {
    score: computedScore,
    scoreLabel: computedScoreLabel,
    scoringWrite,
    exitWrite,
  } = await computeScoringAndExit({
    status: resolvedStatus,
    resolvedType,
    dataCollectionStage: resolvedStage,
    programEnrollmentId: existing.programEnrollmentId,
    existingAssessmentId: existing.id,
    fields: mergedFields,
    exitDetails: { destinationType, destination, caseManagerExitReason, exitDate },
  });

  const row = await updateAssessmentRow(
    id,
    {
      ...writeData,
      ...(dataCollectionStage !== undefined ? { dataCollectionStage } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(cycleNumber !== undefined ? { cycleNumber } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(computedScore !== null ? { score: computedScore, scoreLabel: computedScoreLabel } : {}),
      assessorId,
    },
    scoringWrite,
    exitWrite
  );

  return toAssessment(row);
}
