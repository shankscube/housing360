import { NextFunction, Request, Response } from 'express';
import type { CaseCreateInput, CaseFilter, CaseUpdateInput, EnsureCaseInput } from '@housing360/types';
import {
  createCase,
  ensureCase,
  getCaseById,
  getCaseHudData,
  listCases,
  updateCase,
} from '../services/case.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

const VALID_FILTERS: readonly CaseFilter[] = [
  'all',
  'myCaseload',
  'highRisk',
  'dueToday',
  'overdue',
  'recentlyUpdated',
];

function parseFilter(value: unknown): CaseFilter | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return (VALID_FILTERS as readonly string[]).includes(value) ? (value as CaseFilter) : undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function ensureCaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<EnsureCaseInput> | undefined;
    if (!input?.clientId || !input.enrollmentId) {
      throw new AppError(400, 'clientId and enrollmentId are required');
    }
    const caseRecord = await ensureCase(input as EnsureCaseInput);
    sendSuccess(res, { code: 200, message: 'Case ensured', data: caseRecord });
  } catch (err) {
    next(err);
  }
}

export async function listCasesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const result = await listCases(
      {
        page: parsePositiveInt(req.query.page),
        pageSize: parsePositiveInt(req.query.pageSize),
        filter: parseFilter(req.query.filter),
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      },
      req.user.id
    );
    sendSuccess(res, { code: 200, message: 'Cases retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Case id is required');
    }
    const caseDetail = await getCaseById(id);
    sendSuccess(res, { code: 200, message: 'Case retrieved', data: caseDetail });
  } catch (err) {
    next(err);
  }
}

export async function createCaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const input = req.body as Partial<CaseCreateInput> | undefined;
    if (!input?.clientId) {
      throw new AppError(400, 'clientId is required');
    }
    // Defaults the new case to whoever is creating it — the seeded demo user
    // is the only case manager today (see design.md); an explicit
    // `assignedCaseManagerId` in the body still wins.
    const caseDetail = await createCase({
      ...(input as CaseCreateInput),
      assignedCaseManagerId: input.assignedCaseManagerId ?? req.user.id,
    });
    sendSuccess(res, { code: 201, message: 'Case created', data: caseDetail });
  } catch (err) {
    next(err);
  }
}

export async function updateCaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Case id is required');
    }
    const input = req.body as CaseUpdateInput;
    const caseDetail = await updateCase(id, input);
    sendSuccess(res, { code: 200, message: 'Case updated', data: caseDetail });
  } catch (err) {
    next(err);
  }
}

export async function getCaseHudDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Case id is required');
    }
    const hudData = await getCaseHudData(id);
    sendSuccess(res, { code: 200, message: 'HUD Data checklist retrieved', data: hudData });
  } catch (err) {
    next(err);
  }
}
