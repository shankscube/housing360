import { NextFunction, Request, Response } from 'express';
import type { AuthenticatedUser } from '@housing360/types';
import { getAuthenticatedUser, verifyToken } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token: string | undefined = req.cookies?.[env.auth.cookieName];
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      throw new AppError(401, 'Not authenticated');
    }

    const user = await getAuthenticatedUser(Number(payload.sub));
    if (!user) {
      throw new AppError(401, 'Not authenticated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
