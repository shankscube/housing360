import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type ScoringRuleRow = Prisma.ScoringRuleGetPayload<Record<string, never>>;

/** `HousingStabilityScoringService` reads only active rules — see design.md Decision 4. */
export function findActiveScoringRules(): Promise<ScoringRuleRow[]> {
  return prisma.scoringRule.findMany({ where: { isActive: true } });
}
