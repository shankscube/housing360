import { DisclosureStatus as PrismaDisclosureStatus, Sex as PrismaSex } from '@prisma/client';
import type {
  Client,
  ClientListItem,
  DisclosureField,
  DisclosureStatus,
  Sex,
} from '@housing360/types';
import type { ClientListRow, ClientRow } from './client.model';

const SEX_TO_PRISMA: Record<Sex, PrismaSex> = {
  male: 'MALE',
  female: 'FEMALE',
  other: 'OTHER',
};

const SEX_FROM_PRISMA: Record<PrismaSex, Sex> = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

const DISCLOSURE_STATUS_TO_PRISMA: Record<DisclosureStatus, PrismaDisclosureStatus> = {
  provided: 'PROVIDED',
  client_doesnt_know: 'CLIENT_DOESNT_KNOW',
  prefers_not_to_answer: 'PREFERS_NOT_TO_ANSWER',
  data_not_collected: 'DATA_NOT_COLLECTED',
};

const DISCLOSURE_STATUS_FROM_PRISMA: Record<PrismaDisclosureStatus, DisclosureStatus> = {
  PROVIDED: 'provided',
  CLIENT_DOESNT_KNOW: 'client_doesnt_know',
  PREFERS_NOT_TO_ANSWER: 'prefers_not_to_answer',
  DATA_NOT_COLLECTED: 'data_not_collected',
};

export function sexToPrisma(sex: Sex): PrismaSex {
  return SEX_TO_PRISMA[sex];
}

export function sexFromPrisma(sex: PrismaSex): Sex {
  return SEX_FROM_PRISMA[sex];
}

export function disclosureStatusToPrisma(status: DisclosureStatus): PrismaDisclosureStatus {
  return DISCLOSURE_STATUS_TO_PRISMA[status];
}

export function disclosureStatusFromPrisma(status: PrismaDisclosureStatus): DisclosureStatus {
  return DISCLOSURE_STATUS_FROM_PRISMA[status];
}

/** `DisclosureField<string>` -> the flat `{ value, status }` Prisma columns. */
export function disclosureFieldToColumns(
  field: DisclosureField<string>
): { value: string | null; status: PrismaDisclosureStatus } {
  return {
    // Only persist a real value when the status says it was actually provided.
    value: field.status === 'provided' ? field.value : null,
    status: disclosureStatusToPrisma(field.status),
  };
}

/** The flat Prisma `value`/`status` columns -> `DisclosureField<string>`. */
function disclosureFieldFromColumns(
  value: string | null,
  status: PrismaDisclosureStatus
): DisclosureField<string> {
  return {
    status: disclosureStatusFromPrisma(status),
    value: status === 'PROVIDED' ? value : null,
  };
}

/** Full mapper — includes SSN/DOB. Use only for detail/create/update responses. */
export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: row.raceEthnicity,
    ssn: disclosureFieldFromColumns(row.ssn, row.ssnDisclosure),
    dob: disclosureFieldFromColumns(row.dob, row.dobDisclosure),
    householdId: row.householdId,
    isHeadOfHousehold: row.isHeadOfHousehold,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * List-safe mapper. `ClientListRow` comes from a Prisma `select` that never
 * includes `ssn`/`dob`/their disclosure columns, so this function has no
 * access to those values to leak even by mistake — a future column rename
 * can't accidentally reintroduce them here.
 */
export function toClientListItem(row: ClientListRow): ClientListItem {
  return {
    id: row.id,
    name: row.name,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: row.raceEthnicity,
    householdId: row.householdId,
    isHeadOfHousehold: row.isHeadOfHousehold,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
