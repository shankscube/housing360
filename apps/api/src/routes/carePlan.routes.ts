import { Router } from 'express';
import {
  addGoalToCarePlanHandler,
  addTaskToGoalHandler,
  createCarePlanHandler,
  getCarePlanHandler,
  getCarePlanTemplateHandler,
  getGoalAssignmentHandler,
  getRecommendedCarePlanTemplatesHandler,
  getServiceGapsHandler,
  listCaseCarePlansHandler,
  listCarePlanTemplatesHandler,
  listGoalDefinitionsHandler,
  updateCarePlanHandler,
  updateGoalAssignmentHandler,
} from '../controllers/carePlan.controller';
import { requireAuth } from '../middlewares/auth';

export const carePlanRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// Static/query-suffixed paths registered before the `:id` catch-alls they'd
// otherwise collide with, same precaution as `case.routes.ts`.
carePlanRouter.get('/care-plan-templates', requireAuth, listCarePlanTemplatesHandler);
carePlanRouter.get('/goal-definitions', requireAuth, listGoalDefinitionsHandler);
carePlanRouter.get(
  '/cases/:caseId/recommended-care-plan-templates',
  requireAuth,
  getRecommendedCarePlanTemplatesHandler
);
carePlanRouter.get('/cases/:id/service-gaps', requireAuth, getServiceGapsHandler);
carePlanRouter.get('/cases/:caseId/care-plans', requireAuth, listCaseCarePlansHandler);
carePlanRouter.post('/care-plans', requireAuth, createCarePlanHandler);
carePlanRouter.get('/care-plans/:id', requireAuth, getCarePlanHandler);
carePlanRouter.patch('/care-plans/:id', requireAuth, updateCarePlanHandler);
carePlanRouter.post('/care-plans/:id/goals', requireAuth, addGoalToCarePlanHandler);
carePlanRouter.get('/care-plan-templates/:id', requireAuth, getCarePlanTemplateHandler);
carePlanRouter.get('/goal-assignments/:id', requireAuth, getGoalAssignmentHandler);
carePlanRouter.patch('/goal-assignments/:id', requireAuth, updateGoalAssignmentHandler);
carePlanRouter.post('/goal-assignments/:id/tasks', requireAuth, addTaskToGoalHandler);
