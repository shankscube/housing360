import type { InteractionSummary } from '@housing360/types';
import type { InteractionSummaryRow } from './interactionSummary.model';

export function toInteractionSummary(row: InteractionSummaryRow): InteractionSummary {
  return {
    id: row.id,
    clientId: row.clientId,
    caseId: row.caseId,
    title: row.title,
    status: row.status,
    meetingNotes: row.meetingNotes,
    nextSteps: row.nextSteps,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
