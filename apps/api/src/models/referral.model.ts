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

/**
 * `pending` (internal referrals' default) / `new` (Coordinated Entry's Send
 * Referral step) — same open-referral vocabulary `referral.service.ts` and
 * `coordinatedEntry.service.ts` already write, not accepted/declined.
 * Home dashboard's "Open Referrals" KPI — home-dashboard design.md Decision 1.
 */
export function countOpenReferrals(): Promise<number> {
  return prisma.referral.count({ where: { status: { in: ['pending', 'new'] } } });
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

/**
 * A Coordinated Entry referral (`assessments-and-coordinated-entry`) is created
 * with `caseId: null` — no case exists yet at that point in the flow. Once a
 * case is later opened for that same client, its referrals should surface
 * through the existing case-scoped Referrals tab rather than needing a
 * dedicated pre-case referral UI (`coordinated-entry` spec's "visible to
 * existing referral listings" requirement) — called from `case.service.ts`'s
 * `ensureCase`/`createCase`.
 */
export async function attachOrphanReferralsToCase(clientId: string, caseId: string): Promise<void> {
  await prisma.referral.updateMany({ where: { clientId, caseId: null }, data: { caseId } });
}
