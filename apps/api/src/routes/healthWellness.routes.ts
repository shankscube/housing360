import { Router } from 'express';
import { getHealthWellnessHandler } from '../controllers/healthWellness.controller';
import { requireAuth } from '../middlewares/auth';

export const healthWellnessRouter = Router();

// Mounted at `/api` by the orchestrator — path below is `/clients/:id/health-wellness`.
healthWellnessRouter.get('/clients/:id/health-wellness', requireAuth, getHealthWellnessHandler);
