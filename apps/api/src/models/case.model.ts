import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type CaseRow = Prisma.CaseGetPayload<Record<string, never>>;

/**
 * Idempotent per (clientId, programEnrollmentId) via the DB-level compound
 * unique key `@@unique([clientId, programEnrollmentId])` on `Case` — Prisma
 * generates the compound-key name `clientId_programEnrollmentId` (confirmed
 * against the generated client's `CaseWhereUniqueInput`). `update: {}` is a
 * no-op when the row already exists, so calling this twice never creates a
 * second row.
 */
export function ensureCase(clientId: string, programEnrollmentId: string): Promise<CaseRow> {
  return prisma.case.upsert({
    where: { clientId_programEnrollmentId: { clientId, programEnrollmentId } },
    update: {},
    create: { clientId, programEnrollmentId, status: 'open' },
  });
}

/** Used by the intake-snapshot endpoint — a case may not exist yet for a given enrollment. */
export function findCaseByClientAndEnrollment(
  clientId: string,
  programEnrollmentId: string
): Promise<CaseRow | null> {
  return prisma.case.findUnique({ where: { clientId_programEnrollmentId: { clientId, programEnrollmentId } } });
}
