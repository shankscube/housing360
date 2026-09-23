import { randomUUID } from 'crypto';
import type {
  Client,
  ClientIntakeInput,
  ClientListItem,
  ClientListQuery,
  ClientListResult,
  ClientUpdateInput,
  CreateClientResult,
} from '@housing360/types';
import {
  type ClientWriteData,
  countHeadOfHouseholdInHousehold,
  createClient as createClientRow,
  findClientById,
  findClients,
  findDuplicateCandidates,
  updateClient as updateClientRow,
} from '../models/client.model';
import {
  disclosureFieldToColumns,
  sexToPrisma,
  toClient,
  toClientListItem,
} from '../models/client.mapper';
import { AppError } from '../utils/AppError';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePagination(query: ClientListQuery): { page: number; pageSize: number } {
  const page =
    query.page !== undefined && Number.isFinite(query.page) && query.page > 0
      ? Math.floor(query.page)
      : DEFAULT_PAGE;
  const pageSize =
    query.pageSize !== undefined && Number.isFinite(query.pageSize) && query.pageSize > 0
      ? Math.min(Math.floor(query.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

export async function listClients(query: ClientListQuery): Promise<ClientListResult> {
  const { page, pageSize } = normalizePagination(query);
  const filter = query.filter ?? 'all';

  const { rows, total } = await findClients({ page, pageSize, filter, search: query.search });
  const items: ClientListItem[] = rows.map(toClientListItem);

  return { items, total, page, pageSize };
}

export async function getClientById(id: string): Promise<Client> {
  const row = await findClientById(id);
  if (!row) {
    throw new AppError(404, 'Client not found');
  }
  return toClient(row);
}

/**
 * Rejects with 409 if `householdId` already has a head of household (other
 * than `excludeClientId`, when updating an existing client in place).
 */
async function assertSingleHeadOfHousehold(
  householdId: string,
  excludeClientId?: string
): Promise<void> {
  const existingHeadCount = await countHeadOfHouseholdInHousehold(householdId, excludeClientId);
  if (existingHeadCount > 0) {
    throw new AppError(409, 'Household already has a head of household');
  }
}

export async function createClient(input: ClientIntakeInput): Promise<CreateClientResult> {
  // A duplicate can only be matched on name + DOB + SSN when both of those
  // are actual disclosed values — a withheld field can't be compared.
  const canCheckDuplicates = input.ssn.status === 'provided' && input.dob.status === 'provided';

  if (canCheckDuplicates && input.confirmDuplicate !== true) {
    const candidates = await findDuplicateCandidates({
      name: input.name,
      dob: input.dob.value ?? undefined,
      ssn: input.ssn.value ?? undefined,
    });
    if (candidates.length > 0) {
      return { status: 'duplicates_found', candidates: candidates.map(toClientListItem) };
    }
  }

  // TODO(household-duplicate-alert): no automated alert today for a person registered in more than one household — see proposal.md's carried-forward gap

  const householdId = input.householdId ?? randomUUID();
  if (input.isHeadOfHousehold) {
    await assertSingleHeadOfHousehold(householdId);
  }

  const ssnColumns = disclosureFieldToColumns(input.ssn);
  const dobColumns = disclosureFieldToColumns(input.dob);

  const row = await createClientRow({
    name: input.name,
    sex: sexToPrisma(input.sex),
    raceEthnicity: input.raceEthnicity,
    ssn: ssnColumns.value,
    ssnDisclosure: ssnColumns.status,
    dob: dobColumns.value,
    dobDisclosure: dobColumns.status,
    householdId,
    isHeadOfHousehold: input.isHeadOfHousehold,
  });

  return { status: 'created', client: toClient(row) };
}

export async function updateClient(id: string, input: ClientUpdateInput): Promise<Client> {
  const existing = await findClientById(id);
  if (!existing) {
    throw new AppError(404, 'Client not found');
  }

  if (input.isHeadOfHousehold === true) {
    const householdId = input.householdId ?? existing.householdId;
    await assertSingleHeadOfHousehold(householdId, id);
  }

  const data: Partial<ClientWriteData> = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.sex !== undefined) {
    data.sex = sexToPrisma(input.sex);
  }
  if (input.raceEthnicity !== undefined) {
    data.raceEthnicity = input.raceEthnicity;
  }
  if (input.householdId !== undefined) {
    data.householdId = input.householdId;
  }
  if (input.isHeadOfHousehold !== undefined) {
    data.isHeadOfHousehold = input.isHeadOfHousehold;
  }
  if (input.ssn !== undefined) {
    const columns = disclosureFieldToColumns(input.ssn);
    data.ssn = columns.value;
    data.ssnDisclosure = columns.status;
  }
  if (input.dob !== undefined) {
    const columns = disclosureFieldToColumns(input.dob);
    data.dob = columns.value;
    data.dobDisclosure = columns.status;
  }

  const row = await updateClientRow(id, data);
  return toClient(row);
}
