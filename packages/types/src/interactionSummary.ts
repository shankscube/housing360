export interface InteractionSummary {
  id: string;
  clientId: string;
  caseId: string;
  title: string;
  status: string;
  meetingNotes: string | null;
  nextSteps: string | null;
  interactionPurpose: string | null;
  confidentialityType: string | null;
  partnerAccount: string | null;
  offering: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `case-workspace`'s four additions are optional here — the intake wizard's
 * step 8 (`client-intake`) still constructs this without them, and defaults
 * to `null` server-side the same as `meetingNotes`/`nextSteps` already do.
 */
export type InteractionSummaryInput = Omit<
  InteractionSummary,
  'id' | 'createdAt' | 'updatedAt' | 'interactionPurpose' | 'confidentialityType' | 'partnerAccount' | 'offering'
> &
  Partial<Pick<InteractionSummary, 'interactionPurpose' | 'confidentialityType' | 'partnerAccount' | 'offering'>>;

export type InteractionSummaryUpdateInput = Partial<
  Omit<InteractionSummaryInput, 'clientId' | 'caseId'>
>;

/** Optional "Create a Task" block on the Interaction Summary form — see `case-workspace`'s design.md Decision 3. */
export interface InteractionSummaryTaskInput {
  createTask: boolean;
  taskTitle?: string;
  taskDescription?: string;
  taskDueDate?: string;
  taskAssignedTo?: number;
  useNextStepsAsDescription?: boolean;
}

export type InteractionSummaryCreateInput = InteractionSummaryInput & {
  task?: InteractionSummaryTaskInput;
};

export interface InteractionSummaryDetail extends InteractionSummary {
  tasks: import('./tasks').Task[];
}
