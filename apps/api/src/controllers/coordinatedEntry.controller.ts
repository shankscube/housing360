import { NextFunction, Request, Response } from 'express';
import type { CoordinatedEntryReferralInput, PrioritizationListQuery, VulnerabilityAssessmentInput } from '@housing360/types';
import {
  createCoordinatedEntryReferral,
  getPrioritizationList,
  getRecommendedPrograms,
  listPartnerAgenciesForCoordinatedEntry,
  submitVulnerabilityAssessment,
} from '../services/coordinatedEntry.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

function parseBooleanQuery(value: unknown): boolean {
  return value === 'true' || value === '1';
}

export async function submitVulnerabilityAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const input = req.body as Partial<VulnerabilityAssessmentInput> | undefined;
    if (!input?.clientId) {
      throw new AppError(400, 'clientId is required');
    }
    const result = await submitVulnerabilityAssessment(input as VulnerabilityAssessmentInput, req.user.id);
    sendSuccess(res, { code: 201, message: 'Vulnerability assessment recorded', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendedProgramsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
    if (!clientId) {
      throw new AppError(400, 'clientId is required');
    }
    const programs = await getRecommendedPrograms(clientId);
    sendSuccess(res, { code: 200, message: 'Recommended programs retrieved', data: programs });
  } catch (err) {
    next(err);
  }
}

export async function listPartnerAgenciesForCoordinatedEntryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
    const agencies = await listPartnerAgenciesForCoordinatedEntry(domain);
    sendSuccess(res, { code: 200, message: 'Partner agencies retrieved', data: agencies });
  } catch (err) {
    next(err);
  }
}

export async function createCoordinatedEntryReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<CoordinatedEntryReferralInput> | undefined;
    if (!input?.clientId || !input.vulnerabilityAssessmentId || !input.programId || !input.providerOrgId) {
      throw new AppError(
        400,
        'clientId, vulnerabilityAssessmentId, programId, and providerOrgId are required'
      );
    }
    const referral = await createCoordinatedEntryReferral(input as CoordinatedEntryReferralInput);
    sendSuccess(res, { code: 201, message: 'Referral sent', data: referral });
  } catch (err) {
    next(err);
  }
}

export async function getPrioritizationListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query: PrioritizationListQuery = {
      topFive: parseBooleanQuery(req.query.topFive),
      veteran: parseBooleanQuery(req.query.veteran),
      unaccompaniedYouth: parseBooleanQuery(req.query.unaccompaniedYouth),
      safetyAlert: parseBooleanQuery(req.query.safetyAlert),
      awaitingReferral: parseBooleanQuery(req.query.awaitingReferral),
    };
    const items = await getPrioritizationList(query);
    sendSuccess(res, { code: 200, message: 'Prioritization list retrieved', data: items });
  } catch (err) {
    next(err);
  }
}
