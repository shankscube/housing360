# home-dashboard

## Purpose

The Home screen's aggregate dashboard: a single `GET /api/dashboard/home` endpoint that composes the case manager's KPI tiles, Today's Tasks, Data Quality Alerts, Today's Appointments (real case follow-up milestones, backed by `task-management`), and Recently Accessed (real view/edit activity, backed by `activity-feed`) panels into one response, reusing each owning module's own counting logic rather than re-deriving it.

## Requirements

### Requirement: Aggregate Home dashboard endpoint
The system SHALL expose `GET /api/dashboard/home`, behind `requireAuth`, returning one response containing every Home screen tile and panel's data for the requesting case manager — the frontend SHALL NOT need to issue separate requests per tile or panel.

#### Scenario: Authenticated case manager loads Home
- **WHEN** an authenticated case manager requests `GET /api/dashboard/home`
- **THEN** the response includes `caseManagerFirstName`, all four `kpis` entries, `todaysTasks`, `dataQualityAlerts`, `todaysAppointments`, and `recentlyAccessed` in a single payload

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to `GET /api/dashboard/home` is made without a valid auth cookie
- **THEN** the system SHALL respond 401 via the standard `sendError` path, the same as any other route behind `requireAuth`

### Requirement: KPI tiles reuse each owning module's own counting logic
The four KPI tiles (Active Caseload, Open Referrals, Tasks Due Today, Assessments Due) SHALL be computed using the same query predicates the owning module (`case-management`, `coordinated-entry`/case-workspace referrals, `assessment-tracking`) already uses for the equivalent count elsewhere in the app, not a separately re-derived definition.

#### Scenario: Active Caseload matches the case manager's My Caseload cases
- **WHEN** the requesting case manager has cases assigned to them with `status = 'open'`
- **THEN** `kpis.activeCaseload.value` SHALL equal the count of distinct clients across exactly those cases — the same set `GET /api/cases?filter=myCaseload` returns for that case manager

