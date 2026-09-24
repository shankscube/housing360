import { Router } from 'express';
import {
  getNotificationsHandler,
  markStatusUpdatesSeenHandler,
} from '../controllers/notifications.controller';
import { requireAuth } from '../middlewares/auth';

export const notificationsRouter = Router();

// Mounted at `/api` — paths below are `/notifications...`, not `/api/notifications...`.
notificationsRouter.get('/notifications', requireAuth, getNotificationsHandler);
notificationsRouter.post(
  '/notifications/status-updates/seen',
  requireAuth,
  markStatusUpdatesSeenHandler
);
