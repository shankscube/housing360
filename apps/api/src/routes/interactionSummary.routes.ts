import { Router } from 'express';
import {
  createInteractionSummaryHandler,
  getInteractionSummaryHandler,
  listCaseInteractionSummariesHandler,
  updateInteractionSummaryHandler,
} from '../controllers/interactionSummary.controller';
import { requireAuth } from '../middlewares/auth';

export const interactionSummaryRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
interactionSummaryRouter.get(
  '/cases/:caseId/interaction-summaries',
  requireAuth,
  listCaseInteractionSummariesHandler
);
interactionSummaryRouter.post('/interaction-summaries', requireAuth, createInteractionSummaryHandler);
interactionSummaryRouter.get('/interaction-summaries/:id', requireAuth, getInteractionSummaryHandler);
interactionSummaryRouter.patch('/interaction-summaries/:id', requireAuth, updateInteractionSummaryHandler);
