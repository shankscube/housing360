import { NextFunction, Request, Response } from 'express';
import type { ReleaseOfInformationCreateInput } from '@housing360/types';
import { createReleaseOfInformation, getRoiStatus } from '../services/releaseOfInformation.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function createReleaseOfInformationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<ReleaseOfInformationCreateInput> | undefined;
    if (!input?.clientId || !input.recipientOrgName) {
      throw new AppError(400, 'clientId and recipientOrgName are required');
    }
    const roi = await createReleaseOfInformation(input as ReleaseOfInformationCreateInput);
    sendSuccess(res, { code: 201, message: 'Release of Information saved', data: roi });
  } catch (err) {
    next(err);
  }
}

export async function getRoiStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Client id is required');
    }
    const status = await getRoiStatus(id);
    sendSuccess(res, { code: 200, message: 'ROI status retrieved', data: status });
  } catch (err) {
    next(err);
  }
}
