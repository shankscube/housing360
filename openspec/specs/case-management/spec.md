# case-management

## Purpose

Case-manager-facing case tracking built on top of the `Case` records created during client intake (`cases/ensure`): the Case Operations Center list/filter/search/KPI screen, the 7-tab case detail view, and the HUD Data readiness checklist. TBD: expand as future changes add real content to the Plan, Services, Referrals, and Health and Wellness tabs.

## Requirements

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
- **THEN** the response includes that case's number, client reference, subject, description, status, priority, stage, origin, referral reference, assigned case manager, opened date, next HMIS review due date, HMIS data quality status, follow-up milestone and due date, and created/updated-by attribution

#### Scenario: Detail request reports which tabs have real content
- **WHEN** a case manager requests the detail endpoint for an existing case id
- **THEN** the response indicates, per tab, whether real content exists — Plan reports true when the case has at least one care plan, Services reports true when the client's enrollments have at least one assigned service, Referrals reports true when at least one referral references the case, Health and Wellness reports true when the client has clinical data or an active release of information, and Assessments reports true only if an Entry Assessment exists for that case's enrollment

### Requirement: Case Create and Update Endpoints
The system SHALL provide endpoints to create a case directly (independent of `cases/ensure`), requiring a Subject, and to update an existing case's subject, description, status, priority, stage, origin, escalated flag, contact, last-contact date, referral, assigned case manager, HMIS data quality status, and next HMIS review due date.

#### Scenario: A case is created directly
- **WHEN** a case manager submits a new case with a client reference and subject
- **THEN** a new `Case` record is created with a generated case number, default status, `openedDate` defaulted to the current date, and the creating user recorded as `createdById`

#### Scenario: A case without a subject is rejected
- **WHEN** a case manager submits a new case with no subject
- **THEN** the request is rejected and no `Case` record is created

#### Scenario: A case is updated
- **WHEN** a case manager submits an update to an existing case's subject, description, status, priority, stage, origin, escalated flag, contact, last-contact date, referral, assigned case manager, HMIS data quality status, or next HMIS review due date
- **THEN** the case record reflects the updated values, its case number and client reference remain unchanged, and the updating user is recorded as `updatedById`

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
The case detail page SHALL render all 7 tabs (Overview, Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness) as real, selectable tab panels, each rendering its real content when data exists and a labeled empty state — never an error and never fabricated data — when it does not.

#### Scenario: A tab with no related data renders a labeled empty state
- **WHEN** a case manager selects a tab (Plan, Services, Referrals, or Health and Wellness) for a case with no related data yet
- **THEN** that tab's panel renders a clearly labeled empty state specific to that tab, with no fabricated or placeholder data and no error

#### Scenario: Every tab is selectable without erroring
- **WHEN** a case manager selects each of the 7 tabs in turn
- **THEN** each renders its panel (real content or labeled empty state) without a rendering error, regardless of order selected

#### Scenario: Assessments tab reports real content when an assessment exists
- **WHEN** a case manager selects the Assessments tab for a case whose enrollment already has an Entry Assessment recorded (via the intake wizard)
- **THEN** the tab indicates real content exists, distinct from the labeled empty state shown when no assessment exists

### Requirement: New Case Modal Captures Full Case Context
The system SHALL provide a "New Case" modal on the Case Operations Center capturing Subject (required), Description, Client (via search), Case Manager, Referral, Opened Date, Status, Priority, Origin, Escalated, and Contact, and SHALL show a confirmation on success and a validation message on failure without closing the modal.

#### Scenario: Successful creation confirms and refreshes the list
- **WHEN** a case manager submits the New Case modal with a valid client and subject
- **THEN** the case is created, a success confirmation is shown, the modal closes, and the Case Operations Center list includes the new case

#### Scenario: Failed creation keeps the modal open
- **WHEN** a case manager submits the New Case modal without a required field
- **THEN** a failure message is shown, the modal remains open, and no `Case` record is created

### Requirement: Active Cases KPI Shows a Trend
The Case Operations Center's Active Cases KPI tile SHALL show the percentage change in active-case count versus the prior calendar month, with a directional indicator.

