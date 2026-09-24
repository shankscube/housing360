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

/**
 * The Coordinated Entry referral path (`POST /api/ce/referrals`) needs a
 * "referrer's default organization" and no such concept exists in the schema
 * — best-effort choice, documented in assessment-and-ce-workspace's report:
 * the earliest-created partner organization, or `null` if none exists.
 */
export function findFirstPartnerOrganization(): Promise<OrganizationRow | null> {
  return prisma.organization.findFirst({
    where: { isPartner: true },
    include: ORG_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });
}
