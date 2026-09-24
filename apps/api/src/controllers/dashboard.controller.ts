import { NextFunction, Request, Response } from 'express';
import { getHomeDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function getHomeDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const dashboard = await getHomeDashboard(req.user.id, req.user.firstName);
    sendSuccess(res, { code: 200, message: 'Home dashboard retrieved', data: dashboard });
  } catch (err) {
    next(err);
  }
}
