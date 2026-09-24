import type {
  InteractionSummary,
  InteractionSummaryCreateInput,
  InteractionSummaryDetail,
  InteractionSummaryUpdateInput,
} from '@housing360/types';
import {
  createInteractionSummary as createInteractionSummaryRow,
  findInteractionSummariesByCase,
  findInteractionSummaryById,
  updateInteractionSummary as updateInteractionSummaryRow,
} from '../models/interactionSummary.model';
import { toInteractionSummary } from '../models/interactionSummary.mapper';
import { createTask, listTasksByInteractionSummary } from './task.service';
import { AppError } from '../utils/AppError';

export async function listInteractionSummariesByCase(
  caseId: string,
  search?: string
): Promise<InteractionSummary[]> {
  const rows = await findInteractionSummariesByCase(caseId, search);
  return rows.map(toInteractionSummary);
}

/** `POST /interaction-summaries` — always a create; the wizard's step 8 is optional
 * (see spec's "Interaction Summary Step Is Optional") and only calls this when the
 * case manager answers Yes. `case-workspace`'s Overview tab form reuses the same
 * endpoint with its own optional "Create a Task" block. */
export async function createInteractionSummary(
  input: InteractionSummaryCreateInput
): Promise<InteractionSummary> {
  const row = await createInteractionSummaryRow({
    clientId: input.clientId,
    caseId: input.caseId,
    title: input.title,
    status: input.status,
    meetingNotes: input.meetingNotes ?? null,
    nextSteps: input.nextSteps ?? null,
    interactionPurpose: input.interactionPurpose ?? null,
    confidentialityType: input.confidentialityType ?? null,
    partnerAccount: input.partnerAccount ?? null,
    offering: input.offering ?? null,
  });

  if (input.task?.createTask) {
    if (!input.task.taskTitle || !input.task.taskTitle.trim()) {
      throw new AppError(400, 'Please enter a subject for the task.');
    }
    await createTask({
      subject: input.task.taskTitle,
      description: input.task.useNextStepsAsDescription ? input.nextSteps ?? null : input.task.taskDescription ?? null,
      dueDate: input.task.taskDueDate ?? null,
      ownerId: input.task.taskAssignedTo ?? null,
      clientId: input.clientId,
      caseId: input.caseId,
      subtype: 'interactionSummary',
      interactionSummaryId: row.id,
    });
  }

  return toInteractionSummary(row);
}

export async function updateInteractionSummary(
  id: string,
  input: InteractionSummaryUpdateInput
): Promise<InteractionSummary> {
  const existing = await findInteractionSummaryById(id);
  if (!existing) {
    throw new AppError(404, 'Interaction summary not found');
  }
  const row = await updateInteractionSummaryRow(id, {
    title: input.title,
    status: input.status,
    meetingNotes: input.meetingNotes,
    nextSteps: input.nextSteps,
    interactionPurpose: input.interactionPurpose,
    confidentialityType: input.confidentialityType,
    partnerAccount: input.partnerAccount,
    offering: input.offering,
  });
  return toInteractionSummary(row);
}

export async function getInteractionSummaryDetail(id: string): Promise<InteractionSummaryDetail> {
  const row = await findInteractionSummaryById(id);
  if (!row) {
    throw new AppError(404, 'Interaction summary not found');
  }
  const tasks = await listTasksByInteractionSummary(id);
  return { ...toInteractionSummary(row), tasks };
}
