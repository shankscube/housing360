import { Router } from 'express';
import { getHudOptionsHandler } from '../controllers/reference.controller';
import { requireAuth } from '../middlewares/auth';

export const referenceRouter = Router();

// Mounted at `/api` — path below is `/reference/hud-options`, not `/api/...`.
referenceRouter.get('/reference/hud-options', requireAuth, getHudOptionsHandler);
