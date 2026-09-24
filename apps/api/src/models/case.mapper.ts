import type {
  CaseDetail,
  CaseListItem,
  CasePriority,
  CaseTabsWithContent,
  FollowUpMilestone,
} from '@housing360/types';
import type { CaseListRow } from './case.model';

const VALID_PRIORITIES: readonly CasePriority[] = ['high', 'medium', 'low'];

function toCasePriority(priority: string | null): CasePriority | null {
  return priority && (VALID_PRIORITIES as readonly string[]).includes(priority)
    ? (priority as CasePriority)
    : null;
}

const VALID_FOLLOW_UP_MILESTONES: readonly FollowUpMilestone[] = ['none', '30', '60', '90'];

function toFollowUpMilestone(milestone: string): FollowUpMilestone {
  return (VALID_FOLLOW_UP_MILESTONES as readonly string[]).includes(milestone)
    ? (milestone as FollowUpMilestone)
    : 'none';
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
    description: row.description,
    stage: row.stage,
    origin: row.origin,
    escalated: row.escalated,
    contact: row.contact,
    referralId: row.referralId,
    openedDate: row.openedDate.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    nextHmisReviewDue: row.nextHmisReviewDue ? row.nextHmisReviewDue.toISOString() : null,
    hmisDataQualityStatus: row.hmisDataQualityStatus,
    followUpMilestone: toFollowUpMilestone(row.followUpMilestone),
    followUpDueDate: row.followUpDueDate ? row.followUpDueDate.toISOString() : null,
    createdById: row.createdBy?.id ?? null,
    createdByName: row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : null,
    updatedById: row.updatedBy?.id ?? null,
    updatedByName: row.updatedBy ? `${row.updatedBy.firstName} ${row.updatedBy.lastName}` : null,
    programName: row.programEnrollment?.program?.name ?? null,
    enrollmentName: row.programEnrollment?.name ?? null,
  };
}
