# client-management

## Purpose

Client records for Housing360: HUD Universal Data Elements, household grouping, the disclosure-field pattern for sensitive data, and the endpoints and screens (My Clients list, New Intake) that create, list, and view clients. TBD: expand as case, assessment, and coordinated-entry linkage comes into scope.

## Requirements

### Requirement: Client Captures HUD Universal Data Elements
The system SHALL model each client with the HUD Universal Data Elements — name, SSN, date of birth, sex, and race and ethnicity — as first-class fields on the `Client` entity.

#### Scenario: Client record exposes all HUD Universal Data Elements
- **WHEN** a client record is created
- **THEN** it has a name, SSN, date of birth, sex, and race-and-ethnicity value stored against it

### Requirement: Household Grouping With Single Head of Household
The system SHALL group clients into households via a `Household` entity referenced by each member client's `householdId` foreign key, with the household's `headClientId` fixed at household-creation time and never reassignable afterward.

#### Scenario: Household members share a household reference
- **WHEN** two clients are created and assigned to the same household
- **THEN** both client records carry the same `householdId`, referencing one `Household` row

#### Scenario: Household creation fixes exactly one head of household
- **WHEN** a household is created for a given client
- **THEN** that client becomes the household's `headClientId`, and no request can create a second head for the same household

#### Scenario: Client update cannot change who is head of household
- **WHEN** a client update request attempts to change which client is head of an existing household
- **THEN** the system rejects the request; head of household can only be set at household creation

### Requirement: Disclosure Field Pattern for Sensitive Data
The system SHALL provide a reusable disclosure-field pattern for sensitive fields, where each such field stores either a real value or one of `client_doesnt_know`, `prefers_not_to_answer`, or `data_not_collected`. SSN and date of birth SHALL use this pattern; future sensitive fields (e.g. health status, domestic violence history) SHALL reuse the same pattern rather than introducing one-off representations.

#### Scenario: Disclosure field accepts a real value
- **WHEN** a disclosure-capable field is submitted with an actual value (e.g. a real SSN)
- **THEN** the field is stored with that value and a status indicating it was provided

#### Scenario: Disclosure field accepts "client doesn't know"
- **WHEN** a disclosure-capable field is submitted with status `client_doesnt_know`
- **THEN** the field is stored with no real value and that status, and no error occurs

#### Scenario: Disclosure field accepts "prefers not to answer"
- **WHEN** a disclosure-capable field is submitted with status `prefers_not_to_answer`
- **THEN** the field is stored with no real value and that status, and no error occurs

#### Scenario: Disclosure field accepts "data not collected"
- **WHEN** a disclosure-capable field is submitted with status `data_not_collected`
- **THEN** the field is stored with no real value and that status, and no error occurs

### Requirement: Sensitive Fields Excluded From List Responses
The system SHALL exclude SSN and date of birth from any list-of-clients response by default, returning them only from the single-client detail endpoint. The system SHALL NOT write SSN or date of birth values to application logs under any circumstance.

#### Scenario: SSN never appears in a list response payload
- **WHEN** a client requests the paginated client list endpoint
- **THEN** the response payload for each client omits the SSN field entirely (not merely masked)

#### Scenario: Date of birth omitted from list response
- **WHEN** a client requests the paginated client list endpoint
- **THEN** the response payload for each client omits the date-of-birth field entirely

#### Scenario: SSN and date of birth available in detail response
- **WHEN** a client requests the single-client detail endpoint for a specific client
- **THEN** the response includes that client's SSN and date-of-birth values

#### Scenario: SSN and date of birth never logged
- **WHEN** a request containing SSN or date-of-birth values is processed by the API (e.g. an intake or update request)
- **THEN** no application log entry contains the raw SSN or date-of-birth value

### Requirement: Paginated Client List With Filters and Search
The system SHALL provide a paginated client list endpoint supporting the filter set (all, male, female, with program, without program, with cases, without cases — single-select) combined with a free-text search term, returning only list-safe fields. The with-program/without-program and with-cases/without-cases filters SHALL reflect real `ProgramEnrollment`/`Case` data.

