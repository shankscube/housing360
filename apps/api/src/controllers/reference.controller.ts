import { NextFunction, Request, Response } from 'express';
import { HUD_OPTIONS } from '../constants/hudOptions';
import { sendSuccess } from '../utils/responder';

export function getHudOptionsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, { code: 200, message: 'HUD options retrieved', data: HUD_OPTIONS });
  } catch (err) {
    next(err);
  }
}
