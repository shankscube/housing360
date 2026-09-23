import type { DisclosureField, Sex } from './clients';

export interface Household {
  id: string;
  headClientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHouseholdInput {
  clientId: string;
}

export interface FamilyMemberInput {
  firstName: string;
  lastName: string;
  ssn: DisclosureField<string>;
  dob: DisclosureField<string>;
  sex: Sex;
  raceEthnicity: string[];
  relationshipToHoh: string;
  mobile?: string;
  email?: string;
}

export interface AddHouseholdMembersInput {
  members: FamilyMemberInput[];
}
