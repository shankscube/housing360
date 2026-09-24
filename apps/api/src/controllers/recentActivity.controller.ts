import { NextFunction, Request, Response } from 'express';
import type { RecentActivityFilter } from '@housing360/types';
import { listRecentActivity } from '../services/recentActivity.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

const VALID_FILTERS: readonly RecentActivityFilter[] = ['all', 'cases', 'referrals', 'clients', 'assessments'];

function parseFilter(value: unknown): RecentActivityFilter {
  if (typeof value === 'string' && (VALID_FILTERS as readonly string[]).includes(value)) {
    return value as RecentActivityFilter;
  }
  return 'all';
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function listRecentActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const type = parseFilter(req.query.type);
    const page = parsePositiveInt(req.query.page);
    const pageSize = parsePositiveInt(req.query.pageSize);

    const data = await listRecentActivity(req.user.id, { type, page, pageSize });
    sendSuccess(res, { code: 200, message: 'Recent activity retrieved', data });
  } catch (err) {
    next(err);
  }
}
