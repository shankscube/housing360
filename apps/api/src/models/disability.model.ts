import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type DisabilityRow = Prisma.DisabilityGetPayload<Record<string, never>>;

export function createDisability(
  data: Prisma.DisabilityUncheckedCreateInput
): Promise<DisabilityRow> {
  return prisma.disability.create({ data });
}

export function findDisabilityById(id: string): Promise<DisabilityRow | null> {
  return prisma.disability.findUnique({ where: { id } });
}

export function deleteDisability(id: string): Promise<DisabilityRow> {
  return prisma.disability.delete({ where: { id } });
}

/** Used by the intake-snapshot endpoint to list an enrollment's existing disability records. */
export function findDisabilitiesByAssessmentId(assessmentId: string): Promise<DisabilityRow[]> {
  return prisma.disability.findMany({ where: { assessmentId } });
}

/** `PUT /api/assessments/:id/disabilities` (`assessment-and-ce-workspace`) —
 * replaces the assessment's full disability set in one call: delete
 * everything currently on the assessment, then create the new set, in one
 * transaction (assessment-tracking spec's "Disabilities Are Edited as a
 * Replaceable Set" requirement). */
export function replaceDisabilitiesForAssessment(
  assessmentId: string,
  disabilities: Omit<Prisma.DisabilityUncheckedCreateInput, 'assessmentId'>[]
): Promise<DisabilityRow[]> {
  return prisma.$transaction(async (tx) => {
    await tx.disability.deleteMany({ where: { assessmentId } });
    if (disabilities.length === 0) {
      return [];
    }
    await tx.disability.createMany({
      data: disabilities.map((disability) => ({ ...disability, assessmentId })),
    });
    return tx.disability.findMany({ where: { assessmentId } });
  });
}
