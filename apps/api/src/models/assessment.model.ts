import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

/** Full row shape for an `Assessment`, including every Living-Situation /
 * Income-Benefits-Insurance / Health-DV field — there is no list-safe subset
 * for assessments (unlike `Client`), since nothing here is PII in the same
 * sense SSN/DOB are. */
export type AssessmentRow = Prisma.AssessmentGetPayload<Record<string, never>>;

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

export function findAssessmentByEnrollmentAndStage(
  programEnrollmentId: string,
  dataCollectionStage: number
): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({
    where: {
      programEnrollmentId_dataCollectionStage: {
        programEnrollmentId,
        dataCollectionStage,
      },
    },
  });
}

export function findAssessmentById(id: string): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({ where: { id } });
}

/** `case-workspace`'s Assessments tab list — every stage recorded for an enrollment, not just Entry. */
export function findAssessmentsByEnrollment(programEnrollmentId: string): Promise<AssessmentRow[]> {
  return prisma.assessment.findMany({
    where: { programEnrollmentId },
    orderBy: { dataCollectionStage: 'asc' },
  });
}

export function deleteAssessment(id: string): Promise<AssessmentRow> {
  return prisma.assessment.delete({ where: { id } });
}

/** Upsert keyed on the compound unique `(programEnrollmentId, dataCollectionStage)` —
 * required so re-saving the same enrollment's Entry Assessment (steps 4-6
 * resubmitted) never creates a second row. See design.md's "Exactly one Entry
 * Assessment per enrollment" decision. */
export function upsertAssessment(
  programEnrollmentId: string,
  dataCollectionStage: number,
  createData: Prisma.AssessmentUncheckedCreateInput,
  updateData: Prisma.AssessmentUncheckedUpdateInput
): Promise<AssessmentRow> {
  return prisma.assessment.upsert({
    where: {
      programEnrollmentId_dataCollectionStage: {
        programEnrollmentId,
        dataCollectionStage,
      },
    },
    create: createData,
    update: updateData,
  });
}

export function updateAssessment(
  id: string,
  data: Prisma.AssessmentUncheckedUpdateInput
): Promise<AssessmentRow> {
  return prisma.assessment.update({ where: { id }, data });
}