#### Scenario: Filters combine correctly with search
- **WHEN** a client list request includes both a filter (e.g. "female") and a search term matching a client's name
- **THEN** the response includes only clients matching both the filter and the search term

#### Scenario: Sex filter narrows results
- **WHEN** a client list request specifies the "male" or "female" filter
- **THEN** the response includes only clients whose sex matches that filter

#### Scenario: "All" filter returns unfiltered results
- **WHEN** a client list request specifies the "all" filter with no search term
- **THEN** the response includes all clients, subject only to pagination

#### Scenario: List response is paginated
- **WHEN** a client list request specifies a page and page size
- **THEN** the response includes at most that page size of clients, along with pagination metadata (e.g. total count)

#### Scenario: With-program filter returns only enrolled clients
- **WHEN** a client list request specifies the "withProgram" filter
- **THEN** the response includes only clients with at least one `ProgramEnrollment`

#### Scenario: Without-program filter returns only unenrolled clients
- **WHEN** a client list request specifies the "withoutProgram" filter
- **THEN** the response includes only clients with no `ProgramEnrollment`

### Requirement: Client Detail Endpoint
The system SHALL provide an endpoint returning the full detail of a single client by id, including sensitive fields.

#### Scenario: Detail request returns full client record
- **WHEN** a client requests the detail endpoint for an existing client id
- **THEN** the response includes that client's full record, including SSN and date of birth

#### Scenario: Detail request for unknown id fails
- **WHEN** a client requests the detail endpoint for a client id that does not exist
- **THEN** the system returns an error response and no client data

### Requirement: Duplicate Check Blocks Silent Double-Create
The system SHALL check for existing clients matching on name, date of birth, and SSN (via its deterministic hash) before creating a new client, and SHALL NOT create a new client record when matching candidates exist unless the caller explicitly sets `allowDuplicate: true`.

#### Scenario: Duplicate check blocks a silent double-create
- **WHEN** a create-client request is submitted whose name, date of birth, and SSN hash match an existing client, without `allowDuplicate: true`
- **THEN** the system does not create a new client record, returns HTTP 409, and includes the matching existing candidate(s) in the response

#### Scenario: Explicit confirmation proceeds despite a match
- **WHEN** a create-client request matches existing candidates and sets `allowDuplicate: true`
- **THEN** the system creates the new client record and returns HTTP 201

#### Scenario: No match creates normally
- **WHEN** a create-client request matches no existing client on name, date of birth, and SSN hash
- **THEN** the system creates the new client record without requiring `allowDuplicate`

### Requirement: Client Update Endpoint
The system SHALL provide an endpoint to update an existing client's fields, including disclosure fields, by id.

#### Scenario: Update modifies an existing client
- **WHEN** an update request is submitted for an existing client id with new field values
- **THEN** the client record reflects the updated values on subsequent reads

### Requirement: My Clients List Screen
The system SHALL provide a My Clients screen displaying clients in a paginated table (name, masked SSN, date of birth, sex, race and ethnicity, program status), with a single-select filter row (all, male, female, with program, without program, with cases, without cases) and a new-intake entry point.

#### Scenario: SSN is masked in the client table
- **WHEN** the My Clients table renders a client row
- **THEN** the SSN column displays only the last 4 digits, not the full SSN

#### Scenario: Table pagination reflects the active page
- **WHEN** the client list has more rows than fit on one page
- **THEN** the table shows pagination controls and only the current page's rows

#### Scenario: Filter row is single-select
- **WHEN** a user selects a different filter chip in the My Clients filter row
- **THEN** the previously active filter chip becomes inactive and only the newly selected filter applies

#### Scenario: Loading the client list uses the shared table loading state
- **WHEN** the My Clients screen is waiting on a client list request
- **THEN** the table renders the shared `DataTable` loading state, not a screen-specific spinner or placeholder

#### Scenario: A filter matching no clients uses the shared table empty state
- **WHEN** the active filter and search combination matches no clients
- **THEN** the table renders the shared `DataTable` empty state with a message reflecting that the filters matched nothing, not a screen-specific empty block

