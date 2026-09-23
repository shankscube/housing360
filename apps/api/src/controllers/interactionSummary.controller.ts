import { NextFunction, Request, Response } from 'express';
import type { InteractionSummaryInput } from '@housing360/types';
import { createInteractionSummary } from '../services/interactionSummary.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function createInteractionSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body as Partial<InteractionSummaryInput> | undefined;
    if (!input?.clientId || !input.caseId || !input.title || !input.status) {
      throw new AppError(400, 'clientId, caseId, title, and status are required');
    }

    const summary = await createInteractionSummary(input as InteractionSummaryInput);
    sendSuccess(res, { code: 201, message: 'Interaction summary created', data: summary });
  } catch (err) {
    next(err);
  }
}