#### Scenario: Open Referrals matches the open-referral status vocabulary
- **WHEN** `Referral` rows exist with `status` of `pending` or `new`
- **THEN** `kpis.openReferrals.value` SHALL equal the count of those rows, regardless of which flow (internal Referrals tab or Coordinated Entry's Send Referral step) created them

#### Scenario: Assessments Due matches the Assessment Command Center's overdue/due-today counts
- **WHEN** `Assessment` rows are overdue or due today per the same date-boundary rules `GET /api/assessments?filter=overdue|dueToday` uses
- **THEN** `kpis.assessmentsDue.value` SHALL equal the combined count of those rows

#### Scenario: Tasks Due Today is scoped to the requesting case manager
- **WHEN** the requesting case manager owns `Task` rows with `dueDate` falling today and `status` not `completed`
- **THEN** `kpis.tasksDueToday.value` SHALL equal the count of exactly those rows, excluding tasks owned by other case managers

### Requirement: KPI tiles handle zero counts as empty states, not errors
Every KPI tile and list panel SHALL render a valid zero/empty result when the requesting case manager (or the system as a whole, for org-wide tiles) has none of the underlying data — the endpoint SHALL NOT error, and the frontend SHALL NOT treat a zero count as a failure.

#### Scenario: Case manager with no assigned open cases
- **WHEN** the requesting case manager has zero `Case` rows with `status = 'open'` assigned to them
- **THEN** `GET /api/dashboard/home` SHALL respond 200 with `kpis.activeCaseload.value` equal to `0` and an appropriate zero-state `subLine`

#### Scenario: No open referrals exist anywhere
- **WHEN** zero `Referral` rows have `status` of `pending` or `new`
- **THEN** `kpis.openReferrals.value` SHALL be `0` and `todaysTasks`/`dataQualityAlerts` SHALL each independently still be evaluated on their own criteria (an empty referral set does not affect other panels)

#### Scenario: Case manager with no tasks due today
- **WHEN** the requesting case manager owns zero `Task` rows due today
- **THEN** `kpis.tasksDueToday.value` SHALL be `0` and `todaysTasks` SHALL be an empty array, not an error

#### Scenario: No clients exist yet
- **WHEN** zero `Client` rows exist in the system
- **THEN** `dataQualityAlerts` SHALL be an empty array and every KPI tile SHALL report `0`, all within a 200 response

#### Scenario: Brand-new case manager sees every panel's real empty state
- **WHEN** the requesting case manager has no caseload, no follow-ups, and no recorded activity yet
- **THEN** `todaysAppointments` and `recentlyAccessed` SHALL each be empty arrays, and the Home screen SHALL render each panel's own empty-state copy rather than a "not yet specified" placeholder

### Requirement: Data Quality Alerts panel is provisional demo data
The Data Quality Alerts panel SHALL be backed by a minimal `DataQualityIssue` read model (issue title, client reference, computed days-open) that stands in for a future real data-quality rule engine. This is not a rule engine — the system SHALL NOT derive these rows from any actual HUD data-completeness check.

#### Scenario: Provisional nature is documented at the code level
- **WHEN** a developer reads the service backing this panel (`dataQualityIssue.service.ts`)
- **THEN** it SHALL carry a header comment stating the rows are demo/provisional data standing in for a future real rule engine, not derived from real data-quality checks

#### Scenario: Demo rows only appear once real clients exist
- **WHEN** at least one `Client` row exists and no `DataQualityIssue` rows have been created yet
- **THEN** the system SHALL create a small set of demo `DataQualityIssue` rows, each referencing a real existing client, the next time `GET /api/dashboard/home` is requested

#### Scenario: Days-open is computed, not stored redundantly
- **WHEN** a `DataQualityIssue` row is read
- **THEN** its `daysOpen` value SHALL be computed at request time from its `openedAt` timestamp, not maintained as a separately-updated stored counter

### Requirement: Today's Tasks derives from the shared Task model
The Today's Tasks panel SHALL list the requesting case manager's own `Task` rows due today, each showing title, client/context line, due date, and an overdue flag — without introducing a new task-management data model.

#### Scenario: Overdue flag reflects an unmet due date
- **WHEN** a `Task` owned by the requesting case manager has `dueDate` earlier than today and `status` not `completed`
- **THEN** it SHALL appear in `todaysTasks` (or a related overdue grouping) with its overdue flag set to true

### Requirement: Home screen layout matches the design reference's panel composition
The Home screen SHALL render, top to bottom: a welcome band with the case manager's first name and the current date; a quick-actions row (New Intake, New Referral, New Case); a 4-tile KPI row; a two-column row of Today's Tasks and Data Quality Alerts; and a second two-column row of Today's Appointments and Recently Accessed.

#### Scenario: Quick actions reuse existing flows
- **WHEN** the case manager clicks "New Intake," "New Referral," or "New Case" on the Home screen
- **THEN** the same `IntakeWizard`, `NewReferralModal` (with no case pre-selected), and `NewCaseModal` components used elsewhere in the app SHALL open, with no Home-specific duplicate implementation, and closing any of them SHALL refresh the Home dashboard

#### Scenario: Today's Appointments renders real case follow-ups
- **WHEN** the Home screen loads for a case manager who manages at least one case with a follow-up due today
- **THEN** the Today's Appointments panel lists that case's number, client, and milestone (e.g. "30 Day follow-up"), and clicking it opens that case

#### Scenario: Today's Appointments empty state
- **WHEN** the requesting case manager manages no cases with a follow-up due today
- **THEN** the Today's Appointments panel shows "No follow-ups scheduled for today."

#### Scenario: A "Calendar" link opens the Calendar page
- **WHEN** the case manager clicks the "Calendar" link on the Today's Appointments panel
- **THEN** the Calendar page (`/calendar`) opens

#### Scenario: Recently Accessed renders real activity with a type icon
- **WHEN** the requesting case manager has viewed or edited at least one client, case, referral, or assessment
- **THEN** the Recently Accessed panel lists up to 5 of the newest such records, each with a type icon, newest first

#### Scenario: Recently Accessed empty state
- **WHEN** the requesting case manager has no recorded activity yet
- **THEN** the Recently Accessed panel shows "Nothing updated in your caseload yet."

### Requirement: KPI tiles navigate to their matching filtered list
Each of the four Home KPI tiles SHALL be clickable, navigating to the list screen and filter that produced its count.

#### Scenario: Active Caseload navigates to My Caseload
- **WHEN** the case manager clicks the Active Caseload tile
- **THEN** the system navigates to the Cases screen with the "My Caseload" filter already applied

#### Scenario: Open Referrals navigates to the Referrals route
- **WHEN** the case manager clicks the Open Referrals tile
- **THEN** the system navigates to the Referrals route (a stub screen until the Referrals phase ships)

#### Scenario: Tasks Due Today navigates to the Tasks page with that filter
- **WHEN** the case manager clicks the Tasks Due Today tile
- **THEN** the system navigates to the Tasks page (`/tasks`) with the "Due Today" filter already applied

#### Scenario: Assessments Due navigates to Assessments with a Due Today filter
- **WHEN** the case manager clicks the Assessments Due tile
- **THEN** the system navigates to the Assessment Command Center with its "Due Today" status filter already applied
