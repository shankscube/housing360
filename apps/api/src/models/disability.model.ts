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
