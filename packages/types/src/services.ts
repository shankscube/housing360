export interface Benefit {
  id: string;
  programId: string;
  name: string;
  serviceDomain: string | null;
}

export interface BenefitAssignment {
  id: string;
  programEnrollmentId: string;
  benefitId: string;
  benefitName: string;
  serviceDomain: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDisbursement {
  id: string;
  benefitAssignmentId: string;
  recipientClientId: string;
  disbursementType: string;
  status: string;
  disbursementDate: string;
  description: string | null;
  triggerReason: string | null;
  voucherNumber: string | null;
  voucherAmount: number | null;
  bedIdentifier: string | null;
  shift: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The Services tab's enrollment → services → disbursements nesting. */
export interface BenefitAssignmentDetail extends BenefitAssignment {
  disbursements: ServiceDisbursement[];
}

export interface AssignServiceInput {
  benefitId: string;
}

export interface ServiceDisbursementInput {
  disbursementType: string;
  status?: string;
  disbursementDate?: string;
  recipientClientId: string;
  description?: string;
  triggerReason?: string;
  voucherNumber?: string;
  voucherAmount?: number;
  bedIdentifier?: string;
  shift?: string;
}

export type ServiceDisbursementUpdateInput = Partial<Omit<ServiceDisbursementInput, 'recipientClientId'>>;
