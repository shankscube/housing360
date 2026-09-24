import { Router } from 'express';
import { searchHandler } from '../controllers/search.controller';
import { requireAuth } from '../middlewares/auth';

export const searchRouter = Router();

// Mounted at `/api` by the orchestrator — path below is relative to that.
searchRouter.get('/search', requireAuth, searchHandler);