#### Scenario: Trend reflects month-over-month change
- **WHEN** the Case Operations Center loads
- **THEN** the Active Cases tile shows the percentage difference between the current active-case count and last month's, with an upward or downward indicator matching the sign of the change

### Requirement: Case Detail Header Displays Full Case Context
The case detail page SHALL render a header showing the case subject and client name as the title, the case number, and the client (linked to the client record), status, referral, priority, stage, and origin, with an Edit action and a Back action that returns to the Case Operations Center with its prior filter and search preserved.

#### Scenario: Header renders all summary fields
- **WHEN** a case manager opens a case's detail page
- **THEN** the header shows "<Subject> — <Client>", the case number, and the client, status, referral, priority, stage, and origin values

#### Scenario: Back preserves prior list state
- **WHEN** a case manager navigates from a filtered, searched Case Operations Center list into a case's detail page and then clicks Back
- **THEN** the Case Operations Center re-renders with the same filter and search term active

#### Scenario: Edit opens a pre-filled form
- **WHEN** a case manager clicks Edit on the case detail header
- **THEN** an edit form opens pre-filled with the case's subject, status, priority, stage, origin, HMIS data quality status, next HMIS review due date, case manager, and description

### Requirement: Follow-Up Reminder Control
The Overview tab SHALL provide a Follow-Up Reminder control offering No follow-up, 30 Day, 60 Day, and 90 Day options, writing the selected milestone and a computed due date to the case when "Set Reminder" is confirmed.

#### Scenario: Setting a 60 Day follow-up stores a due date 60 days out
- **WHEN** a case manager selects "60 Day" and confirms "Set Reminder"
- **THEN** the case's follow-up milestone is stored as 60 Day and its follow-up due date is stored as 60 days from the moment the reminder was set

#### Scenario: No follow-up clears the reminder
- **WHEN** a case manager selects "No follow-up" and confirms
- **THEN** the case's follow-up milestone is cleared and its follow-up due date is cleared

### Requirement: Overview Tab Interaction Summaries
The Overview tab SHALL provide a searchable list of the case's interaction summaries with a "New" action, and SHALL show a "Don't forget!" nudge when the case has none.

#### Scenario: Empty list shows the nudge
- **WHEN** a case manager opens the Overview tab for a case with no interaction summaries
- **THEN** a "Don't forget!" nudge is shown alongside the empty list

#### Scenario: Search narrows the list
- **WHEN** a case manager enters a search term in the Interaction Summaries card
- **THEN** only interaction summaries matching the term remain visible

### Requirement: Interaction Summary Create and Edit Form
The system SHALL provide one form, used for both creating and editing an interaction summary, capturing Title, Status, Interaction Purpose, Confidentiality Type, Meeting Notes, Next Steps, and Partner Account, with an optional "Create a Task" block capturing Title, Due Date, Assigned To, and an option to use Next Steps as the task description.

#### Scenario: Creating a task from Next Steps
- **WHEN** a case manager saves an interaction summary with "Create a Task" and "Use Next Steps as the task description" both checked
- **THEN** exactly one `Task` record is created, linked to the interaction summary, whose description equals the interaction summary's Next Steps text

#### Scenario: Creating a task without using Next Steps
- **WHEN** a case manager saves an interaction summary with "Create a Task" checked, "Use Next Steps as the task description" unchecked, and a task description entered
- **THEN** the created task's description equals the entered task description, not the Next Steps text

#### Scenario: Saving without the task block creates no task
- **WHEN** a case manager saves an interaction summary with "Create a Task" unchecked
- **THEN** no `Task` record is created

### Requirement: Interaction Summary Detail View
The system SHALL provide a detail view for a single interaction summary showing its recorded information, additional details, and an Upcoming & Overdue activity list of its linked tasks with a "New Task" action.

#### Scenario: Detail view lists linked tasks
- **WHEN** a case manager opens an interaction summary that has linked tasks
- **THEN** the detail view's activity list shows each linked task with its due date and status

### Requirement: Overview Tab Tasks Card
The Overview tab SHALL provide a Tasks card listing the case's tasks with a "New Task" action capturing Subject (required), Status, Priority, Due Date, and Description.

