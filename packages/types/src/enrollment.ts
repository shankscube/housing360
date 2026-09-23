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
