import type { Client, Household } from '@housing360/types';
import { disclosureStatusFromPrisma, sexFromPrisma } from './client.mapper';
import type { ClientRow, HouseholdRow } from './household.model';

export function toHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    headClientId: row.headClientId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Maps a just-created family member row to the shared `Client` shape.
 * Deliberately never returns a decrypted SSN — only `ssnLast4` — matching
 * the "SSN never appears unmasked outside client detail" requirement; this
 * is a household-members-create response, not the client detail endpoint.
 */
export function toHouseholdMemberClient(row: ClientRow): Client {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    title: row.title,
    nameDataQuality: row.nameDataQuality,
    sex: sexFromPrisma(row.sex),
    raceEthnicity: Array.isArray(row.raceEthnicity) ? (row.raceEthnicity as string[]) : [],
    ssnDataQuality: row.ssnDataQuality,
    ssn: { status: disclosureStatusFromPrisma(row.ssnDisclosure), value: null },
    ssnLast4: row.ssnLast4,
    dobDataQuality: row.dobDataQuality,
    dob: {
      status: disclosureStatusFromPrisma(row.dobDisclosure),
      value: row.dobDisclosure === 'PROVIDED' ? row.dob : null,
    },
    mobile: row.mobile,
    email: row.email,
    veteranStatus: row.veteranStatus,
    veteranDetails: row.veteranStatus
      ? {
          militaryBranch: row.militaryBranch,
          yearEnteredService: row.yearEnteredService,
          dischargeStatus: row.dischargeStatus,
          ww2: row.ww2,
          koreanWar: row.koreanWar,
          vietnamWar: row.vietnamWar,
          otherTheater: row.otherTheater,
        }
      : null,
    householdId: row.householdId,
    relationshipToHoh: row.relationshipToHoh,
    // Bulk-created household members are never heads — heads are only set by
    // `POST /households`'s own transaction.
    isHeadOfHousehold: false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
