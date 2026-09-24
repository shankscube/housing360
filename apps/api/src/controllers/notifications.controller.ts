import { NextFunction, Request, Response } from 'express';
import { getNotifications, markSeen } from '../services/notifications.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function getNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const result = await getNotifications(req.user.id);
    sendSuccess(res, { code: 200, message: 'Notifications retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

export async function markStatusUpdatesSeenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    await markSeen(req.user.id);
    sendSuccess(res, { code: 200, message: 'Status updates marked seen', data: null });
  } catch (err) {
    next(err);
  }
}
