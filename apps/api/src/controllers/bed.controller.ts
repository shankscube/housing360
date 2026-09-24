import { NextFunction, Request, Response } from 'express';
import type { BedAssignmentInput, BedNightInput, BedNightUpdateInput } from '@housing360/types';
import { assignBed, listAvailableBeds, listBedNights, logBedNight, updateBedNight } from '../services/bed.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function listAvailableBedsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { date, shift } = req.query as { date?: string; shift?: string };
    if (!id) throw new AppError(400, 'Program id is required');
    if (!date || !shift) throw new AppError(400, 'date and shift query parameters are required');
    const beds = await listAvailableBeds(id, date, shift);
    sendSuccess(res, { code: 200, message: 'Available beds retrieved', data: beds });
  } catch (err) {
    next(err);
  }
}

export async function createBedAssignmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<BedAssignmentInput> | undefined;
    if (!input?.programEnrollmentId || !input.bedId || !input.shift) {
      throw new AppError(400, 'programEnrollmentId, bedId, and shift are required');
    }
    const assignment = await assignBed(input.programEnrollmentId, input.bedId, input.shift, input.date);
    sendSuccess(res, { code: 201, message: 'Bed assigned', data: assignment });
  } catch (err) {
    next(err);
  }
}

export async function listBedNightsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Bed assignment id is required');
    const nights = await listBedNights(id);
    sendSuccess(res, { code: 200, message: 'Bed nights retrieved', data: nights });
  } catch (err) {
    next(err);
  }
}

export async function createBedNightHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<BedNightInput> | undefined;
    if (!input?.bedAssignmentId || !input.logDate || !input.shift || !input.status) {
      throw new AppError(400, 'bedAssignmentId, logDate, shift, and status are required');
    }
    const night = await logBedNight(input.bedAssignmentId, input.logDate, input.shift, input.status);
    sendSuccess(res, { code: 201, message: 'Bed night logged', data: night });
  } catch (err) {
    next(err);
  }
}

export async function updateBedNightHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError(400, 'Bed night id is required');
    const input = req.body as BedNightUpdateInput;
    const night = await updateBedNight(id, input);
    sendSuccess(res, { code: 200, message: 'Bed night updated', data: night });
  } catch (err) {
    next(err);
  }
}
