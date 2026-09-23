## ADDED Requirements

### Requirement: Client Captures HUD Universal Data Elements
The system SHALL model each client with the HUD Universal Data Elements — name, SSN, date of birth, sex, and race and ethnicity — as first-class fields on the `Client` entity.

#### Scenario: Client record exposes all HUD Universal Data Elements
- **WHEN** a client record is created
- **THEN** it has a name, SSN, date of birth, sex, and race-and-ethnicity value stored against it

### Requirement: Household Grouping With Single Head of Household
The system SHALL group clients into households via a shared household identifier, with exactly one client per household flagged as head of household.

#### Scenario: Household members share a household identifier
- **WHEN** two clients are created and assigned to the same household
- **THEN** both client records carry the same household identifier

#### Scenario: Exactly one head of household per household
- **WHEN** a client is created or updated with `isHeadOfHousehold` set to true for a household that already has a head of household
- **THEN** the system rejects the request rather than allowing two heads of household in the same household

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
The system SHALL provide a paginated client list endpoint supporting the filter set (all, male, female, with program, without program, with cases, without cases — single-select) combined with a free-text search term, returning only list-safe fields.

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

### Requirement: Client Detail Endpoint
The system SHALL provide an endpoint returning the full detail of a single client by id, including sensitive fields.

#### Scenario: Detail request returns full client record
- **WHEN** a client requests the detail endpoint for an existing client id
- **THEN** the response includes that client's full record, including SSN and date of birth

#### Scenario: Detail request for unknown id fails
- **WHEN** a client requests the detail endpoint for a client id that does not exist
- **THEN** the system returns an error response and no client data

### Requirement: Duplicate Check Blocks Silent Double-Create
The system SHALL check for existing clients matching on name, date of birth, and SSN before creating a new client, and SHALL NOT create a new client record when matching candidates exist unless the caller explicitly confirms creation should proceed.

#### Scenario: Duplicate check blocks a silent double-create
- **WHEN** a create-client request is submitted whose name, date of birth, and SSN match an existing client, without explicit confirmation to proceed
- **THEN** the system does not create a new client record and instead returns the matching existing candidate(s) in the response

#### Scenario: Explicit confirmation proceeds despite a match
- **WHEN** a create-client request matches existing candidates but explicitly confirms creation should proceed anyway
- **THEN** the system creates the new client record

#### Scenario: No match creates normally
- **WHEN** a create-client request matches no existing client on name, date of birth, and SSN
- **THEN** the system creates the new client record without requiring confirmation

### Requirement: Client Update Endpoint
The system SHALL provide an endpoint to update an existing client's fields, including disclosure fields, by id.

#### Scenario: Update modifies an existing client
- **WHEN** an update request is submitted for an existing client id with new field values
- **THEN** the client record reflects the updated values on subsequent reads

### Requirement: My Clients List Screen
The system SHALL provide a My Clients screen displaying clients in a table (name, masked SSN, date of birth, sex, race and ethnicity), with a single-select filter row (all, male, female, with program, without program, with cases, without cases), a user-controlled column-visibility control, and a new-intake entry point.

#### Scenario: SSN is masked in the client table
- **WHEN** the My Clients table renders a client row
- **THEN** the SSN column displays only the last 4 digits, not the full SSN

#### Scenario: Column visibility control hides a column
- **WHEN** a user deselects a column in the column-visibility control
- **THEN** that column no longer renders in the client table

#### Scenario: Filter row is single-select
- **WHEN** a user selects a different filter chip in the My Clients filter row
- **THEN** the previously active filter chip becomes inactive and only the newly selected filter applies

### Requirement: New Intake Form With Duplicate Confirmation
The system SHALL provide a New Intake form capturing the HUD Universal Data Elements, household assignment, and disclosure-field responses, which checks for duplicate candidates before creating a client and requires explicit user confirmation before proceeding when candidates are found.

#### Scenario: Intake form surfaces duplicate candidates
- **WHEN** a user submits the New Intake form with data matching an existing client
- **THEN** the form displays the matching candidate(s) and does not create a new client until the user explicitly confirms

#### Scenario: Intake form proceeds after confirmation
- **WHEN** a user confirms creation after being shown duplicate candidates
- **THEN** the form submits the create request with explicit confirmation and the new client is created
