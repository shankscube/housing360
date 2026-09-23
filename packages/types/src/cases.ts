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

export interface CaseKpiCounts {
  activeCases: number;
  highRisk: number;
  dueToday: number;
  closedCases: number;
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

export interface CaseDetail extends CaseListItem {
  programEnrollmentId: string;
  tabsWithContent: CaseTabsWithContent;
}

export interface CaseCreateInput {
  clientId: string;
  subject?: string;
  priority?: CasePriority;
  assignedCaseManagerId?: number;
}

export interface CaseUpdateInput {
  subject?: string;
  status?: string;
  priority?: CasePriority;
  lastContactDate?: string | null;
  assignedCaseManagerId?: number | null;
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
