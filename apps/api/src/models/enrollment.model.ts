import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const WITH_PROGRAM = { include: { program: true } } satisfies { include: Prisma.ProgramEnrollmentInclude };

/** Row shape joined with `Program` so `programName` can be populated. */
export type EnrollmentRow = Prisma.ProgramEnrollmentGetPayload<typeof WITH_PROGRAM>;

export function findEnrollmentsByClient(clientId: string): Promise<EnrollmentRow[]> {
  return prisma.programEnrollment.findMany({
    where: { clientId },
    orderBy: { startDate: 'desc' },
    ...WITH_PROGRAM,
  });
}

export function findEnrollmentById(id: string): Promise<EnrollmentRow | null> {
  return prisma.programEnrollment.findUnique({ where: { id }, ...WITH_PROGRAM });
}

export function countEnrollmentsForClient(clientId: string): Promise<number> {
  return prisma.programEnrollment.count({ where: { clientId } });
}

export function findProgramById(id: string) {
  return prisma.program.findUnique({ where: { id } });
}

/**
 * Reads directly off `Client`'s own (already-migrated) `firstName`/`lastName`
 * columns via Prisma rather than through `client.model.ts`/`client.mapper.ts`
 * — those files are being rewritten concurrently by another agent for this
 * same change, so depending on their exports here would be fragile; a plain
 * `select` on stable schema columns isn't.
 */
export function findClientNameById(id: string): Promise<{ firstName: string; lastName: string } | null> {
  return prisma.client.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
}

/** Prisma-shaped write payload for creating an enrollment. */
export interface EnrollmentCreateData {
  clientId: string;
  programId: string;
  name: string;
  startDate: Date;
  status: string;
  relationshipToHoh: string | null;
  disablingCondition: string | null;
  enrollmentCoc: string | null;
  programCaseManagerId: string | null;
  isPrimary: boolean;
}

export type EnrollmentUpdateData = Partial<Omit<EnrollmentCreateData, 'clientId'>>;

export function createEnrollment(data: EnrollmentCreateData): Promise<EnrollmentRow> {
  return prisma.programEnrollment.create({ data, ...WITH_PROGRAM });
}

export function updateEnrollment(id: string, data: EnrollmentUpdateData): Promise<EnrollmentRow> {
  return prisma.programEnrollment.update({ where: { id }, data, ...WITH_PROGRAM });
}
