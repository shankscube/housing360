import { Router } from 'express';
import {
  createAssessmentHandler,
  discardAssessmentHandler,
  getEnrollmentAssessmentHandler,
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
assessmentRouter.post('/assessments', requireAuth, createAssessmentHandler);
assessmentRouter.patch('/assessments/:id', requireAuth, patchAssessmentHandler);
assessmentRouter.delete('/assessments/:id', requireAuth, discardAssessmentHandler);
