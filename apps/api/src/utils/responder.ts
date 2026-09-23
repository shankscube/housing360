import { Response } from 'express';

interface SuccessOptions<T> {
  code?: number;
  message: string;
  data: T;
}

interface ErrorOptions {
  code?: number;
  message: string;
  errors: string[];
  /** Optional structured payload (e.g. duplicate-check candidates) — omitted from the JSON body when absent. */
  data?: unknown;
}

export function sendSuccess<T>(res: Response, { code = 200, message, data }: SuccessOptions<T>) {
  return res.status(code).json({ success: true, code, message, data });
}

export function sendError(res: Response, { code = 500, message, errors, data }: ErrorOptions) {
  return res.status(code).json({ success: false, code, message, errors, ...(data !== undefined ? { data } : {}) });
}
