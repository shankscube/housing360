import { Router } from 'express';
import {
  createEnrollmentHandler,
  getEnrollmentSummaryHandler,
  listClientEnrollmentsHandler,
  updateEnrollmentHandler,
} from '../controllers/enrollment.controller';
import { requireAuth } from '../middlewares/auth';

export const enrollmentRouter = Router();

// Mounted at `/api` — paths below are `/clients/:id/enrollments`,
// `/enrollments`, and `/enrollments/:id`, not `/api/...`.
enrollmentRouter.get('/clients/:id/enrollments', requireAuth, listClientEnrollmentsHandler);
enrollmentRouter.post('/enrollments', requireAuth, createEnrollmentHandler);
// `assessment-and-ce-workspace` — registered before the bare `:id` patch
// route's neighbors purely for readability; Express matches by full path so
// order between these two doesn't actually matter.
enrollmentRouter.get('/enrollments/:id/summary', requireAuth, getEnrollmentSummaryHandler);
enrollmentRouter.patch('/enrollments/:id', requireAuth, updateEnrollmentHandler);
