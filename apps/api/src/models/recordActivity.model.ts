import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

/**
 * Append-only — one row per view/modify, never an upsert. Reads (below)
 * dedupe to the latest row per `(recordType, recordId)` — see
 * `home-workspace` design.md Decision 1.
 */
export function insertRecordActivity(
  userId: number,
  recordType: string,
  recordId: string,
  action: string
): Promise<void> {
  return prisma.recordActivity
    .create({ data: { userId, recordType, recordId, action } })
    .then(() => undefined);
}

export interface RecordActivityRow {
  recordType: string;
  recordId: string;
  action: string;
  at: Date;
}

/**
 * The requesting user's own activity, one row per distinct record reflecting
 * its most recent action/timestamp — MySQL has no `DISTINCT ON`, so this
 * groups by `(recordType, recordId)` for the max `at`, then joins back to get
 * that row's `action`. `page`/`pageSize` paginate the deduplicated set.
 */
export async function findRecentActivityForUser(
  userId: number,
  recordType: string | undefined,
  page: number,
  pageSize: number
): Promise<{ rows: RecordActivityRow[]; total: number }> {
  const typeFilter = recordType ? Prisma.sql`AND recordType = ${recordType}` : Prisma.empty;

  const latestPerRecord = await prisma.$queryRaw<{ recordType: string; recordId: string; at: Date }[]>`
    SELECT recordType, recordId, MAX(at) as at
    FROM RecordActivity
    WHERE userId = ${userId} ${typeFilter}
    GROUP BY recordType, recordId
    ORDER BY at DESC
  `;

  const total = latestPerRecord.length;
  const page_ = latestPerRecord.slice((page - 1) * pageSize, page * pageSize);
  if (page_.length === 0) {
    return { rows: [], total };
  }

  // Resolve each (recordType, recordId, at) to its action — a second row
  // could share the same max `at` in theory (same-millisecond writes), so
  // this takes the most recently-inserted matching row per key.
  const rows = await Promise.all(
    page_.map(async (entry) => {
      const match = await prisma.recordActivity.findFirst({
        where: { userId, recordType: entry.recordType, recordId: entry.recordId, at: entry.at },
        orderBy: { id: 'desc' },
        select: { recordType: true, recordId: true, action: true, at: true },
      });
      return match ?? { recordType: entry.recordType, recordId: entry.recordId, action: 'viewed', at: entry.at };
    })
  );

  return { rows, total };
}
