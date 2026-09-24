import { Router } from 'express';
import { getHomeDashboardHandler } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';

export const dashboardRouter = Router();

// Mounted at `/api/dashboard` by the orchestrator — path below is `/home`.
dashboardRouter.get('/home', requireAuth, getHomeDashboardHandler);
