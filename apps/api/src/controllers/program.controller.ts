import { NextFunction, Request, Response } from 'express';
import { listPrograms } from '../services/program.service';
import { sendSuccess } from '../utils/responder';

export async function listProgramsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // "any truthy string" — presence of a non-empty `active` query value is
    // enough; an absent or empty param means "all programs".
    const activeOnly = Boolean(req.query.active);
    const programs = await listPrograms(activeOnly);
    sendSuccess(res, { code: 200, message: 'Programs retrieved', data: programs });
  } catch (err) {
    next(err);
  }
}
