import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const ORG_INCLUDE = { serviceDomains: true } satisfies Prisma.OrganizationInclude;
export type OrganizationRow = Prisma.OrganizationGetPayload<{ include: typeof ORG_INCLUDE }>;

export function findOrganizationsByServiceDomain(domain?: string): Promise<OrganizationRow[]> {
  return prisma.organization.findMany({
    where: {
      isPartner: true,
      ...(domain ? { serviceDomains: { some: { serviceDomain: domain } } } : {}),
    },
    include: ORG_INCLUDE,
    orderBy: { name: 'asc' },
  });
}

export function findOrganizationById(id: string): Promise<OrganizationRow | null> {
  return prisma.organization.findUnique({ where: { id }, include: ORG_INCLUDE });
}
