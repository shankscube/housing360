import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const ALERT_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
} satisfies Prisma.DataQualityIssueInclude;

export type DataQualityIssueRow = Prisma.DataQualityIssueGetPayload<{ include: typeof ALERT_INCLUDE }>;

export function countDataQualityIssues(): Promise<number> {
  return prisma.dataQualityIssue.count();
}

export interface DataQualityIssueSeedRow {
  title: string;
  clientId: string;
  openedAt: Date;
}

export async function createDataQualityIssues(rows: DataQualityIssueSeedRow[]): Promise<void> {
  if (rows.length === 0) return;
  await prisma.dataQualityIssue.createMany({ data: rows });
}

export function findDataQualityAlertsForHome(limit: number): Promise<DataQualityIssueRow[]> {
  return prisma.dataQualityIssue.findMany({
    include: ALERT_INCLUDE,
    orderBy: { openedAt: 'asc' },
    take: limit,
  });
}
