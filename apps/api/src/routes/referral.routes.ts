import { Router } from 'express';
import {
  acceptReferralHandler,
  createExternalReferralHandler,
  createReferralHandler,
  declineReferralHandler,
  listCaseReferralsHandler,
  updateReferralHandler,
} from '../controllers/referral.controller';
import { listPartnerAgenciesHandler } from '../controllers/organization.controller';
import { requireAuth } from '../middlewares/auth';

export const referralRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
referralRouter.get('/partner-agencies', requireAuth, listPartnerAgenciesHandler);
referralRouter.post('/referrals/external', requireAuth, createExternalReferralHandler);
referralRouter.get('/cases/:caseId/referrals', requireAuth, listCaseReferralsHandler);
referralRouter.post('/referrals', requireAuth, createReferralHandler);
referralRouter.post('/referrals/:id/accept', requireAuth, acceptReferralHandler);
referralRouter.post('/referrals/:id/decline', requireAuth, declineReferralHandler);
referralRouter.patch('/referrals/:id', requireAuth, updateReferralHandler);
