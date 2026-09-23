import type { CaseDetail, CaseListItem, CasePriority, CaseTabsWithContent } from '@housing360/types';
import type { CaseListRow } from './case.model';

const VALID_PRIORITIES: readonly CasePriority[] = ['high', 'medium', 'low'];

function toCasePriority(priority: string | null): CasePriority | null {
  return priority && (VALID_PRIORITIES as readonly string[]).includes(priority)
    ? (priority as CasePriority)
    : null;
}

export function toCaseListItem(row: CaseListRow): CaseListItem {
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    subject: row.subject,
    status: row.status,
    priority: toCasePriority(row.priority),
    lastContactDate: row.lastContactDate ? row.lastContactDate.toISOString() : null,
    assignedCaseManagerId: row.assignedCaseManager?.id ?? null,
    assignedCaseManagerName: row.assignedCaseManager
      ? `${row.assignedCaseManager.firstName} ${row.assignedCaseManager.lastName}`
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCaseDetail(row: CaseListRow, tabsWithContent: CaseTabsWithContent): CaseDetail {
  return {
    ...toCaseListItem(row),
    programEnrollmentId: row.programEnrollmentId,
    tabsWithContent,
  };
}
