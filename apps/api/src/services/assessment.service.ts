import type { Assessment, AssessmentInput, AssessmentListItem, AssessmentUpdateInput } from '@housing360/types';
import {
  deleteAssessment as deleteAssessmentRow,
  findAssessmentByEnrollmentAndStage,
  findAssessmentById,
  findAssessmentsByEnrollment,
  stageParamToDataCollectionStage,
  updateAssessment as updateAssessmentRow,
  upsertAssessment,
} from '../models/assessment.model';
import { assessmentSectionFieldsToWriteData, toAssessment } from '../models/assessment.mapper';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = 1;
const DEFAULT_STATUS = 'in_progress';

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

/**
 * `POST /assessments` — upsert keyed on the compound unique
 * `(programEnrollmentId, dataCollectionStage)` so re-submitting the same enrollment's
 * Entry Assessment (steps 4-6 resubmitted) never creates a second row. `status` isn't
 * part of the typed `AssessmentInput` shape but is accepted as an optional passthrough
 * field, defaulting to `'in_progress'` on create.
 */
export async function createOrUpsertAssessment(
  input: AssessmentInput & { status?: string }
): Promise<Assessment> {
  const dataCollectionStage = input.dataCollectionStage ?? ENTRY_STAGE;
  const { clientId, programEnrollmentId, caseId, status, ...sectionFields } = input;

  const writeData = assessmentSectionFieldsToWriteData(sectionFields);

  const row = await upsertAssessment(
    programEnrollmentId,
    dataCollectionStage,
    {
      clientId,
      programEnrollmentId,
      caseId,
      dataCollectionStage,
      status: status ?? DEFAULT_STATUS,
      ...writeData,
    },
    writeData
  );

  return toAssessment(row);
}

/** `case-workspace`'s Assessments tab — every stage on this enrollment, not just Entry. `score` is always `null` (design.md Non-Goals). */
export async function listAssessmentsByEnrollment(programEnrollmentId: string): Promise<AssessmentListItem[]> {
  const rows = await findAssessmentsByEnrollment(programEnrollmentId);
  return rows.map((row) => ({
    id: row.id,
    programEnrollmentId: row.programEnrollmentId,
    dataCollectionStage: row.dataCollectionStage,
    assessmentDate: row.assessmentDate.toISOString(),
    status: row.status,
    score: null,
  }));
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

/** `PATCH /assessments/:id` — plain update by id; sets whichever fields were provided. */
export async function patchAssessment(
  id: string,
  input: AssessmentUpdateInput
): Promise<Assessment> {
  const existing = await findAssessmentById(id);
  if (!existing) {
    throw new AppError(404, 'Assessment not found');
  }

  const { dataCollectionStage, ...sectionFields } = input;
  const writeData = assessmentSectionFieldsToWriteData(sectionFields);

  const row = await updateAssessmentRow(id, {
    ...writeData,
    ...(dataCollectionStage !== undefined ? { dataCollectionStage } : {}),
  });

  return toAssessment(row);
}
