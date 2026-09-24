import { Router } from 'express';
import {
  createAssessmentHandler,
  discardAssessmentHandler,
  exitEnrollmentHandler,
  getAssessmentDetailHandler,
  getAssessmentEligibilityHandler,
  getEnrollmentAssessmentHandler,
  getLatestAssessmentValuesHandler,
  getRecommendedCarePlanTemplatesForEnrollmentHandler,
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
// `assessment-and-ce-workspace` — enrollment-scoped helpers for the Launch
// Assessment flow / Assessment form modal, registered alongside the other
// `/enrollments/:id/...` routes above; none of these collide with the plain
// `/enrollments/:id/assessments` stage lookup below since Express matches by
// full literal path, not prefix.
assessmentRouter.get('/enrollments/:id/assessment-eligibility', requireAuth, getAssessmentEligibilityHandler);
assessmentRouter.get('/enrollments/:id/latest-assessment-values', requireAuth, getLatestAssessmentValuesHandler);
assessmentRouter.get(
  '/enrollments/:id/recommended-care-plan-templates',
  requireAuth,
  getRecommendedCarePlanTemplatesForEnrollmentHandler
);
assessmentRouter.post('/enrollments/:id/exit', requireAuth, exitEnrollmentHandler);
assessmentRouter.get('/enrollments/:id/assessments', requireAuth, getEnrollmentAssessmentHandler);
// Global Assessment Command Center list/detail (`assessments-and-coordinated-entry`) —
// genuinely new paths, registered before `/assessments/:id`'s PATCH/DELETE so the
// literal `/assessments` collection route isn't shadowed by the `:id` param routes.
assessmentRouter.get('/assessments', requireAuth, listAssessmentsHandler);
assessmentRouter.get('/assessments/:id', requireAuth, getAssessmentDetailHandler);
assessmentRouter.post('/assessments', requireAuth, createAssessmentHandler);
assessmentRouter.patch('/assessments/:id', requireAuth, patchAssessmentHandler);
assessmentRouter.delete('/assessments/:id', requireAuth, discardAssessmentHandler);