#### Scenario: A task without a subject is rejected
- **WHEN** a case manager attempts to save a new task with no Subject
- **THEN** the task is not created and a message indicating a subject is required is shown

#### Scenario: A valid task is created and listed
- **WHEN** a case manager saves a new task with a Subject
- **THEN** the task is created, linked to the case and client, and appears in the Tasks card

### Requirement: Overview Tab System Information
The Overview tab SHALL display who created and last modified the case and when.

#### Scenario: System Information reflects creation and last update
- **WHEN** a case manager opens the Overview tab
- **THEN** the System Information section shows the case's creation date and creator, and its last-modified date and modifier

### Requirement: HUD Data Tab Terminal States
The HUD Data tab SHALL render an "All clear" state when every checklist item passes, an empty-filter message when the satisfied-items toggle hides every remaining item, and a no-rules state when the checklist has no applicable items.

#### Scenario: All items passing shows the all-clear state
- **WHEN** every item in the HUD Data checklist for a case passes
- **THEN** the tab renders the "All clear" state instead of a checklist row list

#### Scenario: Hiding satisfied items with nothing left shows the empty-filter message
- **WHEN** a case manager hides satisfied items and every remaining item was already satisfied
- **THEN** the tab shows a message that nothing matches the current filter and suggests toggling the filter off

#### Scenario: No applicable checklist rules shows the no-rules state
- **WHEN** the HUD Data checklist has no applicable items for a case
- **THEN** the tab renders a distinct no-rules state, not an empty list and not an error

### Requirement: Referrals Tab Lists and Manages Case Referrals
The Referrals tab SHALL list the case's referrals with category, outcome, client, provider, and referrer contacts, and case manager comments, and SHALL provide New Referral, Edit, Accept, and Decline actions.

#### Scenario: New Referral requires Title and Client
- **WHEN** a case manager submits the New Referral form without a Title or without a Client
- **THEN** the referral is not created

#### Scenario: Declining a referral stores a reason and notes
- **WHEN** a case manager declines a referral with a reason and optional notes
- **THEN** the referral's status becomes declined and its reason and notes are stored

#### Scenario: Decline defaults to a standard reason
- **WHEN** a case manager opens the Decline form without changing the reason
- **THEN** the reason defaults to "Client declined services"

#### Scenario: Accepting a referral updates its status
- **WHEN** a case manager accepts a referral
- **THEN** the referral's status becomes accepted

### Requirement: Health and Wellness Tab Shows Clinical Summary, ROI Status, and Recent Visits
The Health and Wellness tab SHALL show a clinical summary (last visit, next scheduled appointment, open follow-ups), the client's release-of-information status with a "Create Release of Information" action, and a list of recent clinical visits, sourced through an EHR adapter interface that never names the underlying vendor in the UI.

#### Scenario: No clinical data shows a labeled empty state
- **WHEN** a case manager opens the Health and Wellness tab for a client with no clinical data on file
- **THEN** the tab shows "No clinical data on file for this client yet." and no vendor name appears anywhere on the tab

#### Scenario: ROI status reflects active consent
- **WHEN** a case manager opens the Health and Wellness tab for a client with an active, unrevoked, unexpired release of information
- **THEN** the tab shows that consent is active

### Requirement: Assessments Tab Lists Assessments Per Enrollment
The Assessments tab SHALL provide an enrollment picker and, for the selected enrollment, list its assessments with stage, date, status, and score, offering Resume Draft and Discard on draft assessments and a Recommended Care Plans strip.

#### Scenario: Selecting an enrollment lists its assessments
- **WHEN** a case manager selects an enrollment in the Assessments tab
- **THEN** the tab lists that enrollment's assessments with their stage, date, status, and score

#### Scenario: Resume and New route to a placeholder, not a broken link
- **WHEN** a case manager clicks Resume Draft or starts a new assessment
- **THEN** the case manager is taken to a labeled placeholder screen, not an error or a dead link

#### Scenario: Recommended Care Plans strip offers Create from Template
- **WHEN** the Assessments tab has at least one recommended care plan template for the client
- **THEN** a "Create from Template" action opens the Care Plan wizard pre-filled with that template
