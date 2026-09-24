import type {
  CoordinatedEntryReferralInput,
  PartnerAgency,
  PrioritizationListItem,
  PrioritizationListQuery,
  Program,
  VulnerabilityAssessment,
  VulnerabilityAssessmentInput,
} from '@housing360/types';
import {
  attachReferralToVulnerabilityAssessment,
  countHouseholdMembers,
  createVulnerabilityAssessment,
  findLatestVulnerabilityAssessmentByClient,
  findLatestVulnerabilityAssessmentsForPrioritizationList,
  findVulnerabilityAssessmentById,
  hasAwaitingReferral,
  type VulnerabilityAssessmentRow,
} from '../models/coordinatedEntry.model';
import { findPrograms } from '../models/program.model';
import { createReferral } from '../models/referral.model';
import { findOrganizationsByServiceDomain } from '../models/organization.model';
import { toPartnerAgency } from '../models/organization.mapper';
import { scoringService } from './scoring.service';
import { RECOMMENDED_PROGRAMS_BY_TIER, UNACCOMPANIED_YOUTH_MAX_AGE } from '../constants/coordinatedEntryOptions';
import { AppError } from '../utils/AppError';

function toVulnerabilityAssessment(row: VulnerabilityAssessmentRow): VulnerabilityAssessment {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    answers: row.answers as unknown as VulnerabilityAssessmentInput,
    score: row.score,
    priorityTier: row.priorityTier as VulnerabilityAssessment['priorityTier'],
    safetyAlert: row.safetyAlert,
    assessedById: row.assessedById,
    referralId: row.referralId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** `POST /coordinated-entry/vulnerability-assessment` — step 1. Scores via
 * `ScoringService.scoreVulnerability`, never inline here. */
export async function submitVulnerabilityAssessment(
  input: VulnerabilityAssessmentInput,
  assessedById: number
): Promise<VulnerabilityAssessment> {
  const result = scoringService.scoreVulnerability({
    chronicHomelessness: input.chronicHomelessness,
    monthsHomelessPast3Years: input.monthsHomelessPast3Years,
    disablingCondition: input.disablingCondition,
    domesticViolenceSurvivor: input.domesticViolenceSurvivor,
    veteranStatus: input.veteranStatus,
    unaccompaniedYouth: input.unaccompaniedYouth,
  });

  const row = await createVulnerabilityAssessment({
    clientId: input.clientId,
    answers: input as unknown as object,
    score: result.score,
    priorityTier: result.priorityTier,
    safetyAlert: input.safetyAlert ?? false,
    assessedById,
  });

  return toVulnerabilityAssessment(row);
}

/** `GET /coordinated-entry/recommended-programs` — step 2. A static tier->program-name
 * lookup (design.md Decision 7), not a scoring model — `Program` has no `type` column. */
export async function getRecommendedPrograms(clientId: string): Promise<Program[]> {
  const latest = await findLatestVulnerabilityAssessmentByClient(clientId);
  if (!latest) {
    throw new AppError(400, 'Client has no vulnerability assessment yet');
  }

  const tier = latest.priorityTier as 'high' | 'medium' | 'low';
  const recommendedNames = RECOMMENDED_PROGRAMS_BY_TIER[tier] ?? RECOMMENDED_PROGRAMS_BY_TIER.low;
  const allPrograms = await findPrograms(true);

  const ranked = recommendedNames
    .map((name) => allPrograms.find((program) => program.name === name))
    .filter((program): program is NonNullable<typeof program> => Boolean(program));

  return ranked.map((program) => ({ id: program.id, name: program.name, isActive: program.isActive }));
}

/** `GET /coordinated-entry/partner-agencies` — step 3. Reuses the same
 * `Organization`/`OrganizationServiceDomain` lookup the Plan tab's
 * Refer-to-Partner flow already uses (design.md Decision 3's sibling reuse). */
export async function listPartnerAgenciesForCoordinatedEntry(domain?: string): Promise<PartnerAgency[]> {
  const rows = await findOrganizationsByServiceDomain(domain);
  return rows.map(toPartnerAgency);
}

/** `POST /coordinated-entry/referrals` — step 4. Writes to the shared `Referral`
 * table (design.md Decision 4): `isExternal: true`, `status: 'new'`, no `caseId`
 * (none exists yet at this point in the flow). */
export async function createCoordinatedEntryReferral(input: CoordinatedEntryReferralInput) {
  const vulnerabilityAssessment = await findVulnerabilityAssessmentById(input.vulnerabilityAssessmentId);
  if (!vulnerabilityAssessment) {
    throw new AppError(404, 'Vulnerability assessment not found');
  }

  const referral = await createReferral({
    title: 'Coordinated Entry Referral',
    clientId: input.clientId,
    programId: input.programId,
    providerOrgId: input.providerOrgId,
    status: 'new',
    isExternal: true,
  });

  await attachReferralToVulnerabilityAssessment(input.vulnerabilityAssessmentId, referral.id);

  return referral;
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const hasNotHadBirthdayYet =
    now.getMonth() < parsed.getMonth() ||
    (now.getMonth() === parsed.getMonth() && now.getDate() < parsed.getDate());
  if (hasNotHadBirthdayYet) age -= 1;
  return age;
}

/** `GET /coordinated-entry/prioritization-list` — quick filters compose as an
 * AND (design.md Decision 5 / `coordinated-entry` spec's "Quick Filters
 * Compose" requirement); `topFive` truncates last, after every other filter. */
export async function getPrioritizationList(
  query: PrioritizationListQuery
): Promise<PrioritizationListItem[]> {
  const rows = await findLatestVulnerabilityAssessmentsForPrioritizationList();

  const withDerivedFlags = await Promise.all(
    rows.map(async (row) => {
      const age = ageFromDob(row.client.dob);
      const isUnaccompaniedYouth = Boolean(
        age !== null &&
          age < UNACCOMPANIED_YOUTH_MAX_AGE &&
          (!row.client.householdId || (await countHouseholdMembers(row.client.householdId)) <= 1)
      );
      const isAwaitingReferral = await hasAwaitingReferral(row.clientId);

      const item: PrioritizationListItem = {
        vulnerabilityAssessmentId: row.id,
        clientId: row.clientId,
        clientName: `${row.client.firstName} ${row.client.lastName}`,
        score: row.score,
        priorityTier: row.priorityTier as PrioritizationListItem['priorityTier'],
        safetyAlert: row.safetyAlert,
        isVeteran: row.client.veteranStatus === 'yes' || row.client.veteranStatus === '1',
        isUnaccompaniedYouth,
        isAwaitingReferral,
        assessedAt: row.createdAt.toISOString(),
      };
      return item;
    })
  );

  let filtered = withDerivedFlags;
  if (query.veteran) filtered = filtered.filter((item) => item.isVeteran);
  if (query.unaccompaniedYouth) filtered = filtered.filter((item) => item.isUnaccompaniedYouth);
  if (query.safetyAlert) filtered = filtered.filter((item) => item.safetyAlert);
  if (query.awaitingReferral) filtered = filtered.filter((item) => item.isAwaitingReferral);

  filtered = [...filtered].sort((a, b) => b.score - a.score);

  if (query.topFive) {
    filtered = filtered.filter((item) => item.priorityTier === 'high').slice(0, 5);
  }

  return filtered;
}
