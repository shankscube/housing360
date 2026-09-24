import { Router } from 'express';
import {
  createCoordinatedEntryReferralHandler,
  getPrioritizationListHandler,
  getRecommendedProgramsHandler,
  listPartnerAgenciesForCoordinatedEntryHandler,
  submitVulnerabilityAssessmentHandler,
} from '../controllers/coordinatedEntry.controller';
import { requireAuth } from '../middlewares/auth';

export const coordinatedEntryRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
coordinatedEntryRouter.post(
  '/coordinated-entry/vulnerability-assessment',
  requireAuth,
  submitVulnerabilityAssessmentHandler
);
coordinatedEntryRouter.get(
  '/coordinated-entry/recommended-programs',
  requireAuth,
  getRecommendedProgramsHandler
);
coordinatedEntryRouter.get(
  '/coordinated-entry/partner-agencies',
  requireAuth,
  listPartnerAgenciesForCoordinatedEntryHandler
);
coordinatedEntryRouter.post('/coordinated-entry/referrals', requireAuth, createCoordinatedEntryReferralHandler);
coordinatedEntryRouter.get(
  '/coordinated-entry/prioritization-list',
  requireAuth,
  getPrioritizationListHandler
);
