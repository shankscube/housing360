import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type ReleaseOfInformationRow = Prisma.ReleaseOfInformationGetPayload<Record<string, never>>;

export function createReleaseOfInformation(
  data: Prisma.ReleaseOfInformationUncheckedCreateInput
): Promise<ReleaseOfInformationRow> {
  return prisma.releaseOfInformation.create({ data });
}

/**
 * "Active" = unrevoked and unexpired — see design.md Decision 7. Ordered
 * newest-expiry-first so the first row (if any) is the one worth surfacing.
 */
export function findActiveReleaseOfInformation(clientId: string): Promise<ReleaseOfInformationRow | null> {
  return prisma.releaseOfInformation.findFirst({
    where: { clientId, revokedAt: null, expiresOn: { gt: new Date() } },
    orderBy: { expiresOn: 'desc' },
  });
}
