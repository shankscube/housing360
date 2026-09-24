import type {
  Case,
  CaseCreateInput,
  CaseDetail,
  CaseFilter,
  CaseFollowUpInput,
  CaseHudDataResponse,
  CaseKpiCounts,
  CaseListItem,
  CaseListQuery,
  CaseListResult,
  CaseTabsWithContent,
  CaseTrend,
  CaseUpdateInput,
  EnsureCaseInput,
} from '@housing360/types';
import {
  countActiveCasesAsOf,
  countCaseKpis,
  createCase as createCaseRow,
  ensureCase as ensureCaseRow,
  findCaseById,
  findCases,
  hasClinicalData,
  type CaseListRow,
  type CaseUpdateData,
  updateCase as updateCaseRow,
  updateCaseFollowUp as updateCaseFollowUpRow,
} from '../models/case.model';
import { toCaseDetail, toCaseListItem } from '../models/case.mapper';
import { findClientById } from '../models/client.model';
import { findEnrollmentsByClient } from '../models/enrollment.model';
import { findAssessmentByEnrollmentAndStage } from '../models/assessment.model';
import { findDisabilitiesByAssessmentId } from '../models/disability.model';
import { countCarePlansByCase } from '../models/carePlan.model';
import { countBenefitAssignmentsByClient } from '../models/service.model';
import { attachOrphanReferralsToCase, countReferralsByCase } from '../models/referral.model';
import { findActiveReleaseOfInformation } from '../models/releaseOfInformation.model';
import {
  HUD_DATA_CHECKLIST,
  HUD_WORKSPACE_DISCLOSURE_TEXT,
  type HudDataChecklistContext,
} from '../constants/hudDataChecklist';
import { recordActivity } from './recordActivity.service';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = 1;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePagination(query: CaseListQuery): { page: number; pageSize: number } {
  const page =
    query.page !== undefined && Number.isFinite(query.page) && query.page > 0
      ? Math.floor(query.page)
      : DEFAULT_PAGE;
  const pageSize =
    query.pageSize !== undefined && Number.isFinite(query.pageSize) && query.pageSize > 0
      ? Math.min(Math.floor(query.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

export async function ensureCase(input: EnsureCaseInput): Promise<Case> {
  // Type field is `enrollmentId`; the Prisma column is `programEnrollmentId`.
  const row = await ensureCaseRow(input.clientId, input.enrollmentId);
  await attachOrphanReferralsToCase(input.clientId, row.id);
  return {
    id: row.id,
    clientId: row.clientId,
    programEnrollmentId: row.programEnrollmentId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCases(
  query: CaseListQuery,
  requestingUserId: number
): Promise<CaseListResult> {
  const { page, pageSize } = normalizePagination(query);
  const filter: CaseFilter = query.filter ?? 'all';

  const [{ rows, total }, kpis] = await Promise.all([
    findCases({ page, pageSize, filter, search: query.search, requestingUserId }),
    getCaseKpiCounts(),
  ]);
  const items: CaseListItem[] = rows.map(toCaseListItem);

  return { items, total, page, pageSize, kpis };
}

function endOfLastMonth(now: Date): Date {
  // Day 0 of the current month is the last day of the previous month.
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
}

function computeTrend(current: number, previous: number): CaseTrend {
  if (previous === 0) {
    return current === 0 ? { percent: 0, direction: 'flat' } : { percent: 100, direction: 'up' };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  const direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';
  return { percent: Math.abs(percent), direction };
}

export async function getCaseKpiCounts(): Promise<CaseKpiCounts> {
  const [counts, lastMonthActiveCases] = await Promise.all([
    countCaseKpis(),
    countActiveCasesAsOf(endOfLastMonth(new Date())),
  ]);
  return {
    activeCases: counts.activeCases,
    highRisk: counts.highRisk,
    dueToday: counts.dueToday,
    closedCases: counts.closedCases,
    activeCasesTrend: computeTrend(counts.activeCases, lastMonthActiveCases),
  };
}

/**
 * Plan/Services/Referrals/Health and Wellness have no backing data model yet
 * — this change only adds the tab structure for them (see design.md's
 * "computed readiness, not stored flags" decision), so they always report
 * `false` here until a future change gives each its own table with a
 * `caseId` FK. Assessments is the one tab that can honestly report real
 * content today, since `Assessment` already exists from the intake wizard.
 */
async function computeTabsWithContent(row: CaseListRow): Promise<CaseTabsWithContent> {
  const [assessment, carePlanCount, benefitAssignmentCount, referralCount, activeRoi, clinicalData] =
    await Promise.all([
      findAssessmentByEnrollmentAndStage(row.programEnrollmentId, ENTRY_STAGE),
      countCarePlansByCase(row.id),
      countBenefitAssignmentsByClient(row.clientId),
      countReferralsByCase(row.id),
      findActiveReleaseOfInformation(row.clientId),
      hasClinicalData(row.clientId),
    ]);
  return {
    overview: true,
    plan: carePlanCount > 0,
    services: benefitAssignmentCount > 0,
    assessments: assessment !== null,
    referrals: referralCount > 0,
    healthWellness: activeRoi !== null || clinicalData,
  };
}

export async function getCaseById(id: string, requestingUserId?: number): Promise<CaseDetail> {
  const row = await findCaseById(id);
  if (!row) {
    throw new AppError(404, 'Case not found');
  }
  if (requestingUserId !== undefined) {
    recordActivity(requestingUserId, 'case', id, 'viewed');
  }
  const tabsWithContent = await computeTabsWithContent(row);
  return toCaseDetail(row, tabsWithContent);
}

/**
 * A case created directly from the Case Operations Center (independent of
 * `cases/ensure`) still needs a `programEnrollmentId` — that FK is required
 * and part of `Case`'s existing compound unique key, unchanged by this
 * change. The prompt's data model for this endpoint names only a client
 * reference, so the enrollment is derived rather than requested from the
 * caller: the client's primary enrollment (or first, if none is marked
 * primary), the same "primary-or-first" convention already used by
 * `client.service.ts`'s intake-snapshot endpoint.
 */
export async function createCase(input: CaseCreateInput, requestingUserId: number): Promise<CaseDetail> {
  if (!input.subject || !input.subject.trim()) {
    throw new AppError(400, 'Subject is required to create a case');
  }

  const client = await findClientById(input.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const enrollments = await findEnrollmentsByClient(input.clientId);
  const enrollment = enrollments.find((e) => e.isPrimary) ?? enrollments[0];
  if (!enrollment) {
    throw new AppError(400, 'Client must have a program enrollment before a case can be created');
  }

  const row = await createCaseRow({
    clientId: input.clientId,
    programEnrollmentId: enrollment.id,
    subject: input.subject,
    description: input.description ?? null,
    status: input.status,
    priority: input.priority ?? null,
    stage: input.stage ?? null,
    origin: input.origin ?? null,
    escalated: input.escalated ?? false,
    contact: input.contact ?? null,
    referralId: input.referralId ?? null,
    openedDate: input.openedDate ? new Date(input.openedDate) : undefined,
    assignedCaseManagerId: input.assignedCaseManagerId ?? null,
    createdById: requestingUserId,
  });

  await attachOrphanReferralsToCase(input.clientId, row.id);
  recordActivity(requestingUserId, 'case', row.id, 'modified');

  const tabsWithContent = await computeTabsWithContent(row);
  return toCaseDetail(row, tabsWithContent);
}

export async function updateCase(
  id: string,
  input: CaseUpdateInput,
  requestingUserId: number
): Promise<CaseDetail> {
  const existing = await findCaseById(id);
  if (!existing) {
    throw new AppError(404, 'Case not found');
  }

  const data: CaseUpdateData = { updatedById: requestingUserId };
  if (input.subject !== undefined) {
    data.subject = input.subject;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.priority !== undefined) {
    data.priority = input.priority;
  }
  if (input.stage !== undefined) {
    data.stage = input.stage;
  }
  if (input.origin !== undefined) {
    data.origin = input.origin;
  }
  if (input.escalated !== undefined) {
    data.escalated = input.escalated;
  }
  if (input.contact !== undefined) {
    data.contact = input.contact;
  }
  if (input.referralId !== undefined) {
    data.referralId = input.referralId;
  }
  if (input.lastContactDate !== undefined) {
    data.lastContactDate = input.lastContactDate ? new Date(input.lastContactDate) : null;
  }
  if (input.assignedCaseManagerId !== undefined) {
    data.assignedCaseManagerId = input.assignedCaseManagerId;
  }
  if (input.hmisDataQualityStatus !== undefined) {
    data.hmisDataQualityStatus = input.hmisDataQualityStatus;
  }
  if (input.nextHmisReviewDue !== undefined) {
    data.nextHmisReviewDue = input.nextHmisReviewDue ? new Date(input.nextHmisReviewDue) : null;
  }

  const row = await updateCaseRow(id, data);
  recordActivity(requestingUserId, 'case', id, 'modified');

  const tabsWithContent = await computeTabsWithContent(row);
  return toCaseDetail(row, tabsWithContent);
}

const FOLLOW_UP_DAYS: Record<string, number> = { '30': 30, '60': 60, '90': 90 };

/**
 * The due date is computed from the moment the reminder is set (`now()`),
 * not from `openedDate` or `lastContactDate` — see design.md Decision 2.
 * "none" clears both columns.
 */
export async function updateCaseFollowUp(
  id: string,
  input: CaseFollowUpInput,
  requestingUserId: number
): Promise<CaseDetail> {
  const existing = await findCaseById(id);
  if (!existing) {
    throw new AppError(404, 'Case not found');
  }

  const days = FOLLOW_UP_DAYS[input.milestone];
  const followUpDueDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  const row = await updateCaseFollowUpRow(id, {
    followUpMilestone: input.milestone,
    followUpDueDate,
    updatedById: requestingUserId,
  });
  recordActivity(requestingUserId, 'case', id, 'modified');

  const tabsWithContent = await computeTabsWithContent(row);
  return toCaseDetail(row, tabsWithContent);
}

export async function getCaseHudData(caseId: string): Promise<CaseHudDataResponse> {
  const caseRow = await findCaseById(caseId);
  if (!caseRow) {
    throw new AppError(404, 'Case not found');
  }

  const client = await findClientById(caseRow.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const assessment = await findAssessmentByEnrollmentAndStage(caseRow.programEnrollmentId, ENTRY_STAGE);
  const disabilities = assessment ? await findDisabilitiesByAssessmentId(assessment.id) : [];

  const context: HudDataChecklistContext = {
    client: { veteranStatus: client.veteranStatus, raceEthnicity: client.raceEthnicity },
    assessment: assessment
      ? {
          situationCategory: assessment.situationCategory,
          incomeFromAnySource: assessment.incomeFromAnySource,
          benefitsFromAnySource: assessment.benefitsFromAnySource,
          insuranceFromAnySource: assessment.insuranceFromAnySource,
          generalHealthStatus: assessment.generalHealthStatus,
          domesticViolenceSurvivor: assessment.domesticViolenceSurvivor,
        }
      : null,
    disabilityCount: disabilities.length,
  };

  const items = HUD_DATA_CHECKLIST.map((definition) => ({
    key: definition.key,
    label: definition.label,
    passed: definition.check(context),
  }));

  return { items, disclosureText: HUD_WORKSPACE_DISCLOSURE_TEXT };
}
