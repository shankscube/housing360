import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';
import { householdRouter } from './household.routes';
import { programRouter } from './program.routes';
import { enrollmentRouter } from './enrollment.routes';
import { caseRouter } from './case.routes';
import { referenceRouter } from './reference.routes';
import { assessmentRouter } from './assessment.routes';
import { disabilityRouter } from './disability.routes';
import { interactionSummaryRouter } from './interactionSummary.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
// First `/api`-prefixed route group — `/health` and `/auth` stay unprefixed
// to match existing precedent; only this new domain group gets the prefix.
apiRouter.use('/api/clients', clientRouter);
// client-intake-wizard: each of these routers defines its own paths relative
// to `/api` (e.g. `/households`, `/clients/:id/enrollments`) rather than
// getting its own `/api/<domain>` mount — `enrollmentRouter`'s
// `/clients/:id/enrollments` in particular falls through `clientRouter`
// cleanly since that router has no matching route for it.
apiRouter.use('/api', householdRouter);
apiRouter.use('/api', programRouter);
apiRouter.use('/api', enrollmentRouter);
apiRouter.use('/api', caseRouter);
apiRouter.use('/api', referenceRouter);
apiRouter.use('/api', assessmentRouter);
apiRouter.use('/api', disabilityRouter);
apiRouter.use('/api', interactionSummaryRouter);
