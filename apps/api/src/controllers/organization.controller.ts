import { NextFunction, Request, Response } from 'express';
import { listPartnerAgencies } from '../services/organization.service';
import { sendSuccess } from '../utils/responder';

export async function listPartnerAgenciesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
    const agencies = await listPartnerAgencies(domain);
    sendSuccess(res, { code: 200, message: 'Partner agencies retrieved', data: agencies });
  } catch (err) {
    next(err);
  }
}
