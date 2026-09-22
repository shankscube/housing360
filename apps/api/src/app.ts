import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRouter } from './routes';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.auth.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
