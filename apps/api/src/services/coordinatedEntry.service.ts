import type {
  CeAssessmentDetail,
  CeAssessmentFlags,
  CeAssessmentInput,
  CeQuestion,
  CeReferralInput,
  ClientRecommendation,
  PriorityQueueItem,
  PriorityQueueQuery,
  PriorityQueueResult,
  Referral,
  RecommendedProgram,
} from '@housing360/types';
import {
  attachReferralToCeAssessment,
  createCeAssessment,
  findActiveQuestions,
  findCeAssessmentById,
  findLatestCeAssessmentByClient,
  findLatestCeAssessmentsForQueue,
  findPreviousCeAssessmentsByClient,
} from '../models/coordinatedEntry.model';
import { toCeAssessment, toCeAssessmentDetail, toCeQuestion } from '../models/coordinatedEntry.mapper';
import { deriveRecommendation, score as scoreCeAssessment } from './coordinatedEntryEngine.service';
import { findActiveProgramsByProjectType } from '../models/program.model';
import { countAvailableBeds } from '../models/bed.model';
import { createReferral } from '../models/referral.model';
import { toReferral } from '../models/referral.mapper';
import { findFirstPartnerOrganization } from '../models/organization.model';
import { insertReferralStatusEvent } from '../models/referralStatusEvent.model';
import { recordActivity } from './recordActivity.service';
import { AppError } from '../utils/AppError';

function normalizeFlags(flags: Partial<CeAssessmentFlags> | undefined): CeAssessmentFlags {
  return {
    veteran: Boolean(flags?.veteran),
    unaccompaniedYouth: Boolean(flags?.unaccompaniedYouth),
    safetyAlert: Boolean(flags?.safetyAlert),
  };
}

/** `GET /api/ce/questions` — active only, ordered by `sequence`. */
export async function listActiveQuestions(): Promise<CeQuestion[]> {
  const rows = await findActiveQuestions();
  return rows.map(toCeQuestion);
}

/**
 * `POST /api/ce/assessments` — scores via `CoordinatedEntryService.score`
 * (`coordinatedEntryEngine.service.ts`), never inline here, then persists the
 * `CeAssessment` + one `CeResponse` row per answer.
 */
export async function submitCeAssessment(
  input: CeAssessmentInput,
  assessedById: number
): Promise<CeAssessmentDetail> {
  if (!input?.clientId) {
    throw new AppError(400, 'clientId is required');
  }
  if (!input.responses || input.responses.length === 0) {
    throw new AppError(400, 'At least one response is required');
  }

  const flags = normalizeFlags(input.flags);
  const result = await scoreCeAssessment(input.responses, flags);

  const row = await createCeAssessment({
    clientId: input.clientId,
    assessedById,
    totalScore: result.score,
    bandId: result.bandId,
    flags,
    responses: result.responseScores,
  });

  const previous = await findPreviousCeAssessmentsByClient(row.clientId, row.id);

  return toCeAssessmentDetail(row, {
    recommendedProjectTypes: result.recommendedProjectTypes,
    appliedOverrides: result.appliedOverrides,
    referralSuppressed: result.referralSuppressed,
    externalReferralMessage: result.externalReferralMessage,
    previousAssessments: previous.map(toCeAssessment),
  });
}

/** `GET /api/ce/assessments/:id` — full detail, including this client's prior
 * assessments. Overrides/recommendation are recomputed at read time — see
 * `coordinatedEntryEngine.service.ts`'s `deriveRecommendation` doc comment. */
export async function getCeAssessmentDetail(id: string): Promise<CeAssessmentDetail> {
  const row = await findCeAssessmentById(id);
  if (!row) {
    throw new AppError(404, 'Coordinated Entry assessment not found');
  }

  const flags = normalizeFlags(row.flags as Partial<CeAssessmentFlags> | undefined);
  const responseScores = row.responses.map((response) => ({
    questionId: response.questionId,
    score: response.score,
  }));
  const recommendation = await deriveRecommendation(row.bandId, flags, responseScores);
  const previous = await findPreviousCeAssessmentsByClient(row.clientId, row.id);

  return toCeAssessmentDetail(row, {
    recommendedProjectTypes: recommendation.recommendedProjectTypes,
    appliedOverrides: recommendation.appliedOverrides,
    referralSuppressed: recommendation.referralSuppressed,
    externalReferralMessage: recommendation.externalReferralMessage,
    previousAssessments: previous.map(toCeAssessment),
  });
}

/** `GET /api/ce/clients/:id/recommendation` — the client's latest
 * `CeAssessment`'s band/recommended-types/overrides/suppression state. */
export async function getClientRecommendation(clientId: string): Promise<ClientRecommendation> {
  const latest = await findLatestCeAssessmentByClient(clientId);
  if (!latest) {
    throw new AppError(404, 'Client has no Coordinated Entry assessment yet');
  }

  const flags = normalizeFlags(latest.flags as Partial<CeAssessmentFlags> | undefined);
  const responseScores = latest.responses.map((response) => ({
    questionId: response.questionId,
    score: response.score,
  }));
  const recommendation = await deriveRecommendation(latest.bandId, flags, responseScores);

  return {
    ceAssessmentId: latest.id,
    totalScore: latest.totalScore,
    bandId: latest.bandId,
    bandName: recommendation.bandName,
    recommendedProjectTypes: recommendation.recommendedProjectTypes,
    appliedOverrides: recommendation.appliedOverrides,
    referralSuppressed: recommendation.referralSuppressed,
    externalReferralMessage: recommendation.externalReferralMessage,
  };
}

