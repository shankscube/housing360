import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type ProgramRow = Prisma.ProgramGetPayload<Record<string, never>>;

export function findPrograms(activeOnly: boolean): Promise<ProgramRow[]> {
  return prisma.program.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { name: 'asc' },
  });
}
