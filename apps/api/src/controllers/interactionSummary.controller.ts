import { NextFunction, Request, Response } from 'express';
import type { InteractionSummaryCreateInput, InteractionSummaryUpdateInput } from '@housing360/types';
import {
  createInteractionSummary,
  getInteractionSummaryDetail,
  listInteractionSummariesByCase,
  updateInteractionSummary,
} from '../services/interactionSummary.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function listCaseInteractionSummariesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      throw new AppError(400, 'Case id is required');
    }
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const summaries = await listInteractionSummariesByCase(caseId, search);
    sendSuccess(res, { code: 200, message: 'Interaction summaries retrieved', data: summaries });
  } catch (err) {
    next(err);
  }
}

export async function createInteractionSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<InteractionSummaryCreateInput> | undefined;
    if (!input?.clientId || !input.caseId || !input.title || !input.status) {
      throw new AppError(400, 'clientId, caseId, title, and status are required');
    }

    const summary = await createInteractionSummary(input as InteractionSummaryCreateInput);
    sendSuccess(res, { code: 201, message: 'Interaction summary created', data: summary });
  } catch (err) {
    next(err);
  }
}

export async function updateInteractionSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Interaction summary id is required');
    }
    const input = req.body as InteractionSummaryUpdateInput;
    const summary = await updateInteractionSummary(id, input);
    sendSuccess(res, { code: 200, message: 'Interaction summary updated', data: summary });
  } catch (err) {
    next(err);
  }
}

export async function getInteractionSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Interaction summary id is required');
    }
    const summary = await getInteractionSummaryDetail(id);
    sendSuccess(res, { code: 200, message: 'Interaction summary retrieved', data: summary });
  } catch (err) {
    next(err);
  }
}
