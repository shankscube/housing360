import { Router } from 'express';
import {
  createClientHandler,
  getClientHandler,
  getClientIntakeSnapshotHandler,
  listClientsHandler,
  searchClientsHandler,
  updateClientHandler,
} from '../controllers/client.controller';
import { requireAuth } from '../middlewares/auth';

export const clientRouter = Router();

// First real domain data route carrying PII (SSN, DOB) — gated by the same
// cookie-based `requireAuth` the `/auth/me` route uses, on top of (not
// instead of) the frontend's RouteGuard. The RouteGuard only stops in-app
// navigation; it does nothing to stop a direct API call, so an unprotected
// endpoint here would serve SSNs to anyone who could reach the API port.
//
// `/search` is registered before `/:id` — Express matches routes in
// declaration order, and `/:id` would otherwise swallow `/search` as an id.
clientRouter.get('/', requireAuth, listClientsHandler);
clientRouter.get('/search', requireAuth, searchClientsHandler);
clientRouter.get('/:id', requireAuth, getClientHandler);
clientRouter.get('/:id/intake-snapshot', requireAuth, getClientIntakeSnapshotHandler);
clientRouter.post('/', requireAuth, createClientHandler);
clientRouter.patch('/:id', requireAuth, updateClientHandler);
