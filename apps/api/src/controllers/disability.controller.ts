import { NextFunction, Request, Response } from 'express';
import type { DisabilityInput } from '@housing360/types';
import { addDisabilityToAssessment, removeDisability } from '../services/disability.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function createDisabilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Assessment id is required');
    }
    const input = req.body as Partial<Omit<DisabilityInput, 'assessmentId'>> | undefined;
    if (!input?.disabilityType || !input.response) {
      throw new AppError(400, 'disabilityType and response are required');
    }

    const disability = await addDisabilityToAssessment(
      id,
      input as Omit<DisabilityInput, 'assessmentId'>
    );
    sendSuccess(res, { code: 201, message: 'Disability created', data: disability });
  } catch (err) {
    next(err);
  }
}

export async function deleteDisabilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Disability id is required');
    }
    await removeDisability(id);
    sendSuccess(res, { code: 200, message: 'Disability deleted', data: { id } });
  } catch (err) {
    next(err);
  }
}
