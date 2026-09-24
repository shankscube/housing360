import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const VULNERABILITY_ASSESSMENT_INCLUDE = {
  client: {
    select: {
      firstName: true,
      lastName: true,
      veteranStatus: true,
      dob: true,
      householdId: true,
    },
  },
} satisfies Prisma.VulnerabilityAssessmentInclude;

export type VulnerabilityAssessmentRow = Prisma.VulnerabilityAssessmentGetPayload<{
  include: typeof VULNERABILITY_ASSESSMENT_INCLUDE;
}>;

export function createVulnerabilityAssessment(
  data: Prisma.VulnerabilityAssessmentUncheckedCreateInput
): Promise<VulnerabilityAssessmentRow> {
  return prisma.vulnerabilityAssessment.create({
    data,
    include: VULNERABILITY_ASSESSMENT_INCLUDE,
  });
}

export function findVulnerabilityAssessmentById(id: string): Promise<VulnerabilityAssessmentRow | null> {
  return prisma.vulnerabilityAssessment.findUnique({
    where: { id },
    include: VULNERABILITY_ASSESSMENT_INCLUDE,
  });
}

/** Most recent screening for a client — used to derive the recommended-programs
 * priority tier and the Prioritization List's per-client "latest" row. */
export function findLatestVulnerabilityAssessmentByClient(
  clientId: string
): Promise<VulnerabilityAssessmentRow | null> {
  return prisma.vulnerabilityAssessment.findFirst({
    where: { clientId },
    include: VULNERABILITY_ASSESSMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export function attachReferralToVulnerabilityAssessment(
  id: string,
  referralId: string
): Promise<VulnerabilityAssessmentRow> {
  return prisma.vulnerabilityAssessment.update({
    where: { id },
    data: { referralId },
    include: VULNERABILITY_ASSESSMENT_INCLUDE,
  });
}

/**
 * The Prioritization List's candidate set: every client's *latest* vulnerability
 * assessment, plus the household-member count and "has a new/pending referral
 * with no active enrollment" flag each quick filter needs. Quick filters are
 * computed in JS after this fetch (age-from-`dob`, household size) rather than
 * in the `where` clause — `dob` is a disclosure-gated free-text column, not a
 * `Date`, so date arithmetic can't be pushed into a portable Prisma filter; see
 * design.md Decision 5. This mirrors the rest of the app's "computed, not
 * stored" convention (e.g. `Case.tabsWithContent`).
 */
export async function findLatestVulnerabilityAssessmentsForPrioritizationList(): Promise<
  VulnerabilityAssessmentRow[]
> {
  const rows = await prisma.vulnerabilityAssessment.findMany({
    include: VULNERABILITY_ASSESSMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  // Keep only each client's latest screening.
  const latestByClient = new Map<string, VulnerabilityAssessmentRow>();
  for (const row of rows) {
    if (!latestByClient.has(row.clientId)) {
      latestByClient.set(row.clientId, row);
    }
  }
  return Array.from(latestByClient.values());
}

export async function countHouseholdMembers(householdId: string): Promise<number> {
  return prisma.client.count({ where: { householdId } });
}

const AWAITING_REFERRAL_STATUSES = ['new', 'pending'];

export async function hasAwaitingReferral(clientId: string): Promise<boolean> {
  const [awaitingReferral, activeEnrollment] = await Promise.all([
    prisma.referral.findFirst({
      where: { clientId, status: { in: AWAITING_REFERRAL_STATUSES } },
      select: { id: true },
    }),
    prisma.programEnrollment.findFirst({
      where: { clientId, status: 'active' },
      select: { id: true },
    }),
  ]);
  return awaitingReferral !== null && activeEnrollment === null;
}
