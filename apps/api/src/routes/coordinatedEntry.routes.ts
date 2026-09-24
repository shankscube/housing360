import { Router } from 'express';
import {
  createCeReferralHandler,
  getCeAssessmentDetailHandler,
  getClientRecommendationHandler,
  getPriorityQueueHandler,
  getRecommendedProgramsHandler,
  listCeQuestionsHandler,
  submitCeAssessmentHandler,
} from '../controllers/coordinatedEntry.controller';
import { requireAuth } from '../middlewares/auth';

export const coordinatedEntryRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// assessment-and-ce-workspace: replaces the old `/coordinated-entry/*` paths
// with `/ce/*`, matching this change's API shape.
coordinatedEntryRouter.get('/ce/questions', requireAuth, listCeQuestionsHandler);
coordinatedEntryRouter.post('/ce/assessments', requireAuth, submitCeAssessmentHandler);
coordinatedEntryRouter.get('/ce/assessments/:id', requireAuth, getCeAssessmentDetailHandler);
coordinatedEntryRouter.get('/ce/priority-queue', requireAuth, getPriorityQueueHandler);
coordinatedEntryRouter.get('/ce/clients/:id/recommendation', requireAuth, getClientRecommendationHandler);
coordinatedEntryRouter.get('/ce/recommended-programs', requireAuth, getRecommendedProgramsHandler);
coordinatedEntryRouter.post('/ce/referrals', requireAuth, createCeReferralHandler);
