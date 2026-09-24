import { Prisma, DisclosureStatus as PrismaDisclosureStatus, Sex as PrismaSex } from '@prisma/client';
import type { ClientFilter } from '@housing360/types';
import { prisma } from './prismaClient';

/**
 * List-safe column selection — never includes `ssn*`/`dob*` fields. The
 * nested `household` select exists only so `isHeadOfHousehold` can be derived
 * (`household.headClientId === client.id`) without a second query per row.
 */
const LIST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  sex: true,
  raceEthnicity: true,
  householdId: true,
  relationshipToHoh: true,
  household: { select: { headClientId: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

/** Row shape for list/duplicate-candidate queries. Has no `ssn`/`dob` fields to leak. */
export type ClientListRow = Prisma.ClientGetPayload<{ select: typeof LIST_SELECT }>;

/**
 * `ClientListRow` plus the two values that need a follow-up query/derivation
 * per row — `enrichListRows` produces these, `client.mapper.ts`'s
 * `toClientListItem` only ever reads them, never computes them.
 */
export type EnrichedClientListRow = ClientListRow & {
  isHeadOfHousehold: boolean;
  primaryEnrollmentStatus: string | null;
};

/** Search-endpoint column selection — list-safe fields plus DOB (plain) and masked SSN. */
const SEARCH_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  dob: true,
  ssnLast4: true,
  relationshipToHoh: true,
  sex: true,
  veteranStatus: true,
} satisfies Prisma.ClientSelect;

export type ClientSearchRow = Prisma.ClientGetPayload<{ select: typeof SEARCH_SELECT }>;

/** Full row shape, including `ssn*`/`dob` — detail/create/update only. Includes
 * `household` for the same `isHeadOfHousehold` derivation as the list row. */
export type ClientRow = Prisma.ClientGetPayload<{
  include: { household: { select: { headClientId: true } } };
}>;

const DETAIL_INCLUDE = { household: { select: { headClientId: true } } } satisfies Prisma.ClientInclude;

/** Prisma-shaped write payload (uppercase enums, flat disclosure columns, encrypted SSN triple). */
export interface ClientWriteData {
  firstName: string;
  lastName: string;
  title?: string | null;
  nameDataQuality?: string | null;
  sex: PrismaSex;
  raceEthnicity: Prisma.InputJsonValue;
  ssnDataQuality?: string | null;
  ssnEncrypted?: string | null;
  ssnHash?: string | null;
  ssnLast4?: string | null;
  ssnDisclosure: PrismaDisclosureStatus;
  dob?: string | null;
  dobDataQuality?: string | null;
  dobDisclosure: PrismaDisclosureStatus;
  mobile?: string | null;
  email?: string | null;
  veteranStatus?: string | null;
  militaryBranch?: string | null;
  yearEnteredService?: number | null;
  dischargeStatus?: string | null;
  ww2?: boolean | null;
  koreanWar?: boolean | null;
  vietnamWar?: boolean | null;
  otherTheater?: boolean | null;
  householdId?: string | null;
  relationshipToHoh?: string | null;
}

interface FindClientsParams {
  page: number;
  pageSize: number;
  filter: ClientFilter;
  search?: string;
}

/**
 * `withProgram`/`withoutProgram` are real, backed by `ProgramEnrollment`
 * existence via Prisma's implicit relation filter on `Client.enrollments`.
 * `withCases`/`withoutCases` stay the old trivial placeholder — no other
 * agent is touching `Case` linkage semantics for filtering in this change,
 * see the model's own note below and the report back to the orchestrator.
 */
function filterWhere(filter: ClientFilter): Prisma.ClientWhereInput {
  switch (filter) {
    case 'male':
      return { sex: 'MALE' };
    case 'female':
      return { sex: 'FEMALE' };
    case 'withProgram':
      return { enrollments: { some: {} } };
    case 'withoutProgram':
      return { enrollments: { none: {} } };
    // KNOWN FOLLOWUP (out of scope for this task): withCases/withoutCases stay
    // the always-empty/always-full placeholder from `client-management` —
    // real Case-linkage filtering is someone else's territory in this change.
    case 'withCases':
      return { id: { equals: '__never__' } };
    case 'withoutCases':
    case 'all':
    default:
      return {};
  }
}

export async function findClients({
  page,
  pageSize,
  filter,
  search,
}: FindClientsParams): Promise<{ rows: ClientListRow[]; total: number }> {
  // No `mode: 'insensitive'` — that option is Postgres/MongoDB-only in Prisma;
  // MySQL's default collation (utf8mb4_general_ci / utf8mb4_unicode_ci) is
  // already case-insensitive, so plain `contains` behaves the same way.
  const where: Prisma.ClientWhereInput = {
    AND: [
      filterWhere(filter),
      search
        ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: LIST_SELECT,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return { rows, total };
}

async function getPrimaryEnrollmentStatus(clientId: string): Promise<string | null> {
  const enrollment = await prisma.programEnrollment.findFirst({
    where: { clientId, isPrimary: true },
    select: { status: true },
  });
  return enrollment?.status ?? null;
}

/**
 * Attaches `isHeadOfHousehold` (derived from the nested `household` select)
 * and `primaryEnrollmentStatus` (a small per-client follow-up query — list-
 * page-sized data, not worth batching/joining for now) to each list row.
 * Model-layer helper so `client.mapper.ts`'s list mapper can stay a pure,
 * synchronous row -> DTO function.
 */
export function enrichListRows(rows: ClientListRow[]): Promise<EnrichedClientListRow[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      isHeadOfHousehold: row.household?.headClientId === row.id,
      primaryEnrollmentStatus: await getPrimaryEnrollmentStatus(row.id),
    }))
  );
}

