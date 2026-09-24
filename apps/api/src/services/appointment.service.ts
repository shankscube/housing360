import type { AppointmentItem } from '@housing360/types';
import { findFollowUpsInRange } from '../models/case.model';

/**
 * Display label for a case's follow-up milestone. `FOLLOW_UP_DAYS` in
 * `case.service.ts` maps the same codes to their numeric cadence; this is
 * just the Calendar/Home-facing label side, kept local since nothing else
 * needs it.
 */
const MILESTONE_LABELS: Record<string, string> = {
  '30': '30 Day follow-up',
  '60': '60 Day follow-up',
  '90': '90 Day follow-up',
};

function milestoneLabel(milestone: string): string {
  return MILESTONE_LABELS[milestone] ?? milestone;
}

/** Appointments are `Case.followUpMilestone`/`followUpDueDate` — no dedicated appointment table (task-management spec). */
export async function listAppointments(
  from: Date,
  to: Date,
  assignedCaseManagerId?: number,
): Promise<AppointmentItem[]> {
  const rows = await findFollowUpsInRange(from, to, assignedCaseManagerId);
  return rows
    .filter((row) => row.followUpDueDate !== null)
    .map((row) => ({
      caseId: row.id,
      caseNumber: row.caseNumber,
      clientName: `${row.client.firstName} ${row.client.lastName}`,
      milestone: milestoneLabel(row.followUpMilestone),
      dueDate: row.followUpDueDate!.toISOString(),
    }));
}
