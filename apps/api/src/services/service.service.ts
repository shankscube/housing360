import type {
  Benefit,
  BenefitAssignmentDetail,
  ServiceDisbursement,
  ServiceDisbursementInput,
  ServiceDisbursementUpdateInput,
} from '@housing360/types';
import {
  createBenefitAssignment,
  createServiceDisbursement,
  findBenefitAssignmentById,
  findBenefitAssignmentsByEnrollment,
  findBenefitById,
  findBenefitsByProgram,
  findServiceDisbursementById,
  updateServiceDisbursement as updateServiceDisbursementRow,
} from '../models/service.model';
import { toBenefitAssignmentDetail, toServiceDisbursement } from '../models/service.mapper';
import { findEnrollmentById } from '../models/enrollment.model';
import { AppError } from '../utils/AppError';

export async function listServicesByEnrollment(enrollmentId: string): Promise<BenefitAssignmentDetail[]> {
  const rows = await findBenefitAssignmentsByEnrollment(enrollmentId);
  return rows.map(toBenefitAssignmentDetail);
}

/** "No benefits are configured for this program yet." when this comes back empty (see `case-services` spec). */
export async function listAssignableBenefits(enrollmentId: string): Promise<Benefit[]> {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment) {
    throw new AppError(404, 'Enrollment not found');
  }
  const rows = await findBenefitsByProgram(enrollment.programId);
  return rows.map((row) => ({ id: row.id, programId: row.programId, name: row.name, serviceDomain: row.serviceDomain }));
}

export async function assignService(enrollmentId: string, benefitId: string): Promise<BenefitAssignmentDetail> {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment) {
    throw new AppError(404, 'Enrollment not found');
  }
  const benefit = await findBenefitById(benefitId);
  if (!benefit || benefit.programId !== enrollment.programId) {
    throw new AppError(400, 'This benefit is not configured for the enrollment’s program');
  }
  const row = await createBenefitAssignment(enrollmentId, benefitId);
  return toBenefitAssignmentDetail(row);
}

export async function listDisbursements(benefitAssignmentId: string): Promise<ServiceDisbursement[]> {
  const assignment = await findBenefitAssignmentById(benefitAssignmentId);
  if (!assignment) {
    throw new AppError(404, 'Service assignment not found');
  }
  return assignment.disbursements.map(toServiceDisbursement);
}

export async function createDisbursement(
  benefitAssignmentId: string,
  input: ServiceDisbursementInput
): Promise<ServiceDisbursement> {
  const assignment = await findBenefitAssignmentById(benefitAssignmentId);
  if (!assignment) {
    throw new AppError(404, 'Service assignment not found');
  }
  const row = await createServiceDisbursement({
    benefitAssignmentId,
    recipientClientId: input.recipientClientId,
    disbursementType: input.disbursementType,
    status: input.status ?? 'pending',
    disbursementDate: input.disbursementDate ? new Date(input.disbursementDate) : new Date(),
    description: input.description ?? null,
    triggerReason: input.triggerReason ?? null,
    voucherNumber: input.voucherNumber ?? null,
    voucherAmount: input.voucherAmount ?? null,
    bedIdentifier: input.bedIdentifier ?? null,
    shift: input.shift ?? null,
  });
  return toServiceDisbursement(row);
}

export async function updateDisbursement(
  id: string,
  input: ServiceDisbursementUpdateInput
): Promise<ServiceDisbursement> {
  const existing = await findServiceDisbursementById(id);
  if (!existing) {
    throw new AppError(404, 'Disbursement not found');
  }
  const row = await updateServiceDisbursementRow(id, {
    disbursementType: input.disbursementType,
    status: input.status,
    disbursementDate: input.disbursementDate ? new Date(input.disbursementDate) : undefined,
    description: input.description,
    triggerReason: input.triggerReason,
    voucherNumber: input.voucherNumber,
    voucherAmount: input.voucherAmount,
    bedIdentifier: input.bedIdentifier,
    shift: input.shift,
  });
  return toServiceDisbursement(row);
}
