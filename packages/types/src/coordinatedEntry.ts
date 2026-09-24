export type PriorityTier = 'high' | 'medium' | 'low';

/** Step 1's placeholder VI-SPDAT-style intake input — see this change's design.md
 * Decision 3/Non-Goals. `answers` on the persisted record is a `Json` bag of
 * exactly this shape so the real instrument can replace it without a migration. */
export interface VulnerabilityAssessmentInput {
  clientId: string;
  chronicHomelessness?: boolean;
  monthsHomelessPast3Years?: number | null;
  disablingCondition?: boolean;
  domesticViolenceSurvivor?: boolean;
  veteranStatus?: boolean;
  unaccompaniedYouth?: boolean;
  safetyAlert?: boolean;
}

export interface VulnerabilityAssessment {
  id: string;
  clientId: string;
  clientName: string;
  answers: VulnerabilityAssessmentInput;
  score: number;
  priorityTier: PriorityTier;
  safetyAlert: boolean;
  assessedById: number;
  referralId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Step 4's "Send Referral" payload — creates a row in the shared `Referral`
 * table (design.md Decision 4), not a second referral concept. */
export interface CoordinatedEntryReferralInput {
  clientId: string;
  vulnerabilityAssessmentId: string;
  programId: string;
  providerOrgId: string;
}

/** Prioritization List row — one per client with a vulnerability assessment. */
export interface PrioritizationListItem {
  vulnerabilityAssessmentId: string;
  clientId: string;
  clientName: string;
  score: number;
  priorityTier: PriorityTier;
  safetyAlert: boolean;
  isVeteran: boolean;
  isUnaccompaniedYouth: boolean;
  isAwaitingReferral: boolean;
  assessedAt: string;
}

/** Every quick filter is an independent boolean toggle, composed as an AND —
 * see this change's design.md Decision 5 and the `coordinated-entry` spec's
 * "Prioritization List Quick Filters Compose" requirement. */
export interface PrioritizationListQuery {
  topFive?: boolean;
  veteran?: boolean;
  unaccompaniedYouth?: boolean;
  safetyAlert?: boolean;
  awaitingReferral?: boolean;
}
