import type { Task, TaskListItem } from '@housing360/types';
import type { TaskListRow, TaskRow } from './task.model';

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    subtype: row.subtype,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    ownerId: row.owner?.id ?? null,
    ownerName: row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : null,
    clientId: row.clientId,
    caseId: row.caseId,
    goalAssignmentId: row.goalAssignmentId,
    interactionSummaryId: row.interactionSummaryId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTaskListItem(row: TaskListRow): TaskListItem {
  return {
    ...toTask(row),
    clientName: `${row.client.firstName} ${row.client.lastName}`,
  };
}
