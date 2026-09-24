import type { AssessmentEligibilityStage, AssessmentListItem, AssessmentType } from '@housing360/types';

/** Assessment status label + tone word — `statusToneByLabel.ts` already
 * registers "Completed"/"Due Today"/"In Progress"/"Overdue" for this exact
 * screen, so the label alone drives `StatusBadge`'s color. Distinct from the
 * raw stored `status` (`in_progress`/`completed`) — "Overdue"/"Due Today" are
 * computed from `dueDate`, the same "computed, not stored" convention as
 * `Case`'s due-today/overdue filters. */
export function assessmentDisplayStatus(row: Pick<AssessmentListItem, 'status' | 'dueDate'>): string {
  if (row.status === 'completed') return 'Completed';
  if (row.dueDate) {
    const due = new Date(row.dueDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    if (due < todayStart) return 'Overdue';
    if (due >= todayStart && due < todayEnd) return 'Due Today';
  }
  return 'In Progress';
}

export function assessmentTypeLabel(type: string | null): string {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function hudStageLabel(stage: number): string {
  if (stage === 1) return 'Entry';
  if (stage === 2) return 'Annual';
  if (stage === 3) return 'Exit';
  return String(stage);
}

/**
 * Local mirror of `apps/api/src/constants/assessmentTypes.ts`'s
 * `TYPE_TO_STAGE` map — no endpoint exposes this mapping, and it's small/
 * stable enough (the same "this phase's simplification of HUD 3.917's real
 * data-collection-stage codes" the server file documents) to duplicate here
 * rather than invent a reference-data round trip for three numbers. Keep the
 * two in sync if the server mapping ever changes. `assessment-and-ce-workspace`
 * — the Launch Assessment / Assessment form modals need this to populate
 * `AssessmentInput.dataCollectionStage`, which the server does NOT derive
 * from `type` on create (only the reverse).
 */
const ASSESSMENT_TYPE_TO_STAGE: Record<AssessmentType, number> = {
  entry: 1,
  annual: 2,
  exit: 3,
};

export function assessmentTypeToDataCollectionStage(type: AssessmentType): number {
  return ASSESSMENT_TYPE_TO_STAGE[type];
}

/**
 * Design.md Decision 1's UI framing: `Assessment.status` stays `in_progress`/
 * `completed` on the wire and in every existing consumer, but the Launch/Form
 * modals and the Command Center's row actions present it to case managers as
 * "Draft"/"Complete".
 */
export function assessmentStatusLabel(status: string): string {
  if (status === 'completed') return 'Complete';
  if (status === 'in_progress') return 'Draft';
  return status;
}

/**
 * Label for one of the four `AssessmentEligibilityStage` values — a superset
 * of `assessmentTypeLabel`'s `entry|annual|exit` that also covers `update`
 * (which has no `AssessmentType`/`dataCollectionStage` counterpart — see the
 * Launch Assessment modal's handling of the "Update" stage).
 */
export function assessmentEligibilityStageLabel(stage: AssessmentEligibilityStage): string {
  if (stage === 'update') return 'Update';
  return assessmentTypeLabel(stage);
}
