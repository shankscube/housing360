import type { Task } from '@housing360/types';
import type { TaskRow } from './task.model';

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
