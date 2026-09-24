import { NextFunction, Request, Response } from 'express';
import type {
  ExternalReferralInput,
  ReferralDeclineInput,
  ReferralInput,
  ReferralUpdateInput,
} from '@housing360/types';
import {
  acceptReferral,
  createExternalReferral,
  createInternalReferral,
  declineReferral,
  listReferralsByCase,
  updateReferral,
} from '../services/referral.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function createExternalReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<ExternalReferralInput> | undefined;
    if (!input?.caseId || !input.providerOrgId) {
      throw new AppError(400, 'caseId and providerOrgId are required');
    }
    const referral = await createExternalReferral(input as ExternalReferralInput);
    sendSuccess(res, { code: 201, message: 'Referral sent', data: referral });
  } catch (err) {
    next(err);
  }
}

export async function listCaseReferralsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.params;
    if (!caseId) throw new AppError(400, 'Case id is required');
    const referrals = await listReferralsByCase(caseId);
    sendSuccess(res, { code: 200, message: 'Referrals retrieved', data: referrals });
  } catch (err) {
    next(err);
  }
}

export async function createReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<ReferralInput> | undefined;
    if (!input?.title || !input.clientId) {
      throw new AppError(400, 'title and clientId are required');
    }
    const referral = await createInternalReferral(input as ReferralInput);
    sendSuccess(res, { code: 201, message: 'Referral created', data: referral });
  } catch (err) {
    next(err);
  }
}

export async function updateReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Referral id is required');
    const input = req.body as ReferralUpdateInput;
    const referral = await updateReferral(id, input);
    sendSuccess(res, { code: 200, message: 'Referral updated', data: referral });
  } catch (err) {
    next(err);
  }
}

export async function acceptReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Referral id is required');
    const referral = await acceptReferral(id);
    sendSuccess(res, { code: 200, message: 'Referral accepted', data: referral });
  } catch (err) {
    next(err);
  }
}

export async function declineReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Referral id is required');
    const input = (req.body as Partial<ReferralDeclineInput> | undefined) ?? {};
    const referral = await declineReferral(id, input as ReferralDeclineInput);
    sendSuccess(res, { code: 200, message: 'Referral declined', data: referral });
  } catch (err) {
    next(err);
  }
}
