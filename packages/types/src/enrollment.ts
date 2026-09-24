export interface ProgramEnrollment {
  id: string;
  clientId: string;
  householdId: string | null;
  programId: string;
  programName: string;
  name: string;
  startDate: string;
  status: string;
  /** HUD 3.15 */
  relationshipToHoh: string | null;
  /** HUD 3.08 */
  disablingCondition: string | null;
  enrollmentCoc: string | null;
  programCaseManagerId: string | null;
  isPrimary: boolean;
  /** Set when an Exit assessment completes (`assessment-and-ce-workspace`) — see `ProgramExit`. */
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramEnrollmentInput {
  clientId: string;
  programId: string;
  name?: string;
  startDate?: string;
  status?: string;
  relationshipToHoh?: string;
  disablingCondition?: string;
  enrollmentCoc?: string;
  programCaseManagerId?: string;
  isPrimary?: boolean;
}

export type ProgramEnrollmentUpdateInput = Partial<Omit<ProgramEnrollmentInput, 'clientId'>>;

/** `GET /api/enrollments/:id/summary` — the small context block the Launch
 * Assessment flow and Assessment form modal render above their fields
 * (`assessment-and-ce-workspace`). */
export interface ProgramEnrollmentSummary {
  id: string;
  clientId: string;
  clientName: string;
  programId: string;
  programName: string;
  status: string;
  startDate: string;
  endDate: string | null;
}
