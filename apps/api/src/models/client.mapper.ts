import { Prisma, DisclosureStatus as PrismaDisclosureStatus, Sex as PrismaSex } from '@prisma/client';
import type {
  Client,
  ClientListItem,
  ClientSearchResultItem,
  DisclosureField,
  DisclosureStatus,
  HouseholdMemberSummary,
  Sex,
  VeteranDetails,
} from '@housing360/types';
import { decryptSsn, encryptSsn, hashSsn, lastFour } from '../utils/ssn';
import type { ClientRow, ClientSearchRow, EnrichedClientListRow, HouseholdMemberRow } from './client.model';

// HUD 3.07 Veteran Status code for "Yes" (see `constants/hudOptions.ts`'s
// `YES_NO_DISCLOSURE` list) — gates whether veteran detail fields apply.
const VETERAN_STATUS_YES = '1';

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

/** `DisclosureField<string>` -> the flat `{ value, status }` Prisma columns. Still used for `dob`. */
export function disclosureFieldToColumns(
  field: DisclosureField<string>
): { value: string | null; status: PrismaDisclosureStatus } {
  return {
    // Only persist a real value when the status says it was actually provided.
    value: field.status === 'provided' ? field.value : null,
    status: disclosureStatusToPrisma(field.status),
  };
}

/** The flat Prisma `value`/`status` columns -> `DisclosureField<string>`. Still used for `dob`. */
function disclosureFieldFromColumns(
  value: string | null,
  status: PrismaDisclosureStatus
): DisclosureField<string> {
  return {
    status: disclosureStatusFromPrisma(status),
    value: status === 'PROVIDED' ? value : null,
  };
}

/**
 * `DisclosureField<string>` -> the encrypted-value + hash + last4 Prisma
 * columns that replaced the old single plaintext `ssn` column. Only
 * `encryptSsn`/`hashSsn`/`lastFour` ever see the raw value; when the status
 * isn't `'provided'`, all three columns are null (per design.md's SSN
 * decision).
 */
export function ssnFieldToColumns(field: DisclosureField<string>): {
  ssnEncrypted: string | null;
  ssnHash: string | null;
  ssnLast4: string | null;
  ssnDisclosure: PrismaDisclosureStatus;
} {
  if (field.status === 'provided' && field.value) {
    return {
      ssnEncrypted: encryptSsn(field.value),
      ssnHash: hashSsn(field.value),
      ssnLast4: lastFour(field.value),
      ssnDisclosure: 'PROVIDED',
    };
  }
  return {
    ssnEncrypted: null,
    ssnHash: null,
    ssnLast4: null,
    ssnDisclosure: disclosureStatusToPrisma(field.status),
  };
}

/** `raceEthnicity` is a Prisma `Json` column storing a plain array of HUD code strings. */
function raceEthnicityFromJson(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function toVeteranDetails(row: {
  veteranStatus: string | null;
  militaryBranch: string | null;
  yearEnteredService: number | null;
  dischargeStatus: string | null;
  ww2: boolean | null;
  koreanWar: boolean | null;
  vietnamWar: boolean | null;
  otherTheater: boolean | null;
}): VeteranDetails | null {
  if (row.veteranStatus !== VETERAN_STATUS_YES) {
    return null;
  }
  return {
    militaryBranch: row.militaryBranch,
    yearEnteredService: row.yearEnteredService,
    dischargeStatus: row.dischargeStatus,
    ww2: row.ww2,
    koreanWar: row.koreanWar,
    vietnamWar: row.vietnamWar,
    otherTheater: row.otherTheater,
  };
}

/**
 * Full mapper — includes SSN/DOB. Use only for detail/create/update
 * responses. Decrypts `ssnEncrypted` only when `ssnDisclosure === 'PROVIDED'`
 * and a value is actually present.
 */
export function toClient(row: ClientRow): Client {
  const ssnValue =
    row.ssnDisclosure === 'PROVIDED' && row.ssnEncrypted ? decryptSsn(row.ssnEncrypted) : null;

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    title: row.title,
    nameDataQuality: row.nameDataQuality,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: raceEthnicityFromJson(row.raceEthnicity),
    ssnDataQuality: row.ssnDataQuality,
    ssn: { status: disclosureStatusFromPrisma(row.ssnDisclosure), value: ssnValue },
    ssnLast4: row.ssnLast4,
    dobDataQuality: row.dobDataQuality,
    dob: disclosureFieldFromColumns(row.dob, row.dobDisclosure),
    mobile: row.mobile,
    email: row.email,
    veteranStatus: row.veteranStatus,
    veteranDetails: toVeteranDetails(row),
    householdId: row.householdId,
    relationshipToHoh: row.relationshipToHoh,
    isHeadOfHousehold: row.household?.headClientId === row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * List-safe mapper. `EnrichedClientListRow` comes from a Prisma `select` that
 * never includes `ssn*`/`dob` columns, so this function has no access to
 * those values to leak even by mistake — a future column rename can't
 * accidentally reintroduce them here. `isHeadOfHousehold`/
 * `primaryEnrollmentStatus` are read off the row, not computed here — see
 * `client.model.ts`'s `enrichListRows`.
 */
export function toClientListItem(row: EnrichedClientListRow): ClientListItem {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: raceEthnicityFromJson(row.raceEthnicity),
    householdId: row.householdId,
    isHeadOfHousehold: row.isHeadOfHousehold,
    relationshipToHoh: row.relationshipToHoh,
    primaryEnrollmentStatus: row.primaryEnrollmentStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Intake wizard's "Family Members" step already-saved-row mapper — same
 * masked-SSN, plain-DOB treatment as the search endpoint, plus `raceEthnicity`
 * since the table needs to display it.
 */
export function toHouseholdMemberSummary(row: HouseholdMemberRow): HouseholdMemberSummary {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    ssnLast4: row.ssnLast4,
    dob: row.dob,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: raceEthnicityFromJson(row.raceEthnicity),
    relationshipToHoh: row.relationshipToHoh,
    mobile: row.mobile,
    email: row.email,
  };
}

/**
 * `GET /api/clients/search` row mapper — a plain (non-disclosure) DOB and a
 * masked SSN (`ssnLast4` only), matching-target fields only.
 */
export function toClientSearchResultItem(row: ClientSearchRow): ClientSearchResultItem {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    dob: row.dob,
    ssnLast4: row.ssnLast4,
    relationshipToHoh: row.relationshipToHoh,
    sex: sexFromPrisma(row.sex),
    veteranStatus: row.veteranStatus,
  };
}
