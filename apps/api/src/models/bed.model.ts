import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type BedRow = Prisma.BedGetPayload<Record<string, never>>;

/**
 * A bed is available for a date+shift when no `BedAssignment` for that
 * shift covers the date (`startDate <= date AND (endDate IS NULL OR endDate
 * >= date)`) — see design.md Decision 9's implementation note on why
 * `shift` lives on the assignment.
 */
export async function findAvailableBeds(programId: string, date: Date, shift: string): Promise<BedRow[]> {
  return prisma.bed.findMany({
    where: {
      programId,
      isActive: true,
      assignments: {
        none: {
          shift,
          startDate: { lte: date },
          OR: [{ endDate: null }, { endDate: { gte: date } }],
        },
      },
    },
    orderBy: { identifier: 'asc' },
  });
}

export function findBedById(id: string): Promise<BedRow | null> {
  return prisma.bed.findUnique({ where: { id } });
}

/**
 * A simple LIVE availability count for `GET /api/ce/recommended-programs` —
 * deliberately not date/shift-aware like `findAvailableBeds` above (per the
 * assessment-and-ce-workspace task brief: "keep it simple, don't need to
 * filter by date/shift for this count unless that's trivial"). A bed counts
 * as occupied today if it has ANY assignment (any shift) covering today's
 * date, so a bed with only one of its two shifts assigned is conservatively
 * counted as unavailable rather than double-counted as available.
 */
export async function countAvailableBeds(programId: string, date: Date = new Date()): Promise<number> {
  return prisma.bed.count({
    where: {
      programId,
      isActive: true,
      assignments: {
        none: {
          startDate: { lte: date },
          OR: [{ endDate: null }, { endDate: { gte: date } }],
        },
      },
    },
  });
}

const ASSIGNMENT_INCLUDE = { bed: true } satisfies Prisma.BedAssignmentInclude;
export type BedAssignmentRow = Prisma.BedAssignmentGetPayload<{ include: typeof ASSIGNMENT_INCLUDE }>;

export function findBedAssignmentById(id: string): Promise<BedAssignmentRow | null> {
  return prisma.bedAssignment.findUnique({ where: { id }, include: ASSIGNMENT_INCLUDE });
}

export type BedNightRow = Prisma.BedNightGetPayload<Record<string, never>>;

export function findBedNightsByAssignment(bedAssignmentId: string): Promise<BedNightRow[]> {
  return prisma.bedNight.findMany({
    where: { bedAssignmentId },
    orderBy: { logDate: 'desc' },
  });
}

/**
 * Creates the assignment and logs today as Present in one transaction — see
 * design.md Decision 9 / the proposal's "also logs today's night as
 * Present."
 */
export async function createBedAssignmentWithFirstNight(
  programEnrollmentId: string,
  bedId: string,
  shift: string,
  startDate: Date
): Promise<BedAssignmentRow> {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.bedAssignment.create({
      data: { programEnrollmentId, bedId, shift, startDate },
      include: ASSIGNMENT_INCLUDE,
    });
    await tx.bedNight.create({
      data: { bedAssignmentId: assignment.id, logDate: startDate, shift, status: 'Present' },
    });
    return assignment;
  });
}

export function createBedNight(
  bedAssignmentId: string,
  logDate: Date,
  shift: string,
  status: string
): Promise<BedNightRow> {
  return prisma.bedNight.upsert({
    where: { bedAssignmentId_logDate_shift: { bedAssignmentId, logDate, shift } },
    update: { status },
    create: { bedAssignmentId, logDate, shift, status },
  });
}

export function findBedNightById(id: string): Promise<BedNightRow | null> {
  return prisma.bedNight.findUnique({ where: { id } });
}

export function updateBedNightStatus(id: string, status: string): Promise<BedNightRow> {
  return prisma.bedNight.update({ where: { id }, data: { status } });
}
