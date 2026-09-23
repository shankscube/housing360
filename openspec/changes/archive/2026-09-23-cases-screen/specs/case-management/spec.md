## ADDED Requirements

### Requirement: Case Entity Carries Case-Manager-Facing Fields
The system SHALL extend the `Case` entity (already created by `cases/ensure` during client intake) with a generated unique case number, a free-text subject, a status, a priority, a last-contact date, and an assigned case manager reference, without altering `cases/ensure`'s one-case-per-client-and-enrollment guarantee.

#### Scenario: Case number is generated and unique
- **WHEN** a case is created
- **THEN** it is assigned a case number that no other case record shares, and the case number cannot be supplied by the request

#### Scenario: cases/ensure is unaffected by the new fields
- **WHEN** `cases/ensure` is called for a client-and-enrollment pair that already has a case
- **THEN** no second `Case` record is created, and the existing case's case number, subject, priority, last-contact date, and assigned case manager are left unchanged

### Requirement: Paginated Case List With Filters and Search
The system SHALL provide a paginated case list endpoint supporting the filter set (All Cases, My Caseload, High Risk, Due Today, Overdue, Recently Updated) as a single-select value — mirroring the `client-management` list endpoint's own filter/search contract and the shared `FilterChipRow` component's single-active-chip behavior — combinable with a free-text search term, returning list-safe fields plus enough client/subject/status/priority/last-contact/case-manager data to render the Case Operations Center table.

#### Scenario: Filters combine correctly with search
- **WHEN** a case list request includes both a filter (e.g. "High Risk") and a search term matching a client or case subject
- **THEN** the response includes only cases matching both the filter and the search term

#### Scenario: "All Cases" filter returns unfiltered results
- **WHEN** a case list request specifies no filter (or "All Cases")
- **THEN** the response includes all cases, subject only to pagination

#### Scenario: "My Caseload" filter narrows to the requesting case manager
- **WHEN** a case list request specifies the "My Caseload" filter
- **THEN** the response includes only cases whose assigned case manager is the requesting user

#### Scenario: "High Risk" filter narrows by priority
- **WHEN** a case list request specifies the "High Risk" filter
- **THEN** the response includes only cases whose priority indicates high risk

#### Scenario: "Due Today" and "Overdue" filters narrow by last-contact recency
- **WHEN** a case list request specifies "Due Today" or "Overdue"
- **THEN** the response includes only cases whose next-contact expectation (derived from last-contact date) falls due today, or has already passed, respectively

#### Scenario: List response is paginated
- **WHEN** a case list request specifies a page and page size
- **THEN** the response includes at most that page size of cases, along with pagination metadata

### Requirement: Case List KPI Counts
The system SHALL provide counts for Active Cases, High Risk, Due Today, and Closed Cases reflecting the same underlying case data the list endpoint filters against.

#### Scenario: KPI counts reflect current case data
- **WHEN** the Case Operations Center page loads
- **THEN** each KPI tile shows a count consistent with what its corresponding filter would return if applied to the full case set

### Requirement: Case Detail Endpoint Reports Per-Tab Content Readiness
The system SHALL provide a case detail endpoint returning full Overview fields plus, for each of the 7 detail tabs (Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness, and Overview itself), whether that tab has real content backing it.

#### Scenario: Detail request returns Overview fields
- **WHEN** a case manager requests the detail endpoint for an existing case id
- **THEN** the response includes that case's number, client reference, subject, status, priority, last-contact date, and assigned case manager

#### Scenario: Detail request reports which tabs have real content
- **WHEN** a case manager requests the detail endpoint for an existing case id
- **THEN** the response indicates, per tab, whether real content exists (e.g. Assessments reports true only if an Entry Assessment exists for that case's enrollment; Plan, Services, Referrals, and Health and Wellness report false, since no change has added their data model yet)

### Requirement: Case Create and Update Endpoints
The system SHALL provide endpoints to create a case directly (independent of `cases/ensure`) and to update an existing case's subject, status, priority, last-contact date, and assigned case manager.

#### Scenario: A case is created directly
- **WHEN** a case manager submits a new case with a client reference and subject
- **THEN** a new `Case` record is created with a generated case number and default status

#### Scenario: A case is updated
- **WHEN** a case manager submits an update to an existing case's status, priority, last-contact date, or assigned case manager
- **THEN** the case record reflects the updated values and its case number and client reference remain unchanged

### Requirement: HUD Data Readiness Checklist
The system SHALL provide an endpoint returning, for a given case, an ordered checklist of HUD-required data points, each marked pass or fail based on the case's current client/enrollment/assessment data, computed at request time rather than stored.

#### Scenario: Checklist reflects current data
- **WHEN** a case manager requests the HUD Data checklist for a case whose linked assessment has some but not all HUD-required fields recorded
- **THEN** the response marks the recorded data points as pass and the missing ones as fail

#### Scenario: Checklist updates without a separate save step
- **WHEN** the underlying client/enrollment/assessment data for a case changes (e.g. via the intake wizard)
- **THEN** a subsequent request to the checklist endpoint reflects the change with no action needed on the case record itself

### Requirement: HUD Data Tab Satisfied-Item Toggle
The Case Operations Center's case detail HUD Data tab SHALL render a toggle that shows or hides checklist items already marked pass, without re-fetching the checklist.

#### Scenario: Toggle hides satisfied items
- **WHEN** a case manager switches the toggle to hide satisfied items
- **THEN** only fail items remain visible in the checklist

#### Scenario: Toggle shows satisfied items again
- **WHEN** a case manager switches the toggle back to show satisfied items
- **THEN** both pass and fail items are visible in the checklist

### Requirement: HUD Data Tab Disclosure Line Is Configuration-Driven
The HUD Data tab SHALL render a fixed disclosure line sourced from a single named configuration value, never hardcoded inline in a component, so its wording can change without a component code change. The exact wording is not decided by this change.

#### Scenario: Disclosure line renders from config
- **WHEN** the HUD Data tab is rendered
- **THEN** the disclosure line's text matches the current value of the single configuration constant, and no other copy of that text exists inline in the component

### Requirement: Case Detail Tab Structure Covers All 7 Tabs
The case detail page SHALL render all 7 tabs (Overview, Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness) as real, selectable tab panels regardless of whether each has real content.

#### Scenario: A tab with no content yet renders a labeled empty state
- **WHEN** a case manager selects one of Plan, Services, Referrals, or Health and Wellness (a tab with no backing data model in this change)
- **THEN** that tab's panel renders a clearly labeled "not yet built" state, with no fabricated or placeholder data and no error

#### Scenario: Every tab is selectable without erroring
- **WHEN** a case manager selects each of the 7 tabs in turn
- **THEN** each renders its panel (real content or labeled empty state) without a rendering error, regardless of order selected

#### Scenario: Assessments tab reports real content when an assessment exists
- **WHEN** a case manager selects the Assessments tab for a case whose enrollment already has an Entry Assessment recorded (via the intake wizard)
- **THEN** the tab indicates real content exists, distinct from the labeled "not yet built" state shown for tabs with no data model at all
