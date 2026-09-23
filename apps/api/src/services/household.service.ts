import type { AddHouseholdMembersInput, Client, FamilyMemberInput, Household } from '@housing360/types';
import { disclosureFieldToColumns, disclosureStatusToPrisma, sexToPrisma } from '../models/client.mapper';
import {
  createHouseholdForClient,
  createHouseholdMembers,
  findHouseholdById,
  type HouseholdMemberCreateData,
} from '../models/household.model';
import { toHousehold, toHouseholdMemberClient } from '../models/household.mapper';
import { encryptSsn, hashSsn, lastFour } from '../utils/ssn';
import { AppError } from '../utils/AppError';

export async function createHousehold(clientId: string): Promise<Household> {
  const result = await createHouseholdForClient(clientId);

  if (result.status === 'client_not_found') {
    throw new AppError(404, 'Client not found');
  }
  if (result.status === 'already_in_household') {
    throw new AppError(409, 'Client already belongs to a household');
  }

  return toHousehold(result.household);
}

/**
 * SSN gets its own mapping (unlike `dob`, which reuses
 * `client.mapper.ts`'s `disclosureFieldToColumns` directly) because the new
 * `Client` schema replaced the single plaintext `ssn` column with
 * `ssnEncrypted`/`ssnHash`/`ssnLast4` — see design.md's SSN decision and
 * `utils/ssn.ts`.
 */
function ssnFieldToColumns(field: FamilyMemberInput['ssn']): Pick<
  HouseholdMemberCreateData,
  'ssnEncrypted' | 'ssnHash' | 'ssnLast4' | 'ssnDisclosure'
> {
  if (field.status === 'provided' && field.value) {
    return {
      ssnEncrypted: encryptSsn(field.value),
      ssnHash: hashSsn(field.value),
      ssnLast4: lastFour(field.value),
      ssnDisclosure: disclosureStatusToPrisma(field.status),
    };
  }
  return {
    ssnEncrypted: null,
    ssnHash: null,
    ssnLast4: null,
    ssnDisclosure: disclosureStatusToPrisma(field.status),
  };
}

function toMemberCreateData(householdId: string, member: FamilyMemberInput): HouseholdMemberCreateData {
  const dobColumns = disclosureFieldToColumns(member.dob);
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    sex: sexToPrisma(member.sex),
    raceEthnicity: member.raceEthnicity,
    dob: dobColumns.value,
    dobDisclosure: dobColumns.status,
    ...ssnFieldToColumns(member.ssn),
    mobile: member.mobile ?? null,
    email: member.email ?? null,
    relationshipToHoh: member.relationshipToHoh,
    householdId,
  };
}

export async function addHouseholdMembers(
  householdId: string,
  input: AddHouseholdMembersInput
): Promise<Client[]> {
  const household = await findHouseholdById(householdId);
  if (!household) {
    throw new AppError(404, 'Household not found');
  }

  const createData = input.members.map((member) => toMemberCreateData(householdId, member));
  const rows = await createHouseholdMembers(createData);
  return rows.map(toHouseholdMemberClient);
}
