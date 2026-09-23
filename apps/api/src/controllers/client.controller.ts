import { NextFunction, Request, Response } from 'express';
import type { ClientFilter, ClientIntakeInput, ClientUpdateInput } from '@housing360/types';
import {
  createClient,
  getClientById,
  listClients,
  updateClient,
} from '../services/client.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

const VALID_FILTERS: readonly ClientFilter[] = [
  'all',
  'male',
  'female',
  'withProgram',
  'withoutProgram',
  'withCases',
  'withoutCases',
];

function parseFilter(value: unknown): ClientFilter | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return (VALID_FILTERS as readonly string[]).includes(value) ? (value as ClientFilter) : undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function listClientsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await listClients({
      page: parsePositiveInt(req.query.page),
      pageSize: parsePositiveInt(req.query.pageSize),
      filter: parseFilter(req.query.filter),
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    sendSuccess(res, { code: 200, message: 'Clients retrieved', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getClientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Client id is required');
    }
    const client = await getClientById(id);
    sendSuccess(res, { code: 200, message: 'Client retrieved', data: client });
  } catch (err) {
    next(err);
  }
}

export async function createClientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<ClientIntakeInput> | undefined;
    if (
      !input?.name ||
      !input.sex ||
      !input.raceEthnicity ||
      !input.ssn ||
      !input.dob ||
      typeof input.isHeadOfHousehold !== 'boolean'
    ) {
      throw new AppError(400, 'name, sex, raceEthnicity, ssn, dob, and isHeadOfHousehold are required');
    }

    const result = await createClient(input as ClientIntakeInput);
    sendSuccess(res, {
      code: result.status === 'created' ? 201 : 200,
      message: result.status === 'created' ? 'Client created' : 'Duplicate candidates found',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateClientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Client id is required');
    }
    const input = req.body as ClientUpdateInput;
    const client = await updateClient(id, input);
    sendSuccess(res, { code: 200, message: 'Client updated', data: client });
  } catch (err) {
    next(err);
  }
}