#### Scenario: Program status renders as a status badge
- **WHEN** the My Clients table renders a client row
- **THEN** a Program status column shows a `StatusBadge` reflecting that client's primary enrollment status, driven by a status-to-label/tone mapping rather than a hardcoded per-row color

### Requirement: Client Captures HUD Data Quality Codes
The system SHALL store a data-quality code (HUD 3.01 name, 3.02 SSN, 3.03 date of birth) alongside each of a client's name, SSN, and date of birth, independent of that field's disclosure status.

#### Scenario: Data-quality codes stored alongside name, SSN, and DOB
- **WHEN** a client is created or updated with name, SSN, and DOB data-quality codes
- **THEN** the client record stores all three codes independently of the disclosure status of SSN and DOB

### Requirement: Client Captures Veteran Status and Detail
The system SHALL store veteran status (HUD 3.07) on each client, and SHALL allow additional veteran detail fields (military branch, year entered service, discharge status, and war/theater era flags) to be stored when veteran status indicates the client is a veteran.

#### Scenario: Veteran details captured when veteran status is yes
- **WHEN** a client is created or updated with veteran status indicating "yes"
- **THEN** the client record can store military branch, year entered service, discharge status, and war/theater era flags

#### Scenario: Veteran details are optional when not a veteran
- **WHEN** a client's veteran status does not indicate "yes"
- **THEN** the client record does not require any veteran detail field to be populated

### Requirement: Race and Ethnicity Is Multi-Value
The system SHALL store race and ethnicity (HUD 3.04) as a set of one or more codes per client, including the codes for "client doesn't know" (8), "prefers not to answer" (9), and "data not collected" (99).

#### Scenario: Multiple race/ethnicity codes stored for one client
- **WHEN** a client is created with more than one race/ethnicity code selected
- **THEN** the client record stores all selected codes

#### Scenario: Withheld race/ethnicity uses the standard HUD codes
- **WHEN** a client's race/ethnicity is submitted as "client doesn't know", "prefers not to answer", or "data not collected"
- **THEN** the client record stores the corresponding HUD code (8, 9, or 99) rather than an empty value

### Requirement: SSN Stored Encrypted With Deterministic Hash and Last-Four Display
The system SHALL store a provided SSN as an encrypted value plus a separate deterministic hash used only for duplicate matching and a last-four-digits value used only for display, and SHALL NOT return the full SSN value in any list, search, or duplicate-candidate payload, nor write it to logs.

#### Scenario: SSN stored encrypted, not plaintext
- **WHEN** a client is created with a provided SSN
- **THEN** the stored record contains an encrypted SSN value, a duplicate-matching hash, and a last-four value — not a plaintext SSN column

#### Scenario: Search and candidate payloads show only masked SSN
- **WHEN** a client search or duplicate-candidate response includes a client with a provided SSN
- **THEN** the response includes only the last-four value, never the full SSN

#### Scenario: SSN detail retrieval decrypts for the single-client detail endpoint only
- **WHEN** the single-client detail endpoint is requested for a client with a provided SSN
- **THEN** the response includes the decrypted full SSN value

### Requirement: Client Captures Relationship to Head of Household
The system SHALL store a HUD 3.15 relationship-to-head-of-household code on every client that belongs to a household, distinct from whether that client is structurally the household's head.

#### Scenario: Relationship code stored independent of head status
- **WHEN** a non-head client is added to a household with a relationship-to-head-of-household code
- **THEN** the client record stores that code, and the household's head reference is unaffected

#### Scenario: Head client also carries a relationship code
- **WHEN** a household is created for a client
- **THEN** that client's relationship-to-head-of-household code is set to the HUD "self" code

### Requirement: Client Captures Additional Contact and Identification Fields
The system SHALL store an optional title, mobile phone number, and email address on each client.

#### Scenario: Optional contact fields can be stored
- **WHEN** a client is created or updated with a title, mobile number, and/or email address
- **THEN** the client record stores the supplied values

#### Scenario: Contact fields are optional
- **WHEN** a client is created without a title, mobile number, or email address
- **THEN** the client record is still created successfully
