import { prisma } from './prismaClient';

export function insertReferralStatusEvent(
  referralId: string,
  fromStatus: string | null,
  toStatus: string,
  changedById: number | null
): Promise<void> {
  return prisma.referralStatusEvent
    .create({ data: { referralId, fromStatus, toStatus, changedById } })
    .then(() => undefined);
}

/**
 * A referral's "sender" — the `changedById` of its earliest event, which is
 * always the creation event (`fromStatus: null`) written alongside the
 * referral itself. See design.md Decision 2.
 */
export function findEarliestEventForReferral(
  referralId: string
): Promise<{ changedById: number | null } | null> {
  return prisma.referralStatusEvent.findFirst({
    where: { referralId },
    orderBy: { changedAt: 'asc' },
    select: { changedById: true },
  });
}

const PENDING_STATUSES = ['pending', 'new'] as const;

export interface PendingReferralRow {
  id: string;
  title: string;
  client: { firstName: string; lastName: string };
  program: { name: string } | null;
}

/**
 * Referrals routed to the requesting case manager's own inbound queue — see
 * design.md Decision 3 for why this stands in for real org/program routing.
 */
export function findPendingReferralsForUser(userId: number): Promise<PendingReferralRow[]> {
  return prisma.referral.findMany({
    where: {
      status: { in: [...PENDING_STATUSES] },
      OR: [{ caseId: null }, { case: { assignedCaseManagerId: userId } }],
    },
    select: {
      id: true,
      title: true,
      client: { select: { firstName: true, lastName: true } },
      program: { select: { name: true } },
    },
    orderBy: { referralDate: 'desc' },
  });
}

export interface StatusUpdateRow {
  id: string;
  referralId: string;
  referralTitle: string;
  toStatus: string;
  changedAt: Date;
}

/**
 * Status events on referrals the requesting user sent (per
 * `findEarliestEventForReferral`'s "earliest event's `changedById`" rule),
 * not yet seen, and not the user's own action.
 */
export async function findUnseenStatusUpdatesForSender(userId: number): Promise<StatusUpdateRow[]> {
  const rows = await prisma.$queryRaw<
    { id: string; referralId: string; referralTitle: string; toStatus: string; changedAt: Date }[]
  >`
    SELECT e.id, e.referralId, r.title as referralTitle, e.toStatus, e.changedAt
    FROM ReferralStatusEvent e
    INNER JOIN Referral r ON r.id = e.referralId
    WHERE e.seenByReferrerAt IS NULL
      AND e.changedById IS NOT NULL
      AND e.changedById != ${userId}
      AND e.referralId IN (
        SELECT first.referralId FROM (
          SELECT referralId, changedById,
            ROW_NUMBER() OVER (PARTITION BY referralId ORDER BY changedAt ASC) as rn
          FROM ReferralStatusEvent
        ) first
        WHERE first.rn = 1 AND first.changedById = ${userId}
      )
    ORDER BY e.changedAt DESC
  `;
  return rows;
}

export function markStatusUpdatesSeen(userId: number): Promise<number> {
  return prisma.$executeRaw`
    UPDATE ReferralStatusEvent e
    INNER JOIN Referral r ON r.id = e.referralId
    SET e.seenByReferrerAt = NOW()
    WHERE e.seenByReferrerAt IS NULL
      AND e.changedById IS NOT NULL
      AND e.changedById != ${userId}
      AND e.referralId IN (
        SELECT referralId FROM (
          SELECT referralId, changedById,
            ROW_NUMBER() OVER (PARTITION BY referralId ORDER BY changedAt ASC) as rn
          FROM ReferralStatusEvent
        ) first
        WHERE first.rn = 1 AND first.changedById = ${userId}
      )
  `;
}
