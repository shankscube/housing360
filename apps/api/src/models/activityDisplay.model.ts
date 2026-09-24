import { prisma } from './prismaClient';

export interface ActivityDisplay {
  title: string;
  subtitle: string;
  icon: string;
}

function key(recordType: string, recordId: string): string {
  return `${recordType}:${recordId}`;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Batch-resolves (recordType, recordId) pairs from `record_activity` into
 * display-ready {title, subtitle, icon}, one Prisma query per record type
 * rather than one per row. A record that no longer exists is simply omitted
 * from the returned map — callers (see `recentActivity.service.ts`) skip any
 * row they can't resolve rather than erroring, per the activity-feed spec's
 * "logging failure never blocks" defensiveness.
 */
export async function resolveActivityDisplays(
  rows: { recordType: string; recordId: string }[]
): Promise<Map<string, ActivityDisplay>> {
  const idsByType = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = idsByType.get(row.recordType) ?? new Set<string>();
    set.add(row.recordId);
    idsByType.set(row.recordType, set);
  }

  const result = new Map<string, ActivityDisplay>();

  const clientIds = Array.from(idsByType.get('client') ?? []);
  const caseIds = Array.from(idsByType.get('case') ?? []);
  const referralIds = Array.from(idsByType.get('referral') ?? []);
  const assessmentIds = Array.from(idsByType.get('assessment') ?? []);

  const [clients, cases, referrals, assessments] = await Promise.all([
    clientIds.length > 0
      ? prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : Promise.resolve([]),
    caseIds.length > 0
      ? prisma.case.findMany({
          where: { id: { in: caseIds } },
          select: { id: true, subject: true, caseNumber: true },
        })
      : Promise.resolve([]),
    referralIds.length > 0
      ? prisma.referral.findMany({
          where: { id: { in: referralIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    assessmentIds.length > 0
      ? prisma.assessment.findMany({
          where: { id: { in: assessmentIds } },
          select: {
            id: true,
            type: true,
            client: { select: { firstName: true, lastName: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  for (const client of clients) {
    result.set(key('client', client.id), {
      title: `${client.firstName} ${client.lastName}`,
      subtitle: 'Client',
      icon: 'users',
    });
  }

  for (const caseRow of cases) {
    result.set(key('case', caseRow.id), {
      title: caseRow.subject || caseRow.caseNumber,
      subtitle: caseRow.caseNumber,
      icon: 'cases',
    });
  }

  for (const referral of referrals) {
    result.set(key('referral', referral.id), {
      title: referral.title,
      subtitle: 'Referral',
      icon: 'refer',
    });
  }

  for (const assessment of assessments) {
    result.set(key('assessment', assessment.id), {
      title: `${capitalize(assessment.type ?? 'Entry')} Assessment`,
      subtitle: `${assessment.client.firstName} ${assessment.client.lastName}`,
      icon: 'assess',
    });
  }

  return result;
}
