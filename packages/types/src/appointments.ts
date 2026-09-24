/**
 * Appointments are a read over `Case.followUpMilestone`/`followUpDueDate` —
 * there is no dedicated appointment table (`home-workspace` spec,
 * "Appointments are follow-up milestones, not a new data model").
 */
export interface AppointmentItem {
  caseId: string;
  caseNumber: string;
  clientName: string;
  milestone: string;
  dueDate: string;
}
