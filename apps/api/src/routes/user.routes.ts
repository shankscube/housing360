import { Router } from 'express';
import { listUsersHandler } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth';

export const userRouter = Router();

// Mounted at `/api` — path below is `/users`, not `/api/users`.
userRouter.get('/users', requireAuth, listUsersHandler);
