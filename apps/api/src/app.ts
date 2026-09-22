import express from 'express';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
