import { NextFunction, Request, Response } from 'express';
import type { ProgramEnrollmentInput, ProgramEnrollmentUpdateInput } from '@housing360/types';
import {
  createEnrollment,
  listEnrollmentsForClient,
  updateEnrollment,
} from '../services/enrollment.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function listClientEnrollmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Client id is required');
    }
    const enrollments = await listEnrollmentsForClient(id);
    sendSuccess(res, { code: 200, message: 'Enrollments retrieved', data: enrollments });
  } catch (err) {
    next(err);
  }
}

export async function createEnrollmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<ProgramEnrollmentInput> | undefined;
    if (!input?.clientId || !input.programId) {
      throw new AppError(400, 'clientId and programId are required');
    }
    const enrollment = await createEnrollment(input as ProgramEnrollmentInput);
    sendSuccess(res, { code: 201, message: 'Enrollment created', data: enrollment });
  } catch (err) {
    next(err);
  }
}

export async function updateEnrollmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Enrollment id is required');
    }
    const input = req.body as ProgramEnrollmentUpdateInput;
    const enrollment = await updateEnrollment(id, input);
    sendSuccess(res, { code: 200, message: 'Enrollment updated', data: enrollment });
  } catch (err) {
    next(err);
  }
}
