import { Prisma } from '@prisma/client';
import type { CaseFilter } from '@housing360/types';
import { prisma } from './prismaClient';

/**
 * A case that hasn't been contacted in this many days counts as due for
 * follow-up "today"; longer than that counts as overdue. No due-date field
 * exists on `Case` (see this change's design.md Open Questions) — this is a
 * fixed cadence assumption, not a per-case configurable value.
 */
export const FOLLOW_UP_CADENCE_DAYS = 14;

/** Window for the "Recently Updated" filter. */
export const RECENTLY_UPDATED_WINDOW_DAYS = 7;

export type CaseRow = Prisma.CaseGetPayload<Record<string, never>>;

const LIST_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
  assignedCaseManager: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  updatedBy: { select: { id: true, firstName: true, lastName: true } },
  programEnrollment: { select: { name: true, program: { select: { name: true } } } },
} satisfies Prisma.CaseInclude;

export type CaseListRow = Prisma.CaseGetPayload<{ include: typeof LIST_INCLUDE }>;

interface FindCasesParams {
  page: number;
  pageSize: number;
  filter: CaseFilter;
  search?: string;
  /** Only meaningful for the `myCaseload` filter. */
  requestingUserId: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * A case is "due" on the calendar day `lastContactDate + FOLLOW_UP_CADENCE_DAYS`
 * falls on. A case with no `lastContactDate` yet has no baseline to compute
 * from, so it never matches Due Today/Overdue (it isn't ignored elsewhere —
 * it still shows up under "All Cases"). Closed cases are excluded from both,
 * since a closed case has nothing left to follow up on.
 */
function dueTodayWhere(): Prisma.CaseWhereInput {
  const todayStart = startOfDay(new Date());
  const dueRangeStart = addDays(todayStart, -FOLLOW_UP_CADENCE_DAYS);
  const dueRangeEnd = addDays(dueRangeStart, 1);
  return {
    status: { not: 'closed' },
    lastContactDate: { gte: dueRangeStart, lt: dueRangeEnd },
  };
}

function overdueWhere(): Prisma.CaseWhereInput {
  const todayStart = startOfDay(new Date());
  const dueRangeStart = addDays(todayStart, -FOLLOW_UP_CADENCE_DAYS);
  return {
    status: { not: 'closed' },
    lastContactDate: { lt: dueRangeStart },
  };
}

/** Single-select filter, same contract as `client.model.ts`'s `filterWhere` — combines with `search`, never with another filter value. */
function filterWhere(filter: CaseFilter, requestingUserId: number): Prisma.CaseWhereInput {
  switch (filter) {
    case 'myCaseload':
      return { assignedCaseManagerId: requestingUserId };
    case 'highRisk':
      return { priority: 'high' };
    case 'dueToday':
      return dueTodayWhere();
    case 'overdue':
      return overdueWhere();
    case 'recentlyUpdated':
      return { updatedAt: { gte: addDays(new Date(), -RECENTLY_UPDATED_WINDOW_DAYS) } };
    case 'all':
    default:
      return {};
  }
}

export async function findCases({
  page,
  pageSize,
  filter,
  search,
  requestingUserId,
}: FindCasesParams): Promise<{ rows: CaseListRow[]; total: number }> {
  const where: Prisma.CaseWhereInput = {
    AND: [
      filterWhere(filter, requestingUserId),
      search
        ? {
            OR: [
              { caseNumber: { contains: search } },
              { subject: { contains: search } },
              { client: { is: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] } } },
            ],
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.case.findMany({
      where,
      include: LIST_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.case.count({ where }),
  ]);

  return { rows, total };
}

/** Health and Wellness tab readiness — "clinical data" means either table has a row (see `case-workspace` design.md Decision 10); nothing writes to them via the no-op EHR adapter today, but a future adapter could. */
export async function hasClinicalData(clientId: string): Promise<boolean> {
  const [summary, encounterCount] = await Promise.all([
    prisma.clinicalSummary.findUnique({ where: { clientId }, select: { id: true } }),
    prisma.clinicalEncounter.count({ where: { clientId } }),
  ]);
  return summary !== null || encounterCount > 0;
}

export interface CaseKpiCountRows {
  activeCases: number;
  highRisk: number;
  dueToday: number;
  closedCases: number;
}

export async function countCaseKpis(): Promise<CaseKpiCountRows> {
  const [activeCases, highRisk, dueToday, closedCases] = await Promise.all([
    prisma.case.count({ where: { status: { not: 'closed' } } }),
    prisma.case.count({ where: { priority: 'high' } }),
    prisma.case.count({ where: dueTodayWhere() }),
    prisma.case.count({ where: { status: 'closed' } }),
  ]);
  return { activeCases, highRisk, dueToday, closedCases };
}

/**
 * Distinct clients across the case manager's own open cases — the Home
 * dashboard's "Active Caseload" KPI, personal scoping (home-dashboard
 * design.md Decision 2), reusing the same `assignedCaseManagerId` predicate
 * `filterWhere`'s `myCaseload` branch uses above.
 */
export async function findActiveCaseloadClientIds(requestingUserId: number): Promise<string[]> {
  const rows = await prisma.case.findMany({
    where: { assignedCaseManagerId: requestingUserId, status: 'open' },
    select: { clientId: true },
    distinct: ['clientId'],
  });
  return rows.map((row) => row.clientId);
}

/**
 * "Active as of the end of last month" is computed from `openedDate`/`closedAt`
 * rather than a stored historical snapshot — a case counts if it had already
 * been opened by then and either isn't closed yet or closed after that date.
 * No new table needed; consistent with the rest of this app's
 * "computed, not stored" KPI/checklist convention.
 */
export async function countActiveCasesAsOf(date: Date): Promise<number> {
  return prisma.case.count({
    where: {
      openedDate: { lte: date },
      OR: [{ closedAt: null }, { closedAt: { gt: date } }],
    },
  });
}

export function findCaseById(id: string): Promise<CaseListRow | null> {
  return prisma.case.findUnique({ where: { id }, include: LIST_INCLUDE });
}

/**
 * `CASE-YYYY-NNNNN`, sequential within the current year. Not perfectly
 * race-safe under concurrent creates (a count-based sequence, not a DB
 * sequence object) — acceptable at this app's single-case-manager scale;
 * `createCase`/`ensureCase` retry once on a unique-constraint collision.
 */
async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CASE-${year}-`;
  const count = await prisma.case.count({ where: { caseNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
}

const isUniqueConstraintError = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

/**
 * Idempotent per (clientId, programEnrollmentId) via the DB-level compound
 * unique key `@@unique([clientId, programEnrollmentId])` on `Case` — Prisma
 * generates the compound-key name `clientId_programEnrollmentId` (confirmed
 * against the generated client's `CaseWhereUniqueInput`). `update: {}` is a
 * no-op when the row already exists, so calling this twice never creates a
 * second row. A case number is generated only on the create branch of the
 * upsert — an existing case's number is never touched.
 */
export async function ensureCase(clientId: string, programEnrollmentId: string): Promise<CaseRow> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const caseNumber = await generateCaseNumber();
      return await prisma.case.upsert({
        where: { clientId_programEnrollmentId: { clientId, programEnrollmentId } },
        update: {},
        create: { clientId, programEnrollmentId, status: 'open', caseNumber },
      });
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt === 0) {
        continue;
      }
      throw err;
    }
  }
  // Unreachable — the loop always returns or throws — but keeps TypeScript's
  // control-flow analysis satisfied without an unsafe non-null assertion.
  throw new Error('Failed to ensure case after retry');
}

/** Used by the intake-snapshot endpoint — a case may not exist yet for a given enrollment. */
export function findCaseByClientAndEnrollment(
  clientId: string,
  programEnrollmentId: string
): Promise<CaseRow | null> {
  return prisma.case.findUnique({ where: { clientId_programEnrollmentId: { clientId, programEnrollmentId } } });
}

export interface CaseCreateData {
  clientId: string;
  programEnrollmentId: string;
  subject: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  stage?: string | null;
  origin?: string | null;
  escalated?: boolean;
  contact?: string | null;
  referralId?: string | null;
  openedDate?: Date;
  assignedCaseManagerId?: number | null;
  createdById?: number | null;
}

export async function createCase(data: CaseCreateData): Promise<CaseListRow> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const caseNumber = await generateCaseNumber();
      return await prisma.case.create({
        data: { ...data, caseNumber, status: data.status ?? 'open' },
        include: LIST_INCLUDE,
      });
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt === 0) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to create case after retry');
}

export interface CaseUpdateData {
  subject?: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  stage?: string | null;
  origin?: string | null;
  escalated?: boolean;
  contact?: string | null;
  referralId?: string | null;
  lastContactDate?: Date | null;
  assignedCaseManagerId?: number | null;
  hmisDataQualityStatus?: string | null;
  nextHmisReviewDue?: Date | null;
  updatedById?: number | null;
}

export function updateCase(id: string, data: CaseUpdateData): Promise<CaseListRow> {
  return prisma.case.update({ where: { id }, data, include: LIST_INCLUDE });
}

export interface CaseFollowUpData {
  followUpMilestone: string;
  followUpDueDate: Date | null;
  updatedById?: number | null;
}

export function updateCaseFollowUp(id: string, data: CaseFollowUpData): Promise<CaseListRow> {
  return prisma.case.update({ where: { id }, data, include: LIST_INCLUDE });
}
