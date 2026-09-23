import { NextFunction, Request, Response } from 'express';
import type { EnsureCaseInput } from '@housing360/types';
import { ensureCase } from '../services/case.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function ensureCaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<EnsureCaseInput> | undefined;
    if (!input?.clientId || !input.enrollmentId) {
      throw new AppError(400, 'clientId and enrollmentId are required');
    }
    const caseRecord = await ensureCase(input as EnsureCaseInput);
    sendSuccess(res, { code: 200, message: 'Case ensured', data: caseRecord });
  } catch (err) {
    next(err);
  }
}
