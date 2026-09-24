import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type ProgramRow = Prisma.ProgramGetPayload<Record<string, never>>;

export function findPrograms(activeOnly: boolean): Promise<ProgramRow[]> {
  return prisma.program.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { name: 'asc' },
  });
}

const PROGRAM_WITH_ORG_INCLUDE = { operatingOrganization: true } satisfies Prisma.ProgramInclude;

export type ProgramWithOrgRow = Prisma.ProgramGetPayload<{ include: typeof PROGRAM_WITH_ORG_INCLUDE }>;

/** `GET /api/ce/recommended-programs?projectType=` — active programs whose
 * `projectTypeCode` matches, joined with the operating organization for
 * address (assessment-and-ce-workspace design.md Decision 7). */
export function findActiveProgramsByProjectType(projectTypeCode: string): Promise<ProgramWithOrgRow[]> {
  return prisma.program.findMany({
    where: { isActive: true, projectTypeCode },
    include: PROGRAM_WITH_ORG_INCLUDE,
    orderBy: { name: 'asc' },
  });
}
