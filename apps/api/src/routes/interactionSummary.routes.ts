import { Router } from 'express';
import { createInteractionSummaryHandler } from '../controllers/interactionSummary.controller';
import { requireAuth } from '../middlewares/auth';

export const interactionSummaryRouter = Router();

// Mounted at `/api` by the orchestrator — path below is relative to that.
interactionSummaryRouter.post('/interaction-summaries', requireAuth, createInteractionSummaryHandler);
