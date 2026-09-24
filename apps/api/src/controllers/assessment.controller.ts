import { NextFunction, Request, Response } from 'express';
import type { AssessmentInput, AssessmentUpdateInput } from '@housing360/types';
import {
  createOrUpsertAssessment,
  discardAssessment,
  getAssessmentForEnrollment,
  listAssessmentsByEnrollment,
  patchAssessment,
} from '../services/assessment.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function getEnrollmentAssessmentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    const stage = typeof req.query.stage === 'string' ? req.query.stage : undefined;
    const assessment = await getAssessmentForEnrollment(id, stage);
    // "No assessment yet" is a normal state, not a failure — sendSuccess with
    // `data: null`, never a 404.
    sendSuccess(res, {
      code: 200,
      message: assessment ? 'Assessment retrieved' : 'No assessment recorded yet',
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
}

export async function listEnrollmentAssessmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    const assessments = await listAssessmentsByEnrollment(id);
    sendSuccess(res, { code: 200, message: 'Assessments retrieved', data: assessments });
  } catch (err) {
    next(err);
  }
}

export async function discardAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Assessment id is required');
    }
    await discardAssessment(id);
    sendSuccess(res, { code: 200, message: 'Assessment discarded', data: null });
  } catch (err) {
    next(err);
  }
}

export async function createAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<AssessmentInput & { status?: string }> | undefined;
    if (!input?.clientId || !input.programEnrollmentId || !input.caseId) {
      throw new AppError(400, 'clientId, programEnrollmentId, and caseId are required');
    }

    const assessment = await createOrUpsertAssessment(
      input as AssessmentInput & { status?: string }
    );
    sendSuccess(res, { code: 201, message: 'Assessment saved', data: assessment });
  } catch (err) {
    next(err);
  }
}

export async function patchAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Assessment id is required');
    }
    const input = req.body as AssessmentUpdateInput;
    const assessment = await patchAssessment(id, input);
    sendSuccess(res, { code: 200, message: 'Assessment updated', data: assessment });
  } catch (err) {
    next(err);
  }
}
