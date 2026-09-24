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
  stageParamToDataCollectionStage,
  updateAssessment as updateAssessmentRow,
  upsertAssessment,
} from '../models/assessment.model';
import {
  assessmentSectionFieldsToWriteData,
  toAssessment,
  toAssessmentDetail,
  toAssessmentListItem,
} from '../models/assessment.mapper';
import { scoringService } from './scoring.service';
import { stageToAssessmentType } from '../constants/assessmentTypes';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = 1;
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

/** Only `ScoringService.scoreAssessment` may set `score`/`scoreLabel` — see
 * `assessment-tracking` spec's "Scoring Is Produced by a Dedicated Scoring
 * Service" requirement. Called whenever a save's resulting status is
 * `completed`, on both create and patch. */
function scoreIfCompleted(row: {
  status: string;
  type: string | null;
  chronicHomelessness: string | null;
  monthsHomelessPast3Years: string | null;
  incomeFromAnySource: string | null;
  domesticViolenceSurvivor: string | null;
}): { score: number; scoreLabel: string } | null {
  if (row.status !== COMPLETED_STATUS) {
    return null;
  }
  const result = scoringService.scoreAssessment({
    type: (row.type as 'entry' | 'annual' | 'exit' | null) ?? 'entry',
    chronicHomelessness: row.chronicHomelessness,
    monthsHomelessPast3Years: row.monthsHomelessPast3Years,
    incomeFromAnySource: row.incomeFromAnySource,
    domesticViolenceSurvivor: row.domesticViolenceSurvivor,
  });
  return { score: result.score, scoreLabel: result.label };
}

/**
 * `POST /assessments` — upsert keyed on the compound unique
 * `(programEnrollmentId, dataCollectionStage, cycleNumber)` so re-submitting the same
 * enrollment's Entry Assessment (steps 4-6 resubmitted) never creates a second row.
 * `status` isn't part of the typed `AssessmentInput` shape but is accepted as an
 * optional passthrough field, defaulting to `'in_progress'` on create. `score`/
 * `scoreLabel` are never accepted from the request body — they're computed here via
 * `scoreIfCompleted` whenever the resulting status is `completed`.
 */
export async function createOrUpsertAssessment(
  input: AssessmentInput & { status?: string; score?: unknown; scoreLabel?: unknown }
): Promise<Assessment> {
  const dataCollectionStage = input.dataCollectionStage ?? ENTRY_STAGE;
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
  const scored = scoreIfCompleted({
    status: resolvedStatus,
    type: resolvedType,
    chronicHomelessness: sectionFields.chronicHomelessness ?? null,
    monthsHomelessPast3Years: sectionFields.monthsHomelessPast3Years ?? null,
    incomeFromAnySource: sectionFields.incomeFromAnySource ?? null,
    domesticViolenceSurvivor: sectionFields.domesticViolenceSurvivor ?? null,
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
      score: scored?.score ?? null,
      scoreLabel: scored?.scoreLabel ?? null,
    },
    {
      ...writeData,
      cycleNumber,
      type: resolvedType,
      dueDate: dueDate ?? null,
      status: resolvedStatus,
      score: scored?.score ?? null,
      scoreLabel: scored?.scoreLabel ?? null,
    },
    cycleNumber
  );

  return toAssessment(row);
}

/** Global Assessment Command Center list (`GET /api/assessments`) — status +
 * type filters AND together; `kpis` reflects the full unfiltered set, same
 * "KPI row loads from one fetch, independent of the active filter" contract
 * as `case.service.ts`'s `listCases`. */
export async function listAssessments(query: AssessmentListQuery): Promise<AssessmentListResult> {
  const { page, pageSize } = normalizePagination(query);
  const filter = query.filter ?? 'all';

  const [{ rows, total }, kpis] = await Promise.all([
    findAssessments({ page, pageSize, filter, typeFilter: query.typeFilter, search: query.search }),
    countAssessmentKpis(),
  ]);

  return { items: rows.map(toAssessmentListItem), total, page, pageSize, kpis };
}

/** `GET /api/assessments/:id` — score/scoreLabel included for the detail view's
 * prominent display; `null` until the assessment reaches `completed`. */
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

export async function discardAssessment(id: string): Promise<void> {
  const existing = await findAssessmentById(id);
  if (!existing) {
    throw new AppError(404, 'Assessment not found');
  }
  if (existing.status !== 'in_progress') {
    throw new AppError(400, 'Only a draft assessment can be discarded');
  }
  await deleteAssessmentRow(id);
}

/** `PATCH /assessments/:id` — plain update by id; sets whichever fields were provided.
 * `score`/`scoreLabel` are never accepted from the request body (destructured out and
 * discarded below) — they're recomputed here via `scoreIfCompleted` whenever the
 * resulting status is `completed`. */
export async function patchAssessment(
  id: string,
  input: AssessmentUpdateInput & { score?: unknown; scoreLabel?: unknown }
): Promise<Assessment> {
  const existing = await findAssessmentById(id);
  if (!existing) {
    throw new AppError(404, 'Assessment not found');
  }

  const { dataCollectionStage, type, dueDate, cycleNumber, status, score, scoreLabel, ...sectionFields } =
    input;
  void score;
  void scoreLabel;
  const writeData = assessmentSectionFieldsToWriteData(sectionFields);

  const resolvedStatus = status ?? existing.status;
  const scored = scoreIfCompleted({
    status: resolvedStatus,
    type: type ?? existing.type,
    chronicHomelessness: sectionFields.chronicHomelessness ?? existing.chronicHomelessness,
    monthsHomelessPast3Years:
      sectionFields.monthsHomelessPast3Years ?? existing.monthsHomelessPast3Years,
    incomeFromAnySource: sectionFields.incomeFromAnySource ?? existing.incomeFromAnySource,
    domesticViolenceSurvivor:
      sectionFields.domesticViolenceSurvivor ?? existing.domesticViolenceSurvivor,
  });

  const row = await updateAssessmentRow(id, {
    ...writeData,
    ...(dataCollectionStage !== undefined ? { dataCollectionStage } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(dueDate !== undefined ? { dueDate } : {}),
    ...(cycleNumber !== undefined ? { cycleNumber } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(scored ? { score: scored.score, scoreLabel: scored.scoreLabel } : {}),
  });

  return toAssessment(row);
}
