import { NextFunction, Request, Response } from 'express';
import type {
  CarePlanCreateInput,
  CarePlanUpdateInput,
  GoalAssignmentCreateInput,
  GoalAssignmentUpdateInput,
  TaskCreateInput,
} from '@housing360/types';
import {
  addGoalToCarePlan,
  addTaskToGoal,
  createCarePlan,
  getCarePlanById,
  getCarePlanTemplateById,
  getGoalAssignmentDetail,
  getRecommendedCarePlanTemplates,
  getServiceGaps,
  listCarePlansByCase,
  listCarePlanTemplates,
  listGoalDefinitions,
  updateCarePlan,
  updateGoalAssignment,
} from '../services/carePlan.service';
import { getCaseById } from '../services/case.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function listCaseCarePlansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.params;
    if (!caseId) throw new AppError(400, 'Case id is required');
    const plans = await listCarePlansByCase(caseId);
    sendSuccess(res, { code: 200, message: 'Care plans retrieved', data: plans });
  } catch (err) {
    next(err);
  }
}

export async function getCarePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Care plan id is required');
    const plan = await getCarePlanById(id);
    sendSuccess(res, { code: 200, message: 'Care plan retrieved', data: plan });
  } catch (err) {
    next(err);
  }
}

export async function listCarePlanTemplatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const templates = await listCarePlanTemplates(published, search);
    sendSuccess(res, { code: 200, message: 'Care plan templates retrieved', data: templates });
  } catch (err) {
    next(err);
  }
}

export async function getCarePlanTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Template id is required');
    const template = await getCarePlanTemplateById(id);
    sendSuccess(res, { code: 200, message: 'Care plan template retrieved', data: template });
  } catch (err) {
    next(err);
  }
}

/** Resolves the case's own `programEnrollmentId` and delegates to the same
 * rule-driven service `GET /enrollments/:id/recommended-care-plan-templates`
 * calls directly (`assessment-and-ce-workspace` — see that route's
 * controller in `assessment.controller.ts`). */
export async function getRecommendedCarePlanTemplatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.params;
    if (!caseId) throw new AppError(400, 'Case id is required');
    const caseDetail = await getCaseById(caseId);
    const templates = await getRecommendedCarePlanTemplates(caseDetail.programEnrollmentId);
    sendSuccess(res, { code: 200, message: 'Recommended care plan templates retrieved', data: templates });
  } catch (err) {
    next(err);
  }
}

export async function listGoalDefinitionsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const goals = await listGoalDefinitions();
    sendSuccess(res, { code: 200, message: 'Goal definitions retrieved', data: goals });
  } catch (err) {
    next(err);
  }
}

export async function createCarePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<CarePlanCreateInput> | undefined;
    if (!input?.caseId || !input.clientId || !input.name || !input.goals) {
      throw new AppError(400, 'caseId, clientId, name, and goals are required');
    }
    const plan = await createCarePlan(input as CarePlanCreateInput);
    sendSuccess(res, { code: 201, message: 'Care plan created', data: plan });
  } catch (err) {
    next(err);
  }
}

export async function updateCarePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Care plan id is required');
    const input = req.body as CarePlanUpdateInput;
    const plan = await updateCarePlan(id, input);
    sendSuccess(res, { code: 200, message: 'Care plan updated', data: plan });
  } catch (err) {
    next(err);
  }
}

export async function addGoalToCarePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Care plan id is required');
    const input = req.body as Partial<GoalAssignmentCreateInput> | undefined;
    if (!input?.name || !input.tasks) {
      throw new AppError(400, 'name and tasks are required');
    }
    const goal = await addGoalToCarePlan({ ...(input as GoalAssignmentCreateInput), carePlanId: id });
    sendSuccess(res, { code: 201, message: 'Goal added', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function getGoalAssignmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Goal id is required');
    const goal = await getGoalAssignmentDetail(id);
    sendSuccess(res, { code: 200, message: 'Goal retrieved', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function updateGoalAssignmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Goal id is required');
    const input = req.body as GoalAssignmentUpdateInput;
    const goal = await updateGoalAssignment(id, input);
    sendSuccess(res, { code: 200, message: 'Goal updated', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function addTaskToGoalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Goal id is required');
    const input = req.body as Partial<TaskCreateInput> | undefined;
    if (!input?.subject) {
      throw new AppError(400, 'Please enter a subject for the task.');
    }
    const task = await addTaskToGoal(
      id,
      input as Omit<TaskCreateInput, 'clientId' | 'caseId' | 'goalAssignmentId'>
    );
    sendSuccess(res, { code: 201, message: 'Task added', data: task });
  } catch (err) {
    next(err);
  }
}

export async function getServiceGapsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Case id is required');
    const caseDetail = await getCaseById(id);
    const gaps = await getServiceGaps(id, caseDetail.clientId);
    sendSuccess(res, { code: 200, message: 'Service gaps retrieved', data: gaps });
  } catch (err) {
    next(err);
  }
}
