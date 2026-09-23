import { Router } from 'express';
import {
  createClientHandler,
  getClientHandler,
  listClientsHandler,
  updateClientHandler,
} from '../controllers/client.controller';
import { requireAuth } from '../middlewares/auth';

export const clientRouter = Router();

// First real domain data route carrying PII (SSN, DOB) — gated by the same
// cookie-based `requireAuth` the `/auth/me` route uses, on top of (not
// instead of) the frontend's RouteGuard. The RouteGuard only stops in-app
// navigation; it does nothing to stop a direct API call, so an unprotected
// endpoint here would serve SSNs to anyone who could reach the API port.
clientRouter.get('/', requireAuth, listClientsHandler);
clientRouter.get('/:id', requireAuth, getClientHandler);
clientRouter.post('/', requireAuth, createClientHandler);
clientRouter.patch('/:id', requireAuth, updateClientHandler);
