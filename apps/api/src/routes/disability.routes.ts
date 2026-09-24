import { Router } from 'express';
import {
  createDisabilityHandler,
  deleteDisabilityHandler,
  replaceAssessmentDisabilitiesHandler,
} from '../controllers/disability.controller';
import { requireAuth } from '../middlewares/auth';

export const disabilityRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
disabilityRouter.post('/assessments/:id/disabilities', requireAuth, createDisabilityHandler);
disabilityRouter.put('/assessments/:id/disabilities', requireAuth, replaceAssessmentDisabilitiesHandler);
disabilityRouter.delete('/disabilities/:id', requireAuth, deleteDisabilityHandler);
