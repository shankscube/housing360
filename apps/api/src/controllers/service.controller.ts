import { NextFunction, Request, Response } from 'express';
import type { ServiceDisbursementInput, ServiceDisbursementUpdateInput } from '@housing360/types';
import {
  assignService,
  createDisbursement,
  listAssignableBenefits,
  listDisbursements,
  listServicesByEnrollment,
  updateDisbursement,
} from '../services/service.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function listEnrollmentServicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Enrollment id is required');
    const services = await listServicesByEnrollment(id);
    sendSuccess(res, { code: 200, message: 'Services retrieved', data: services });
  } catch (err) {
    next(err);
  }
}

export async function listAssignableBenefitsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Enrollment id is required');
    const benefits = await listAssignableBenefits(id);
    sendSuccess(res, { code: 200, message: 'Assignable benefits retrieved', data: benefits });
  } catch (err) {
    next(err);
  }
}

export async function assignServiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Enrollment id is required');
    const { benefitId } = req.body as { benefitId?: string };
    if (!benefitId) throw new AppError(400, 'benefitId is required');
    const assignment = await assignService(id, benefitId);
    sendSuccess(res, { code: 201, message: 'Service assigned', data: assignment });
  } catch (err) {
    next(err);
  }
}

export async function listDisbursementsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Benefit assignment id is required');
    const disbursements = await listDisbursements(id);
    sendSuccess(res, { code: 200, message: 'Disbursements retrieved', data: disbursements });
  } catch (err) {
    next(err);
  }
}

export async function createDisbursementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Benefit assignment id is required');
    const input = req.body as Partial<ServiceDisbursementInput> | undefined;
    if (!input?.disbursementType || !input.recipientClientId) {
      throw new AppError(400, 'disbursementType and recipientClientId are required');
    }
    const disbursement = await createDisbursement(id, input as ServiceDisbursementInput);
    sendSuccess(res, { code: 201, message: 'Disbursement created', data: disbursement });
  } catch (err) {
    next(err);
  }
}

export async function updateDisbursementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Disbursement id is required');
    const input = req.body as ServiceDisbursementUpdateInput;
    const disbursement = await updateDisbursement(id, input);
    sendSuccess(res, { code: 200, message: 'Disbursement updated', data: disbursement });
  } catch (err) {
    next(err);
  }
}
