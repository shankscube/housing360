import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type InteractionSummaryRow = Prisma.InteractionSummaryGetPayload<Record<string, never>>;

export function createInteractionSummary(
  data: Prisma.InteractionSummaryUncheckedCreateInput
): Promise<InteractionSummaryRow> {
  return prisma.interactionSummary.create({ data });
}
