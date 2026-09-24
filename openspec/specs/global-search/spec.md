# global-search

## Purpose

The top bar's cross-entity search: a single `GET /api/search?q=` endpoint grouping matches across Clients, Cases, Referrals, Tasks, and Assessments, and the debounced dropdown UI that renders them.

## Requirements

### Requirement: Minimum query length gate
The system SHALL require at least 2 characters before running a search, both on the frontend (no request is issued) and on the backend (a shorter query is rejected rather than silently executed).

#### Scenario: Frontend does not call the API below the threshold
- **WHEN** the case manager types a single character into the top bar search field
- **THEN** the frontend SHALL NOT issue a `GET /api/search` request

#### Scenario: Backend rejects a too-short query defensively
- **WHEN** `GET /api/search?q=a` is requested directly
- **THEN** the system SHALL respond with a 400 error via the standard `sendError` path, not run any query

### Requirement: Cross-entity results, grouped and capped
The system SHALL search Clients, Cases, Referrals, Tasks, and Assessments in parallel, returning at most 5 hits per group, each hit carrying `type`, `id`, `title`, `subtitle`, and an icon key matching the record's nav/type icon.

#### Scenario: A query matching multiple entity types returns multiple groups
- **WHEN** a 3+ character query matches at least one Client and at least one Case
- **THEN** the response includes both a Clients group and a Cases group, each independently capped at 5 results

#### Scenario: A group with no matches is omitted or empty, never an error
- **WHEN** a query matches Clients but no Referrals
- **THEN** the response's Referrals group is empty (or absent) and the request still succeeds

#### Scenario: Dropdown renders "Searching…" then results or "No matches found."
- **WHEN** the case manager types a qualifying query
- **THEN** the dropdown SHALL show a "Searching…" state while the request is in flight, then either the grouped results or "No matches found." if every group is empty

### Requirement: Client results never expose SSN, masked or otherwise
The system SHALL match Client results only against name fields (never `ssn`/`ssnHash`/`ssnEncrypted`) and SHALL NOT include any SSN representation — masked or plain — in a Client search result.

#### Scenario: Searching a valid SSN by digits returns no SSN-based match
- **WHEN** the case manager types digits corresponding to a client's SSN into the search field
- **THEN** the system SHALL NOT match that client on the SSN value (a match only occurs if those digits happen to also match a name or other searched field)

#### Scenario: A matched client's result carries no SSN field
- **WHEN** a Client result is returned
- **THEN** its `subtitle` and every other field SHALL contain no SSN value, masked or plain

### Requirement: Results are limited to what the requesting case manager can see
The system SHALL apply the same visibility scoping to search results that each entity's own list/detail screen already applies, and SHALL NOT surface a record through search that the requesting user could not otherwise see or open.

#### Scenario: Results reflect existing per-entity visibility, not a separate rule
- **WHEN** a search result of any type is returned
- **THEN** the requesting case manager SHALL be able to open that same record from its owning screen without a separate permission error

### Requirement: Keyboard navigation and dismissal
The dropdown SHALL support arrow-key navigation between results and Enter to open the highlighted one, and SHALL close on blur and on Escape.

#### Scenario: Arrow keys move the highlighted result
- **WHEN** the dropdown is open with results and the case manager presses the down arrow
- **THEN** the next result in the list becomes highlighted

#### Scenario: Escape closes the dropdown
- **WHEN** the dropdown is open and the case manager presses Escape
- **THEN** the dropdown closes without navigating

#### Scenario: Clicking a result navigates to its record
- **WHEN** the case manager clicks (or presses Enter on) a highlighted result
- **THEN** the system SHALL navigate to that record's screen (a client's My Clients context, a case's detail page, a referral's owning case, a task's detail, or an assessment's detail)
