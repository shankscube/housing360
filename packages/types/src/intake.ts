import type { EntryAssessmentStatus } from './assessments';
import type { Client } from './clients';
import type { Disability } from './disability';

export interface IntakeEnrollmentSummary {
  id: string;
  programId: string;
  programName: string;
  name: string;
  status: string;
  isPrimary: boolean;
  startDate: string;
}

/** Read-only row shape for the Family Members step's already-saved rows — never the full SSN. */
export interface HouseholdMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  ssnLast4: string | null;
  dob: string | null;
  sex: string;
  raceEthnicity: string[];
  relationshipToHoh: string | null;
  mobile: string | null;
  email: string | null;
}

/** `GET /api/clients/:id/intake-snapshot` response — feeds the wizard's pre-fill-on-select flow. */
export interface ClientIntakeSnapshot {
  clientId: string;
  /** The full client record — step 1 pre-fills its form from this when an existing client is selected. */
  client: Client;
  householdId: string | null;
  /** Other household members (excludes the primary client itself, shown separately in step 1). */
  householdMembers: HouseholdMemberSummary[];
  enrollments: IntakeEnrollmentSummary[];
  primaryEnrollmentId: string | null;
  /** Keyed by enrollment id. */
  caseIdByEnrollment: Record<string, string>;
  /** Keyed by enrollment id. */
  entryAssessmentByEnrollment: Record<string, EntryAssessmentStatus>;
  /** Keyed by enrollment id. */
  disabilitiesByEnrollment: Record<string, Disability[]>;
}
