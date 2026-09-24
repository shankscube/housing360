import { Router } from 'express';
import { listAppointmentsHandler } from '../controllers/appointment.controller';
import { requireAuth } from '../middlewares/auth';

export const appointmentRouter = Router();

// Mounted at `/api` by the orchestrator — path below is relative to that.
appointmentRouter.get('/appointments', requireAuth, listAppointmentsHandler);
