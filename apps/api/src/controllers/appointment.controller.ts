import { NextFunction, Request, Response } from 'express';
import { listAppointments } from '../services/appointment.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

function parseDate(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !value) {
    throw new AppError(400, `${label} is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${label} must be a valid date`);
  }
  return date;
}

/**
 * `?mine=true` scopes to the requesting user's own caseload (Home's
 * dashboard call); without it, the standalone Calendar page gets the
 * org-wide set — see the task-management spec.
 */
export async function listAppointmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const from = parseDate(req.query.from, 'from');
    const to = parseDate(req.query.to, 'to');
    const mine = req.query.mine === 'true';
    const assignedCaseManagerId = mine ? req.user?.id : undefined;

    const appointments = await listAppointments(from, to, assignedCaseManagerId);
    sendSuccess(res, { code: 200, message: 'Appointments retrieved', data: appointments });
  } catch (err) {
    next(err);
  }
}
