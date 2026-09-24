import { Router } from 'express';
import {
  createBedAssignmentHandler,
  createBedNightHandler,
  listAvailableBedsHandler,
  listBedNightsHandler,
  updateBedNightHandler,
} from '../controllers/bed.controller';
import { requireAuth } from '../middlewares/auth';

export const bedRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
bedRouter.get('/programs/:id/beds/available', requireAuth, listAvailableBedsHandler);
bedRouter.post('/bed-assignments', requireAuth, createBedAssignmentHandler);
bedRouter.get('/bed-assignments/:id/nights', requireAuth, listBedNightsHandler);
bedRouter.post('/bed-nights', requireAuth, createBedNightHandler);
bedRouter.patch('/bed-nights/:id', requireAuth, updateBedNightHandler);
