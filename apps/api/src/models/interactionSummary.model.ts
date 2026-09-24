import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type InteractionSummaryRow = Prisma.InteractionSummaryGetPayload<Record<string, never>>;

export function findInteractionSummariesByCase(
  caseId: string,
  search?: string
): Promise<InteractionSummaryRow[]> {
  return prisma.interactionSummary.findMany({
    where: {
      caseId,
      ...(search ? { title: { contains: search } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export function findInteractionSummaryById(id: string): Promise<InteractionSummaryRow | null> {
  return prisma.interactionSummary.findUnique({ where: { id } });
}

export function createInteractionSummary(
  data: Prisma.InteractionSummaryUncheckedCreateInput
): Promise<InteractionSummaryRow> {
  return prisma.interactionSummary.create({ data });
}

export function updateInteractionSummary(
  id: string,
  data: Prisma.InteractionSummaryUncheckedUpdateInput
): Promise<InteractionSummaryRow> {
  return prisma.interactionSummary.update({ where: { id }, data });
}