/** `GET /api/ce/recommended-programs?projectType=` — active programs whose
 * `projectTypeCode` matches, with operating organization address and a live
 * available-bed count. */
export async function getRecommendedProgramsByProjectType(projectType: string): Promise<RecommendedProgram[]> {
  if (!projectType) {
    throw new AppError(400, 'projectType is required');
  }

  const programs = await findActiveProgramsByProjectType(projectType);
  return Promise.all(
    programs.map(async (program) => ({
      id: program.id,
      name: program.name,
      projectTypeCode: program.projectTypeCode,
      operatingOrganization: program.operatingOrganization
        ? {
            id: program.operatingOrganization.id,
            name: program.operatingOrganization.name,
            address: program.operatingOrganization.address,
          }
        : null,
      availableBedCount: await countAvailableBeds(program.id),
    }))
  );
}

function matchesSearch(clientName: string, search: string | undefined): boolean {
  if (!search) return true;
  return clientName.toLowerCase().includes(search.trim().toLowerCase());
}

/**
 * `GET /api/ce/priority-queue` — every client's LATEST `CeAssessment`, ranked
 * by priority then score. Since `CeScoreBand` ranges are contiguous and
 * non-overlapping, sorting by `totalScore` descending already ranks by band
 * priority too (a higher score is never in a lower band) — no separate
 * band-priority lookup needed. `filter` is SINGLE-select (design.md Decision
 * 13 / coordinated-entry spec's "Priority Queue Filter Is Single-Select"),
 * combined with `search`; `TOP5` truncates last, after search/filter.
 */
export async function getPriorityQueue(query: PriorityQueueQuery): Promise<PriorityQueueResult> {
  const rows = await findLatestCeAssessmentsForQueue();

  let items: PriorityQueueItem[] = rows
    .map((row) => {
      const flags = normalizeFlags(row.flags as Partial<CeAssessmentFlags> | undefined);
      const item: PriorityQueueItem = {
        ceAssessmentId: row.id,
        clientId: row.clientId,
        clientName: `${row.client.firstName} ${row.client.lastName}`,
        totalScore: row.totalScore,
        bandId: row.bandId,
        bandName: row.band?.name ?? null,
        flags,
        isAwaitingReferral: row.referralId === null,
        assessedAt: row.assessedAt.toISOString(),
      };
      return item;
    })
    .filter((item) => matchesSearch(item.clientName, query.search));

  switch (query.filter) {
    case 'VETERAN':
      items = items.filter((item) => item.flags.veteran);
      break;
    case 'YOUTH':
      items = items.filter((item) => item.flags.unaccompaniedYouth);
      break;
    case 'SAFETY_ALERT':
      items = items.filter((item) => item.flags.safetyAlert);
      break;
    case 'AWAITING_REFERRAL':
      items = items.filter((item) => item.isAwaitingReferral);
      break;
    case 'TOP5':
    default:
      break;
  }

  items = [...items].sort((a, b) => b.totalScore - a.totalScore);

  if (query.filter === 'TOP5') {
    const top5 = items.slice(0, 5);
    return { items: top5, total: top5.length, page: 1, pageSize: top5.length || 5 };
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return { items: paged, total, page, pageSize };
}

/**
 * `POST /api/ce/referrals` — reuses the shared `Referral` table
 * (`isExternal: true`, `status: 'new'`), same pattern as
 * `referral.service.ts`'s `createExternalReferral`, and links back via
 * `CeAssessment.referralId` so `AWAITING_REFERRAL` filtering reflects it.
 *
 * Two schema gaps with no clean existing concept, resolved by best judgment
 * (see this change's report): "referrer's default organization" is the
 * earliest-created `isPartner: true` `Organization`, or `null` if none exists;
 * "provider case manager" is the free-text `Referral.providerContact` field
 * (there's no FK for this anywhere else in the schema either).
 */
export async function createCeReferral(input: CeReferralInput, requestingUserId: number): Promise<Referral> {
  if (!input?.ceAssessmentId) {
    throw new AppError(400, 'ceAssessmentId is required');
  }

  const ceAssessment = await findCeAssessmentById(input.ceAssessmentId);
  if (!ceAssessment) {
    throw new AppError(404, 'Coordinated Entry assessment not found');
  }
  if (ceAssessment.referralId) {
    throw new AppError(409, 'This Coordinated Entry assessment already has a referral');
  }

  const referrerOrg = await findFirstPartnerOrganization();

  const initialStatus = 'new';
  const row = await createReferral({
    title: 'Coordinated Entry Referral',
    clientId: ceAssessment.clientId,
    programId: input.programId ?? null,
    providerOrgId: input.providerOrgId ?? null,
    referrerOrgId: referrerOrg?.id ?? null,
    providerContact: input.providerContact ?? null,
    status: initialStatus,
    isExternal: true,
  });

  await attachReferralToCeAssessment(ceAssessment.id, row.id);
  await insertReferralStatusEvent(row.id, null, initialStatus, requestingUserId);
  recordActivity(requestingUserId, 'referral', row.id, 'modified');

  return toReferral(row);
}
