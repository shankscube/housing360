import { Router } from 'express';
import {
  createAssessmentHandler,
  getEnrollmentAssessmentHandler,
  patchAssessmentHandler,
} from '../controllers/assessment.controller';
import { requireAuth } from '../middlewares/auth';

export const assessmentRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
assessmentRouter.get('/enrollments/:id/assessments', requireAuth, getEnrollmentAssessmentHandler);
assessmentRouter.post('/assessments', requireAuth, createAssessmentHandler);
assessmentRouter.patch('/assessments/:id', requireAuth, patchAssessmentHandler);
