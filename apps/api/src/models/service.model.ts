import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

export type BenefitRow = Prisma.BenefitGetPayload<Record<string, never>>;

export function countBenefitAssignmentsByClient(clientId: string): Promise<number> {
  return prisma.benefitAssignment.count({ where: { programEnrollment: { clientId } } });
}

export function findBenefitsByProgram(programId: string): Promise<BenefitRow[]> {
  return prisma.benefit.findMany({ where: { programId }, orderBy: { name: 'asc' } });
}

export function findBenefitById(id: string): Promise<BenefitRow | null> {
  return prisma.benefit.findUnique({ where: { id } });
}

const ASSIGNMENT_INCLUDE = {
  benefit: true,
  disbursements: true,
} satisfies Prisma.BenefitAssignmentInclude;

export type BenefitAssignmentRow = Prisma.BenefitAssignmentGetPayload<{ include: typeof ASSIGNMENT_INCLUDE }>;

export function findBenefitAssignmentsByEnrollment(
  programEnrollmentId: string
): Promise<BenefitAssignmentRow[]> {
  return prisma.benefitAssignment.findMany({
    where: { programEnrollmentId },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export function findBenefitAssignmentById(id: string): Promise<BenefitAssignmentRow | null> {
  return prisma.benefitAssignment.findUnique({ where: { id }, include: ASSIGNMENT_INCLUDE });
}

export function createBenefitAssignment(
  programEnrollmentId: string,
  benefitId: string
): Promise<BenefitAssignmentRow> {
  return prisma.benefitAssignment.create({
    data: { programEnrollmentId, benefitId },
    include: ASSIGNMENT_INCLUDE,
  });
}

export type ServiceDisbursementRow = Prisma.ServiceDisbursementGetPayload<Record<string, never>>;

export function createServiceDisbursement(
  data: Prisma.ServiceDisbursementUncheckedCreateInput
): Promise<ServiceDisbursementRow> {
  return prisma.serviceDisbursement.create({ data });
}

export function findServiceDisbursementById(id: string): Promise<ServiceDisbursementRow | null> {
  return prisma.serviceDisbursement.findUnique({ where: { id } });
}

export function updateServiceDisbursement(
  id: string,
  data: Prisma.ServiceDisbursementUncheckedUpdateInput
): Promise<ServiceDisbursementRow> {
  return prisma.serviceDisbursement.update({ where: { id }, data });
}
