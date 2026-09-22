import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/responder';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn({ statusCode: err.statusCode, message: err.message }, 'Handled application error');
    sendError(res, { code: err.statusCode, message: err.message, errors: err.errors });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, {
    code: 500,
    message: 'Internal server error',
    errors: ['An unexpected error occurred'],
  });
};
