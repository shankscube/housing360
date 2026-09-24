import type { Task, TaskCreateInput, TaskUpdateInput } from '@housing360/types';
import {
  createTask as createTaskRow,
  findTaskById,
  findTasksByCase,
  findTasksByGoalAssignment,
  findTasksByInteractionSummary,
  updateTask as updateTaskRow,
  updateTaskStatus as updateTaskStatusRow,
} from '../models/task.model';
import { toTask } from '../models/task.mapper';
import { AppError } from '../utils/AppError';

export async function listTasksByCase(caseId: string): Promise<Task[]> {
  const rows = await findTasksByCase(caseId);
  return rows.map(toTask);
}

export async function listTasksByInteractionSummary(interactionSummaryId: string): Promise<Task[]> {
  const rows = await findTasksByInteractionSummary(interactionSummaryId);
  return rows.map(toTask);
}

export async function listTasksByGoalAssignment(goalAssignmentId: string): Promise<Task[]> {
  const rows = await findTasksByGoalAssignment(goalAssignmentId);
  return rows.map(toTask);
}

/** Every task subtype (plain case task, goal task, follow-up-created task) shares this one required-subject rule. */
export async function createTask(input: TaskCreateInput): Promise<Task> {
  if (!input.subject || !input.subject.trim()) {
    throw new AppError(400, 'Please enter a subject for the task.');
  }

  const row = await createTaskRow({
    subject: input.subject,
    description: input.description ?? null,
    status: input.status ?? 'open',
    priority: input.priority ?? null,
    subtype: input.subtype ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    ownerId: input.ownerId ?? null,
    clientId: input.clientId,
    caseId: input.caseId ?? null,
    goalAssignmentId: input.goalAssignmentId ?? null,
    interactionSummaryId: input.interactionSummaryId ?? null,
  });
  return toTask(row);
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task> {
  const existing = await findTaskById(id);
  if (!existing) {
    throw new AppError(404, 'Task not found');
  }
  if (input.subject !== undefined && !input.subject.trim()) {
    throw new AppError(400, 'Please enter a subject for the task.');
  }

  const row = await updateTaskRow(id, {
    subject: input.subject,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
    ownerId: input.ownerId,
  });
  return toTask(row);
}

export async function updateTaskStatus(id: string, status: string): Promise<Task> {
  const existing = await findTaskById(id);
  if (!existing) {
    throw new AppError(404, 'Task not found');
  }
  const row = await updateTaskStatusRow(id, status);
  return toTask(row);
}
