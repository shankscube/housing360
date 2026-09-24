/**
 * One shared `Task` table backs every "is there anything to do" list in the
 * app — the case Overview tab's Tasks card, a care-plan goal's task list, and
 * an interaction summary's optional "Create a Task" block — see
 * `case-workspace`'s design.md Decision 3. `status`/`priority`/`subtype` are
 * plain strings (HUD-coded-scalar convention applies broadly in this repo),
 * not a fixed union, so a new value never requires a type change here.
 */
export interface Task {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string | null;
  subtype: string | null;
  dueDate: string | null;
  ownerId: number | null;
  ownerName: string | null;
  clientId: string;
  caseId: string | null;
  goalAssignmentId: string | null;
  interactionSummaryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateInput {
  subject: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  subtype?: string | null;
  dueDate?: string | null;
  ownerId?: number | null;
  clientId: string;
  caseId?: string | null;
  goalAssignmentId?: string | null;
  interactionSummaryId?: string | null;
}

export interface TaskUpdateInput {
  subject?: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  dueDate?: string | null;
  ownerId?: number | null;
}

/** Single-select filter for the Tasks page's `GET /api/tasks` list — combines with `search`, never with another filter value. */
export type TaskFilter = 'all' | 'due_today' | 'overdue' | 'upcoming';

/** A task list row plus the client's display name (`ownerName` is already on `Task`). */
export interface TaskListItem extends Task {
  clientName: string;
}

export interface TaskListQuery {
  filter?: TaskFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TaskListResult {
  items: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
}
