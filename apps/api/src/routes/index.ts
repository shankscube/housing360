import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
// First `/api`-prefixed route group — `/health` and `/auth` stay unprefixed
// to match existing precedent; only this new domain group gets the prefix.
apiRouter.use('/api/clients', clientRouter);
