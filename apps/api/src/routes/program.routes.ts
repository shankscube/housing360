import { Router } from 'express';
import { listProgramsHandler } from '../controllers/program.controller';
import { requireAuth } from '../middlewares/auth';

export const programRouter = Router();

// Mounted at `/api` — path below is `/programs`, not `/api/programs`.
programRouter.get('/programs', requireAuth, listProgramsHandler);
