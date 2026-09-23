import { Prisma, DisclosureStatus as PrismaDisclosureStatus, Sex as PrismaSex } from '@prisma/client';
import type { ClientFilter } from '@housing360/types';
import { prisma } from './prismaClient';

/** List-safe column selection — never includes `ssn`/`dob`/their disclosure columns. */
const LIST_SELECT = {
  id: true,
  name: true,
  sex: true,
  raceEthnicity: true,
  householdId: true,
  isHeadOfHousehold: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

/** Row shape for list/duplicate-candidate queries. Has no `ssn`/`dob` fields to leak. */
export type ClientListRow = Prisma.ClientGetPayload<{ select: typeof LIST_SELECT }>;

/** Full row shape, including `ssn`/`dob` — detail/create/update only. */
export type ClientRow = Prisma.ClientGetPayload<Record<string, never>>;

/** Prisma-shaped write payload (uppercase enums, flat disclosure columns). */
export interface ClientWriteData {
  name: string;
  sex: PrismaSex;
  raceEthnicity: string;
  ssn: string | null;
  ssnDisclosure: PrismaDisclosureStatus;
  dob: string | null;
  dobDisclosure: PrismaDisclosureStatus;
  householdId: string;
  isHeadOfHousehold: boolean;
}

interface FindClientsParams {
  page: number;
  pageSize: number;
  filter: ClientFilter;
  search?: string;
}

/**
 * `withProgram`/`withCases` are contract-complete but currently trivial: no
 * `Program`/`Case` model exists yet, so those filters always match zero rows
 * (`withoutProgram`/`withoutCases` therefore match everything) — see design.md.
 */
function filterWhere(filter: ClientFilter): Prisma.ClientWhereInput {
  switch (filter) {
    case 'male':
      return { sex: 'MALE' };
    case 'female':
      return { sex: 'FEMALE' };
    case 'withProgram':
    case 'withCases':
      return { id: { equals: '__never__' } };
    case 'withoutProgram':
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
    AND: [filterWhere(filter), search ? { name: { contains: search } } : {}],
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

export function findClientById(id: string): Promise<ClientRow | null> {
  return prisma.client.findUnique({ where: { id } });
}

interface DuplicateCandidateParams {
  name: string;
  /** Plain optional values — the service decides whether it's meaningful to call this at all. */
  dob?: string;
  ssn?: string;
}

/**
 * Matches on `name` (exact equality — MySQL's default collation already
 * makes this case-insensitive, so no extra normalization is needed) AND
 * `dob` AND `ssn`, when those are supplied. Only meaningful when the caller
 * has real (status `'provided'`) dob/ssn values to match against — the
 * service layer decides that, not this function.
 */
export function findDuplicateCandidates({
  name,
  dob,
  ssn,
}: DuplicateCandidateParams): Promise<ClientListRow[]> {
  const where: Prisma.ClientWhereInput = { name };
  if (dob) {
    where.dob = dob;
  }
  if (ssn) {
    where.ssn = ssn;
  }
  return prisma.client.findMany({ where, select: LIST_SELECT });
}

export function createClient(data: ClientWriteData): Promise<ClientRow> {
  return prisma.client.create({ data });
}

export function updateClient(id: string, data: Partial<ClientWriteData>): Promise<ClientRow> {
  return prisma.client.update({ where: { id }, data });
}

export function countHeadOfHouseholdInHousehold(
  householdId: string,
  excludeClientId?: string
): Promise<number> {
  return prisma.client.count({
    where: {
      householdId,
      isHeadOfHousehold: true,
      ...(excludeClientId ? { id: { not: excludeClientId } } : {}),
    },
  });
}
