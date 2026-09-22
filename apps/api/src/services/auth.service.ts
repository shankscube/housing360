import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthenticatedUser } from '@housing360/types';
import { env } from '../config/env';
import { findUserByEmail, findUserById } from '../models/user.model';

export interface AuthTokenPayload {
  /** JWT `sub` claim — a string per spec; the caller converts to/from the numeric user id. */
  sub: string;
}

function toAuthenticatedUser(user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}): AuthenticatedUser {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

export async function authenticate(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  return isMatch ? toAuthenticatedUser(user) : null;
}

export function issueToken(userId: number): string {
  const payload: AuthTokenPayload = { sub: String(userId) };
  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.auth.jwtSecret);
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      return null;
    }
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(userId: number): Promise<AuthenticatedUser | null> {
  const user = await findUserById(userId);
  return user ? toAuthenticatedUser(user) : null;
}
