import { Router } from 'express';
import {
  createAssessmentHandler,
  discardAssessmentHandler,
  getAssessmentDetailHandler,
  getEnrollmentAssessmentHandler,
  listAssessmentsHandler,
  listEnrollmentAssessmentsHandler,
  patchAssessmentHandler,
} from '../controllers/assessment.controller';
import { requireAuth } from '../middlewares/auth';

export const assessmentRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// `/assessments` (list, `case-workspace`) is registered before the
// single-stage `?stage=` fetch since both hang off the same `:id` segment.
assessmentRouter.get('/enrollments/:id/assessments/list', requireAuth, listEnrollmentAssessmentsHandler);
assessmentRouter.get('/enrollments/:id/assessments', requireAuth, getEnrollmentAssessmentHandler);
// Global Assessment Command Center list/detail (`assessments-and-coordinated-entry`) —
// genuinely new paths, registered before `/assessments/:id`'s PATCH/DELETE so the
// literal `/assessments` collection route isn't shadowed by the `:id` param routes.
assessmentRouter.get('/assessments', requireAuth, listAssessmentsHandler);
assessmentRouter.get('/assessments/:id', requireAuth, getAssessmentDetailHandler);
assessmentRouter.post('/assessments', requireAuth, createAssessmentHandler);
assessmentRouter.patch('/assessments/:id', requireAuth, patchAssessmentHandler);
assessmentRouter.delete('/assessments/:id', requireAuth, discardAssessmentHandler);
