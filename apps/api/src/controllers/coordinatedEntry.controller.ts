import { NextFunction, Request, Response } from 'express';
import type { CeAssessmentInput, CeReferralInput, PriorityQueueFilter, PriorityQueueQuery } from '@housing360/types';
import {
  createCeReferral,
  getCeAssessmentDetail,
  getClientRecommendation,
  getPriorityQueue,
  getRecommendedProgramsByProjectType,
  listActiveQuestions,
  submitCeAssessment,
} from '../services/coordinatedEntry.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

const VALID_PRIORITY_QUEUE_FILTERS: PriorityQueueFilter[] = [
  'TOP5',
  'VETERAN',
  'YOUTH',
  'SAFETY_ALERT',
  'AWAITING_REFERRAL',
];

export async function listCeQuestionsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const questions = await listActiveQuestions();
    sendSuccess(res, { code: 200, message: 'Coordinated Entry questions retrieved', data: questions });
  } catch (err) {
    next(err);
  }
}

export async function submitCeAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const input = req.body as Partial<CeAssessmentInput> | undefined;
    if (!input?.clientId) {
      throw new AppError(400, 'clientId is required');
    }
    if (!input.responses || input.responses.length === 0) {
      throw new AppError(400, 'responses is required');
    }
    const result = await submitCeAssessment(input as CeAssessmentInput, req.user.id);
    sendSuccess(res, { code: 201, message: 'Coordinated Entry assessment recorded', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCeAssessmentDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const detail = await getCeAssessmentDetail(id);
    sendSuccess(res, { code: 200, message: 'Coordinated Entry assessment retrieved', data: detail });
  } catch (err) {
    next(err);
  }
}

export async function getPriorityQueueHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawFilter = typeof req.query.filter === 'string' ? req.query.filter.toUpperCase() : undefined;
    const filter =
      rawFilter && (VALID_PRIORITY_QUEUE_FILTERS as string[]).includes(rawFilter)
        ? (rawFilter as PriorityQueueFilter)
        : undefined;
    const query: PriorityQueueQuery = {
      filter,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };
    const result = await getPriorityQueue(query);
    sendSuccess(res, { code: 200, message: 'Priority queue retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getClientRecommendationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'id is required');
    const recommendation = await getClientRecommendation(id);
    sendSuccess(res, { code: 200, message: 'Client recommendation retrieved', data: recommendation });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendedProgramsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const projectType = typeof req.query.projectType === 'string' ? req.query.projectType : undefined;
    if (!projectType) {
      throw new AppError(400, 'projectType is required');
    }
    const programs = await getRecommendedProgramsByProjectType(projectType);
    sendSuccess(res, { code: 200, message: 'Recommended programs retrieved', data: programs });
  } catch (err) {
    next(err);
  }
}

export async function createCeReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const input = req.body as Partial<CeReferralInput> | undefined;
    if (!input?.ceAssessmentId) {
      throw new AppError(400, 'ceAssessmentId is required');
    }
    const referral = await createCeReferral(input as CeReferralInput, req.user.id);
    sendSuccess(res, { code: 201, message: 'Referral sent', data: referral });
  } catch (err) {
    next(err);
  }
}
