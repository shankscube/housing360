export interface Referral {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  caseId: string | null;
  programId: string | null;
  programName: string | null;
  providerOrgId: string | null;
  providerOrgName: string | null;
  referrerOrgId: string | null;
  referrerOrgName: string | null;
  referralDate: string;
  type: string | null;
  status: string;
  priority: string | null;
  category: string | null;
  outcome: string | null;
  description: string | null;
  comments: string | null;
  clientContact: string | null;
  providerContact: string | null;
  referrerContact: string | null;
  caseManagerComments: string | null;
  declineReason: string | null;
  declineNotes: string | null;
  isExternal: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The shared New/Edit Referral modal's payload. */
export interface ReferralInput {
  title: string;
  clientId: string;
  caseId?: string;
  programId?: string;
  providerOrgId?: string;
  referrerOrgId?: string;
  referralDate?: string;
  type?: string;
  status?: string;
  priority?: string;
  category?: string;
  description?: string;
  comments?: string;
  caseManagerComments?: string;
}

export type ReferralUpdateInput = Partial<ReferralInput>;

export interface ReferralDeclineInput {
  reason: string;
  notes?: string;
}

/** The Plan tab's Refer to Partner Agency flow — server derives contact detail from ROI consent, never trusts a client-sent flag (design.md Decision 7). */
export interface ExternalReferralInput {
  caseId: string;
  goalAssignmentId?: string;
  providerOrgId: string;
  notes?: string;
}
