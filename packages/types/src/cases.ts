import type { HudOption } from './hudOptions';

export interface Case {
  id: string;
  clientId: string;
  programEnrollmentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/cases/ensure` input — idempotent per (clientId, enrollmentId). */
export interface EnsureCaseInput {
  clientId: string;
  enrollmentId: string;
}

export type CasePriority = 'high' | 'medium' | 'low';

/** `none | 30 | 60 | 90` — see `case-workspace`'s design.md Decision 2. */
export type FollowUpMilestone = 'none' | '30' | '60' | '90';

/** Case Operations Center's Status column values — `status` stays a free-form
 * String on the Prisma model (per the repo's HUD-coded-scalar convention),
 * these are simply the values this change's UI/filters/KPIs recognize.
 * `cases/ensure`'s own default (`'open'`) is treated as equivalent to
 * `'active'` for display/filtering purposes rather than replaced. */
export type CaseStatus = 'open' | 'active' | 'pending_review' | 'closed';

/** List/detail row shape backing the Case Operations Center table and KPI row. */
export interface CaseListItem {
  id: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  subject: string | null;
  status: string;
  priority: CasePriority | null;
  lastContactDate: string | null;
  assignedCaseManagerId: number | null;
  assignedCaseManagerName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Overview/header fields `case-workspace` adds on top of `CaseListItem`. */
export interface CaseWorkspaceFields {
  description: string | null;
  stage: string | null;
  origin: string | null;
  escalated: boolean;
  contact: string | null;
  referralId: string | null;
  openedDate: string;
  closedAt: string | null;
  nextHmisReviewDue: string | null;
  hmisDataQualityStatus: string | null;
  followUpMilestone: FollowUpMilestone;
  followUpDueDate: string | null;
  createdById: number | null;
  createdByName: string | null;
  updatedById: number | null;
  updatedByName: string | null;
  programName: string | null;
  enrollmentName: string | null;
}

export type CaseFilter =
  | 'all'
  | 'myCaseload'
  | 'highRisk'
  | 'dueToday'
  | 'overdue'
  | 'recentlyUpdated';

export interface CaseListQuery {
  page?: number;
  pageSize?: number;
  filter?: CaseFilter;
  search?: string;
}

export interface CaseTrend {
  percent: number;
  direction: 'up' | 'down' | 'flat';
}

export interface CaseKpiCounts {
  activeCases: number;
  highRisk: number;
  dueToday: number;
  closedCases: number;
  /** Active Cases vs. the count active at the end of last calendar month — see `case-workspace`'s design.md. */
  activeCasesTrend: CaseTrend;
}

/**
 * `kpis` reflects the full case set (not just the current filter/page) —
 * computed alongside the paginated query in the same request so the Case
 * Operations Center's KPI row and table load from one fetch. No separate
 * KPI endpoint exists.
 */
export interface CaseListResult {
  items: CaseListItem[];
  total: number;
  page: number;
  pageSize: number;
  kpis: CaseKpiCounts;
}

/** One of the 7 case-detail tabs. `overview` always has content once the case exists. */
export type CaseTabKey =
  | 'overview'
  | 'plan'
  | 'services'
  | 'assessments'
  | 'referrals'
  | 'hudData'
  | 'healthWellness';

/** `hudData` is never reported here — its "content" is the always-available, computed checklist (see `GET /api/cases/:id/hud-data`), not a readiness flag. */
export type CaseTabsWithContent = Record<Exclude<CaseTabKey, 'hudData'>, boolean>;

export interface CaseDetail extends CaseListItem, CaseWorkspaceFields {
  programEnrollmentId: string;
  tabsWithContent: CaseTabsWithContent;
}

/** `subject` is now required — a case without one is rejected (see the `case-management` spec delta). */
export interface CaseCreateInput {
  clientId: string;
  subject: string;
  description?: string;
  priority?: CasePriority;
  status?: string;
  stage?: string;
  origin?: string;
  escalated?: boolean;
  contact?: string;
  referralId?: string;
  openedDate?: string;
  assignedCaseManagerId?: number;
}

export interface CaseUpdateInput {
  subject?: string;
  description?: string | null;
  status?: string;
  priority?: CasePriority;
  stage?: string | null;
  origin?: string | null;
  escalated?: boolean;
  contact?: string | null;
  referralId?: string | null;
  lastContactDate?: string | null;
  assignedCaseManagerId?: number | null;
  hmisDataQualityStatus?: string | null;
  nextHmisReviewDue?: string | null;
}

export interface CaseFollowUpInput {
  milestone: FollowUpMilestone;
}

/** `GET /api/reference/case-options` response shape — served alongside `hud-options`, never hardcoded on the frontend. */
export interface CaseOptionsResponse {
  stage: HudOption[];
  origin: HudOption[];
  status: HudOption[];
  hmisDataQualityStatus: HudOption[];
  interactionPurpose: HudOption[];
  confidentialityType: HudOption[];
}

/** One HUD-required data point, evaluated at request time — never persisted. */
export interface HudDataChecklistItem {
  key: string;
  label: string;
  passed: boolean;
}

export interface CaseHudDataResponse {
  items: HudDataChecklistItem[];
  /** Rendered from a single config constant — see `apps/api/src/constants/hudDataChecklist.ts`. Wording is an open item, not finalized by this change. */
  disclosureText: string;
}
