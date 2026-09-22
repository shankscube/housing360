import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
