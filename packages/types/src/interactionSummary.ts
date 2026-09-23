export interface InteractionSummary {
  id: string;
  clientId: string;
  caseId: string;
  title: string;
  status: string;
  meetingNotes: string | null;
  nextSteps: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InteractionSummaryInput = Omit<InteractionSummary, 'id' | 'createdAt' | 'updatedAt'>;
