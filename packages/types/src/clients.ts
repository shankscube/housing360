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

export interface Client {
  id: string;
  name: string;
  sex: Sex;
  raceEthnicity: string;
  ssn: DisclosureField<string>;
  dob: DisclosureField<string>;
  householdId: string;
  isHeadOfHousehold: boolean;
  createdAt: string;
  updatedAt: string;
}

/** List-endpoint shape — omits the disclosure fields (SSN, DOB) entirely. */
export type ClientListItem = Omit<Client, 'ssn' | 'dob'>;

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
  name: string;
  sex: Sex;
  raceEthnicity: string;
  ssn: DisclosureField<string>;
  dob: DisclosureField<string>;
  /** Omit to start a new household (server generates the id); supply to join an existing one. */
  householdId?: string;
  isHeadOfHousehold: boolean;
  /** Set once the caller has reviewed duplicate candidates and wants to proceed anyway. */
  confirmDuplicate?: boolean;
}

export type ClientUpdateInput = Partial<Omit<ClientIntakeInput, 'confirmDuplicate'>>;

export type CreateClientResult =
  | { status: 'duplicates_found'; candidates: ClientListItem[] }
  | { status: 'created'; client: Client };
