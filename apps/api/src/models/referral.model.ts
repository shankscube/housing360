import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const REFERRAL_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
  program: { select: { name: true } },
  providerOrg: { select: { name: true } },
  referrerOrg: { select: { name: true } },
} satisfies Prisma.ReferralInclude;

export type ReferralRow = Prisma.ReferralGetPayload<{ include: typeof REFERRAL_INCLUDE }>;

export function countReferralsByCase(caseId: string): Promise<number> {
  return prisma.referral.count({ where: { caseId } });
}

export function findReferralsByCase(caseId: string): Promise<ReferralRow[]> {
  return prisma.referral.findMany({
    where: { caseId },
    include: REFERRAL_INCLUDE,
    orderBy: { referralDate: 'desc' },
  });
}

export function findReferralById(id: string): Promise<ReferralRow | null> {
  return prisma.referral.findUnique({ where: { id }, include: REFERRAL_INCLUDE });
}

export function createReferral(data: Prisma.ReferralUncheckedCreateInput): Promise<ReferralRow> {
  return prisma.referral.create({ data, include: REFERRAL_INCLUDE });
}

export function updateReferral(
  id: string,
  data: Prisma.ReferralUncheckedUpdateInput
): Promise<ReferralRow> {
  return prisma.referral.update({ where: { id }, data, include: REFERRAL_INCLUDE });
}