export function findClientById(id: string): Promise<ClientRow | null> {
  return prisma.client.findUnique({ where: { id }, include: DETAIL_INCLUDE });
}

interface DuplicateCandidateParams {
  firstName: string;
  lastName: string;
  /** Plain optional values — the service decides whether it's meaningful to call this at all. */
  dob?: string;
  /** Deterministic HMAC of the SSN (see `utils/ssn.ts`), never the raw value — that column no longer exists. */
  ssnHash?: string;
}

/**
 * Matches on `firstName` + `lastName` (exact equality — MySQL's default
 * collation already makes this case-insensitive) AND `dob` AND `ssnHash`,
 * when those are supplied. Only meaningful when the caller has real (status
 * `'provided'`) dob/ssn values to match against — the service layer decides
 * that, not this function.
 */
export function findDuplicateCandidates({
  firstName,
  lastName,
  dob,
  ssnHash,
}: DuplicateCandidateParams): Promise<ClientListRow[]> {
  const where: Prisma.ClientWhereInput = { firstName, lastName };
  if (dob) {
    where.dob = dob;
  }
  if (ssnHash) {
    where.ssnHash = ssnHash;
  }
  return prisma.client.findMany({ where, select: LIST_SELECT });
}

export function searchClientsByName(name: string): Promise<ClientSearchRow[]> {
  return prisma.client.findMany({
    where: { OR: [{ firstName: { contains: name } }, { lastName: { contains: name } }] },
    select: SEARCH_SELECT,
  });
}

/** Read-only row shape for the intake wizard's Family Members step already-saved rows. */
const HOUSEHOLD_MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  ssnLast4: true,
  dob: true,
  sex: true,
  raceEthnicity: true,
  relationshipToHoh: true,
  mobile: true,
  email: true,
} satisfies Prisma.ClientSelect;

export type HouseholdMemberRow = Prisma.ClientGetPayload<{ select: typeof HOUSEHOLD_MEMBER_SELECT }>;

/** Other members of a household, excluding the given client (the primary client is shown separately). */
export function findHouseholdMembers(
  householdId: string,
  excludeClientId: string
): Promise<HouseholdMemberRow[]> {
  return prisma.client.findMany({
    where: { householdId, id: { not: excludeClientId } },
    select: HOUSEHOLD_MEMBER_SELECT,
  });
}

export function createClient(data: ClientWriteData): Promise<ClientRow> {
  return prisma.client.create({ data, include: DETAIL_INCLUDE });
}

export function updateClient(id: string, data: Partial<ClientWriteData>): Promise<ClientRow> {
  return prisma.client.update({ where: { id }, data, include: DETAIL_INCLUDE });
}

// `countHeadOfHouseholdInHousehold` removed — head of household is now fixed
// at `Household` creation time (`headClientId`, a real FK), not re-validated
// on every client write. See design.md's Household decision.

/**
 * Home dashboard's "Active Caseload" KPI sub-line — among a given set of
 * client ids (the case manager's caseload), how many were created since the
 * given date (home-dashboard design.md Decision 2).
 */
export function countClientsCreatedSince(clientIds: string[], since: Date): Promise<number> {
  if (clientIds.length === 0) return Promise.resolve(0);
  return prisma.client.count({ where: { id: { in: clientIds }, createdAt: { gte: since } } });
}

/**
 * Oldest-first client ids, used only to attach demo `DataQualityIssue` rows
 * to real clients the first time the Home dashboard is requested after any
 * client exists — home-dashboard design.md Decision 3.
 */
export async function findOldestClientIds(limit: number): Promise<string[]> {
  const rows = await prisma.client.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  return rows.map((row) => row.id);
}
