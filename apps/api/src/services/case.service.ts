import type {
  Case,
  CaseCreateInput,
  CaseDetail,
  CaseFilter,
  CaseHudDataResponse,
  CaseKpiCounts,
  CaseListItem,
  CaseListQuery,
  CaseListResult,
  CaseTabsWithContent,
  CaseUpdateInput,
  EnsureCaseInput,
} from '@housing360/types';
import {
  countCaseKpis,
  createCase as createCaseRow,
  ensureCase as ensureCaseRow,
  findCaseById,
  findCases,
  type CaseListRow,
  type CaseUpdateData,
  updateCase as updateCaseRow,
} from '../models/case.model';
import { toCaseDetail, toCaseListItem } from '../models/case.mapper';
import { findClientById } from '../models/client.model';
import { findEnrollmentsByClient } from '../models/enrollment.model';
import { findAssessmentByEnrollmentAndStage } from '../models/assessment.model';
import { findDisabilitiesByAssessmentId } from '../models/disability.model';
import {
  HUD_DATA_CHECKLIST,
  HUD_WORKSPACE_DISCLOSURE_TEXT,
  type HudDataChecklistContext,
} from '../constants/hudDataChecklist';
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

export async function getCaseKpiCounts(): Promise<CaseKpiCounts> {
  const counts = await countCaseKpis();
  return {
    activeCases: counts.activeCases,
    highRisk: counts.highRisk,
    dueToday: counts.dueToday,
    closedCases: counts.closedCases,
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
  const assessment = await findAssessmentByEnrollmentAndStage(row.programEnrollmentId, ENTRY_STAGE);
  return {
    overview: true,
    plan: false,
    services: false,
    assessments: assessment !== null,
    referrals: false,
    healthWellness: false,
  };
}

export async function getCaseById(id: string): Promise<CaseDetail> {
  const row = await findCaseById(id);
  if (!row) {
    throw new AppError(404, 'Case not found');
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
export async function createCase(input: CaseCreateInput): Promise<CaseDetail> {
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
    subject: input.subject ?? null,
    priority: input.priority ?? null,
    assignedCaseManagerId: input.assignedCaseManagerId ?? null,
  });

  const tabsWithContent = await computeTabsWithContent(row);
  return toCaseDetail(row, tabsWithContent);
}

export async function updateCase(id: string, input: CaseUpdateInput): Promise<CaseDetail> {
  const existing = await findCaseById(id);
  if (!existing) {
    throw new AppError(404, 'Case not found');
  }

  const data: CaseUpdateData = {};
  if (input.subject !== undefined) {
    data.subject = input.subject;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.priority !== undefined) {
    data.priority = input.priority;
  }
  if (input.lastContactDate !== undefined) {
    data.lastContactDate = input.lastContactDate ? new Date(input.lastContactDate) : null;
  }
  if (input.assignedCaseManagerId !== undefined) {
    data.assignedCaseManagerId = input.assignedCaseManagerId;
  }

  const row = await updateCaseRow(id, data);

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
