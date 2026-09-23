export type DisclosureStatus =
  | 'provided'
  | 'client_doesnt_know'
  | 'prefers_not_to_answer'
  | 'data_not_collected';

/**
 * Shared shape for any sensitive field that may be withheld rather than
 * answered. `value` is only populated when `status` is `'provided'`.
 */
export interface DisclosureField<T> {
  status: DisclosureStatus;
  value: T | null;
}

export type Sex = 'male' | 'female' | 'other';

export interface VeteranDetails {
  militaryBranch: string | null;
  yearEnteredService: number | null;
  dischargeStatus: string | null;
  ww2: boolean | null;
  koreanWar: boolean | null;
  vietnamWar: boolean | null;
  otherTheater: boolean | null;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  /** HUD 3.01 */
  nameDataQuality: string | null;
  sex: Sex;
  /** HUD 3.04 — one or more codes, including "8"/"9"/"99". */
  raceEthnicity: string[];
  /** HUD 3.02 */
  ssnDataQuality: string | null;
  ssn: DisclosureField<string>;
  ssnLast4: string | null;
  /** HUD 3.03 */
  dobDataQuality: string | null;
  dob: DisclosureField<string>;
  mobile: string | null;
  email: string | null;
  /** HUD 3.07 */
  veteranStatus: string | null;
  veteranDetails: VeteranDetails | null;
  householdId: string | null;
  /** HUD 3.15 — informational; NOT the source of truth for headship (see `isHeadOfHousehold`). */
  relationshipToHoh: string | null;
  /** Derived from `Household.headClientId`, not a stored column. */
  isHeadOfHousehold: boolean;
  createdAt: string;
  updatedAt: string;
}

/** List-endpoint shape — omits SSN/DOB entirely (not even masked). */
export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  raceEthnicity: string[];
  householdId: string | null;
  isHeadOfHousehold: boolean;
  relationshipToHoh: string | null;
  /** Drives the My Clients "Program status" `StatusBadge` column; null = no enrollment yet. */
  primaryEnrollmentStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /api/clients/search` row shape — distinct from `ClientListItem`: shows DOB and a masked SSN. */
export interface ClientSearchResultItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dob: string | null;
  ssnLast4: string | null;
  relationshipToHoh: string | null;
  sex: Sex;
  veteranStatus: string | null;
}

export type ClientFilter =
  | 'all'
  | 'male'
  | 'female'
  | 'withProgram'
  | 'withoutProgram'
  | 'withCases'
  | 'withoutCases';

export interface ClientListQuery {
  page?: number;
  pageSize?: number;
  filter?: ClientFilter;
  search?: string;
}

export interface ClientListResult {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientIntakeInput {
  firstName: string;
  lastName: string;
  title?: string;
  nameDataQuality?: string;
  sex: Sex;
  raceEthnicity: string[];
  ssnDataQuality?: string;
  ssn: DisclosureField<string>;
  dobDataQuality?: string;
  dob: DisclosureField<string>;
  mobile?: string;
  email?: string;
  veteranStatus?: string;
  veteranDetails?: Partial<VeteranDetails>;
  relationshipToHoh?: string;
  /** Set once the caller has reviewed duplicate candidates (HTTP 409) and wants to proceed anyway. */
  allowDuplicate?: boolean;
}

export type ClientUpdateInput = Partial<Omit<ClientIntakeInput, 'allowDuplicate'>>;

/** The `data` payload of a 409 duplicate-check response. */
export interface DuplicateClientCandidates {
  candidates: ClientListItem[];
}
