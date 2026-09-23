import { Router } from 'express';
import { ensureCaseHandler } from '../controllers/case.controller';
import { requireAuth } from '../middlewares/auth';

export const caseRouter = Router();

// Mounted at `/api` — path below is `/cases/ensure`, not `/api/cases/ensure`.
caseRouter.post('/cases/ensure', requireAuth, ensureCaseHandler);
