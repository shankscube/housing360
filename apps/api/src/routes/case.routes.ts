import { Router } from 'express';
import {
  createCaseHandler,
  ensureCaseHandler,
  getCaseHandler,
  getCaseHudDataHandler,
  listCasesHandler,
  updateCaseFollowUpHandler,
  updateCaseHandler,
} from '../controllers/case.controller';
import { requireAuth } from '../middlewares/auth';

export const caseRouter = Router();

// Mounted at `/api` — paths below are `/cases...`, not `/api/cases...`.
// `/cases/ensure` is registered before `/cases/:id` so Express doesn't match
// "ensure" as an `:id` param first.
caseRouter.post('/cases/ensure', requireAuth, ensureCaseHandler);
caseRouter.get('/cases', requireAuth, listCasesHandler);
caseRouter.get('/cases/:id', requireAuth, getCaseHandler);
caseRouter.get('/cases/:id/hud-data', requireAuth, getCaseHudDataHandler);
caseRouter.post('/cases', requireAuth, createCaseHandler);
caseRouter.patch('/cases/:id/follow-up', requireAuth, updateCaseFollowUpHandler);
caseRouter.patch('/cases/:id', requireAuth, updateCaseHandler);
