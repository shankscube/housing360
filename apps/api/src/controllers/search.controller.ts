import { NextFunction, Request, Response } from 'express';
import { globalSearch } from '../services/search.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function searchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = typeof req.query.q === 'string' ? req.query.q : '';
    const query = raw.trim();
    if (query.length < 2) {
      throw new AppError(400, 'Search query must be at least 2 characters');
    }
    const result = await globalSearch(query);
    sendSuccess(res, { code: 200, message: 'Search results retrieved', data: result });
  } catch (err) {
    next(err);
  }
}
