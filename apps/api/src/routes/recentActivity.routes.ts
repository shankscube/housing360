import { Router } from 'express';
import { listRecentActivityHandler } from '../controllers/recentActivity.controller';
import { requireAuth } from '../middlewares/auth';

export const recentActivityRouter = Router();

// Mounted at `/api` — path below is `/recent-activity`, i.e. `/api/recent-activity`.
recentActivityRouter.get('/recent-activity', requireAuth, listRecentActivityHandler);
