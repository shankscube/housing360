import { NextFunction, Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await getHealthStatus();
    if (health.database === 'unreachable') {
      throw new AppError(503, 'Database unreachable', ['Database connectivity check failed']);
    }
    sendSuccess(res, { code: 200, message: 'Service healthy', data: health });
  } catch (err) {
    next(err);
  }
}
