import { NextFunction, Request, Response } from 'express';
import { getHealthWellness } from '../services/healthWellness.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function getHealthWellnessHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Client id is required');
    const healthWellness = await getHealthWellness(id);
    sendSuccess(res, { code: 200, message: 'Health and wellness data retrieved', data: healthWellness });
  } catch (err) {
    next(err);
  }
}
