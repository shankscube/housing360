import { Router } from 'express';
import { addHouseholdMembersHandler, createHouseholdHandler } from '../controllers/household.controller';
import { requireAuth } from '../middlewares/auth';

export const householdRouter = Router();

// Mounted at `/api` by the orchestrator's routes/index.ts — paths below are
// therefore `/households` and `/households/:id/members`, not `/api/...`.
householdRouter.post('/households', requireAuth, createHouseholdHandler);
householdRouter.post('/households/:id/members', requireAuth, addHouseholdMembersHandler);
