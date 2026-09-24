import { Router } from 'express';
import {
  assignServiceHandler,
  createDisbursementHandler,
  listAssignableBenefitsHandler,
  listDisbursementsHandler,
  listEnrollmentServicesHandler,
  updateDisbursementHandler,
} from '../controllers/service.controller';
import { requireAuth } from '../middlewares/auth';

export const serviceRouter = Router();

// Mounted at `/api` by the orchestrator — paths below are relative to that.
// `GET /clients/:id/enrollments` already exists (`enrollment.routes.ts`) and
// is reused as-is for the Services tab's enrollments list.
serviceRouter.get('/enrollments/:id/services', requireAuth, listEnrollmentServicesHandler);
serviceRouter.get('/enrollments/:id/assignable-benefits', requireAuth, listAssignableBenefitsHandler);
serviceRouter.post('/enrollments/:id/services', requireAuth, assignServiceHandler);
serviceRouter.get('/benefit-assignments/:id/disbursements', requireAuth, listDisbursementsHandler);
serviceRouter.post('/benefit-assignments/:id/disbursements', requireAuth, createDisbursementHandler);
serviceRouter.patch('/disbursements/:id', requireAuth, updateDisbursementHandler);
