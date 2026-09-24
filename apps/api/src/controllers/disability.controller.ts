import { NextFunction, Request, Response } from 'express';
import type { DisabilityInput } from '@housing360/types';
import { addDisabilityToAssessment, removeDisability, replaceDisabilities } from '../services/disability.service';
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

/** `PUT /assessments/:id/disabilities` — replaces the assessment's full
 * disability set in one call (`assessment-and-ce-workspace`). */
export async function replaceAssessmentDisabilitiesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Assessment id is required');
    }
    const input = req.body as Partial<Omit<DisabilityInput, 'assessmentId'>>[] | undefined;
    if (!Array.isArray(input)) {
      throw new AppError(400, 'Request body must be an array of disability records');
    }
    for (const item of input) {
      if (!item.disabilityType || !item.response) {
        throw new AppError(400, 'Every disability record requires disabilityType and response');
      }
    }

    const disabilities = await replaceDisabilities(id, input as Omit<DisabilityInput, 'assessmentId'>[]);
    sendSuccess(res, { code: 200, message: 'Disabilities updated', data: disabilities });
  } catch (err) {
    next(err);
  }
}
