import { NextFunction, Request, Response } from 'express';
import { listUsers } from '../services/user.service';
import { sendSuccess } from '../utils/responder';

export async function listUsersHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await listUsers();
    sendSuccess(res, { code: 200, message: 'Users retrieved', data: users });
  } catch (err) {
    next(err);
  }
}
