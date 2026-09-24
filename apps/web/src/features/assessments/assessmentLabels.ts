import type { AssessmentListItem } from '@housing360/types';

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
