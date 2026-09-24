import { Router } from 'express';
import {
  getCaseOptionsHandler,
  getHudOptionsHandler,
  getRoiTextHandler,
} from '../controllers/reference.controller';
import { requireAuth } from '../middlewares/auth';

export const referenceRouter = Router();

// Mounted at `/api` — paths below are `/reference/...`, not `/api/...`.
referenceRouter.get('/reference/hud-options', requireAuth, getHudOptionsHandler);
referenceRouter.get('/reference/case-options', requireAuth, getCaseOptionsHandler);
referenceRouter.get('/reference/roi-text', requireAuth, getRoiTextHandler);
