import type { BenefitAssignmentDetail, ServiceDisbursement } from '@housing360/types';
import type { BenefitAssignmentRow, ServiceDisbursementRow } from './service.model';

export function toServiceDisbursement(row: ServiceDisbursementRow): ServiceDisbursement {
  return {
    id: row.id,
    benefitAssignmentId: row.benefitAssignmentId,
    recipientClientId: row.recipientClientId,
    disbursementType: row.disbursementType,
    status: row.status,
    disbursementDate: row.disbursementDate.toISOString(),
    description: row.description,
    triggerReason: row.triggerReason,
    voucherNumber: row.voucherNumber,
    voucherAmount: row.voucherAmount ? Number(row.voucherAmount) : null,
    bedIdentifier: row.bedIdentifier,
    shift: row.shift,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBenefitAssignmentDetail(row: BenefitAssignmentRow): BenefitAssignmentDetail {
  return {
    id: row.id,
    programEnrollmentId: row.programEnrollmentId,
    benefitId: row.benefitId,
    benefitName: row.benefit.name,
    serviceDomain: row.benefit.serviceDomain,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    disbursements: row.disbursements.map(toServiceDisbursement),
  };
}
