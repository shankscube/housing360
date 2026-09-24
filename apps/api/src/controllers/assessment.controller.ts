import { NextFunction, Request, Response } from 'express';
import type {
  AssessmentFilter,
  AssessmentInput,
  AssessmentListQuery,
  AssessmentTypeFilter,
  AssessmentUpdateInput,
} from '@housing360/types';
import {
  createOrUpsertAssessment,
  discardAssessment,
  exitEnrollment,
  getAssessmentDetail,
  getAssessmentForEnrollment,
  getLatestAssessmentValuesForEnrollment,
  listAssessments,
  listAssessmentsByEnrollment,
  patchAssessment,
} from '../services/assessment.service';
import { getAssessmentEligibility } from '../services/assessmentEligibility.service';
import { getRecommendedCarePlanTemplates } from '../services/carePlan.service';
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
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const assessment = await createOrUpsertAssessment(
      input as AssessmentInput & { status?: string },
      req.user.id
    );
    sendSuccess(res, { code: 201, message: 'Assessment saved', data: assessment });
  } catch (err) {
    next(err);
  }
}

/** `GET /api/assessments` — the Assessment Command Center's global, paginated list. */
export async function listAssessmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query: AssessmentListQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      filter: (req.query.filter as AssessmentFilter | undefined) ?? undefined,
      typeFilter: (req.query.typeFilter as AssessmentTypeFilter | undefined) ?? undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    };
    const result = await listAssessments(query);
    sendSuccess(res, { code: 200, message: 'Assessments retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

/** `GET /api/assessments/:id` — includes score/scoreLabel for the detail view. */
export async function getAssessmentDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Assessment id is required');
    }
    const assessment = await getAssessmentDetail(id, req.user?.id);
    sendSuccess(res, { code: 200, message: 'Assessment retrieved', data: assessment });
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
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const input = req.body as AssessmentUpdateInput;
    const assessment = await patchAssessment(id, input, req.user.id);
    sendSuccess(res, { code: 200, message: 'Assessment updated', data: assessment });
  } catch (err) {
    next(err);
  }
}

/** `GET /api/enrollments/:id/assessment-eligibility` — wraps `AssessmentEligibilityService`. */
export async function getAssessmentEligibilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    const eligibility = await getAssessmentEligibility(id);
    sendSuccess(res, { code: 200, message: 'Assessment eligibility retrieved', data: eligibility });
  } catch (err) {
    next(err);
  }
}

/** `GET /api/enrollments/:id/latest-assessment-values` — "Carry forward previous answers." */
export async function getLatestAssessmentValuesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    const values = await getLatestAssessmentValuesForEnrollment(id);
    sendSuccess(res, {
      code: 200,
      message: values ? 'Latest assessment values retrieved' : 'No prior assessment on this enrollment',
      data: values,
    });
  } catch (err) {
    next(err);
  }
}

/** `POST /api/enrollments/:id/exit` — see `assessment.service.ts`'s `exitEnrollment` doc comment. */
export async function exitEnrollmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    interface ExitEnrollmentBody {
      assessmentId?: string;
      destinationType?: string;
      destination?: string;
      caseManagerExitReason?: string;
      exitDate?: string;
    }
    const input = req.body as ExitEnrollmentBody | undefined;
    if (!input?.assessmentId) {
      throw new AppError(400, 'assessmentId is required');
    }
    await exitEnrollment(id, { ...input, assessmentId: input.assessmentId });
    sendSuccess(res, { code: 200, message: 'Program enrollment exited', data: null });
  } catch (err) {
    next(err);
  }
}

/** `GET /api/enrollments/:id/recommended-care-plan-templates` — wraps
 * `carePlan.service.ts`'s rule-driven `getRecommendedCarePlanTemplates`
 * directly against an enrollment id (the existing `GET
 * /cases/:caseId/recommended-care-plan-templates` route resolves the case's
 * own `programEnrollmentId` and calls the same service function). */
export async function getRecommendedCarePlanTemplatesForEnrollmentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Program enrollment id is required');
    }
    const templates = await getRecommendedCarePlanTemplates(id);
    sendSuccess(res, { code: 200, message: 'Recommended care plan templates retrieved', data: templates });
  } catch (err) {
    next(err);
  }
}
