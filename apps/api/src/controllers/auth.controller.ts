import { CookieOptions, NextFunction, Request, Response } from 'express';
import { authenticate, issueToken } from '../services/auth.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const user = await authenticate(email, password);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = issueToken(user.id);
    res.cookie(env.auth.cookieName, token, cookieOptions());
    sendSuccess(res, { code: 200, message: 'Logged in', data: user });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.auth.cookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
  });
  sendSuccess(res, { code: 200, message: 'Logged out', data: null });
}

export function me(req: Request, res: Response) {
  sendSuccess(res, { code: 200, message: 'Current user', data: req.user ?? null });
}
