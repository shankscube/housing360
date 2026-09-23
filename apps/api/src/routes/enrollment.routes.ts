import { Router } from 'express';
import {
  createEnrollmentHandler,
  listClientEnrollmentsHandler,
  updateEnrollmentHandler,
} from '../controllers/enrollment.controller';
import { requireAuth } from '../middlewares/auth';

export const enrollmentRouter = Router();

// Mounted at `/api` — paths below are `/clients/:id/enrollments`,
// `/enrollments`, and `/enrollments/:id`, not `/api/...`.
enrollmentRouter.get('/clients/:id/enrollments', requireAuth, listClientEnrollmentsHandler);
enrollmentRouter.post('/enrollments', requireAuth, createEnrollmentHandler);
enrollmentRouter.patch('/enrollments/:id', requireAuth, updateEnrollmentHandler);
