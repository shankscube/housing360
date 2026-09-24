import { Router } from 'express';
import {
  createReleaseOfInformationHandler,
  getRoiStatusHandler,
} from '../controllers/releaseOfInformation.controller';
import { requireAuth } from '../middlewares/auth';

export const releaseOfInformationRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
releaseOfInformationRouter.post(
  '/releases-of-information',
  requireAuth,
  createReleaseOfInformationHandler
);
releaseOfInformationRouter.get('/clients/:id/roi-status', requireAuth, getRoiStatusHandler);
