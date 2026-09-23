## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: New Intake Form With Duplicate Confirmation
**Reason**: The single-form New Intake is replaced by the `client-intake` capability's multi-step `IntakeWizard`, which covers client creation and duplicate confirmation as its first step within a larger household/enrollment/assessment flow.
**Migration**: See the `client-intake` capability's "Client Basic Information Step" and "Selecting an Existing Client Pre-Fills the Wizard" requirements for the replacement behavior.
