# task-management

## Purpose

A real Task list/detail/edit surface over the existing `Task` table (previously only ever read by Home/Overview-tab panels), plus the Calendar page's read over `Case` follow-up milestones — the app's two "things due on a date" surfaces.

## ADDED Requirements

### Requirement: Filtered, searchable, paginated task list
The system SHALL expose `GET /api/tasks?filter=all|due_today|overdue|upcoming&search=&page=`, filtering by subject or owner name, single-select filter combined with search (never with a second filter), paginated, behind `requireAuth`.

#### Scenario: "Due Today" filter narrows to today's due date
- **WHEN** the task list is requested with `filter=due_today`
- **THEN** the response includes only tasks whose `dueDate` falls today and whose `status` is not `completed`

#### Scenario: "Overdue" filter narrows to a past due date
- **WHEN** the task list is requested with `filter=overdue`
- **THEN** the response includes only tasks whose `dueDate` is before today and whose `status` is not `completed`

#### Scenario: "Upcoming" filter narrows to a future due date
- **WHEN** the task list is requested with `filter=upcoming`
- **THEN** the response includes only tasks whose `dueDate` is after today

#### Scenario: Search combines with the active filter
- **WHEN** the task list is requested with both `filter=overdue` and a search term matching a task's subject
- **THEN** the response includes only overdue tasks whose subject matches the search term

#### Scenario: No tasks match renders an empty state, not an error
- **WHEN** a task list request matches zero tasks
- **THEN** the response succeeds with an empty list and the Tasks page shows "No tasks found."

### Requirement: Task detail and edit
The system SHALL expose `GET /api/tasks/:id` and `PATCH /api/tasks/:id`, allowing a task's subject, status, priority, due date, and description to be edited from its detail view.

#### Scenario: Task detail includes everything the detail view renders
- **WHEN** `GET /api/tasks/:id` is requested
- **THEN** the response includes subject, status, priority, subtype, due date, owner, client, created/last-modified timestamps, and description

#### Scenario: Editing a task persists the change
- **WHEN** `PATCH /api/tasks/:id` is called with an updated due date
- **THEN** the task's due date is updated and reflected on a subsequent `GET /api/tasks/:id`

### Requirement: Tasks page renders the filtered list and opens a detail view
The Tasks page (`/tasks`) SHALL show filter chips (All Tasks, Due Today, Overdue, Upcoming), a search box, a columned table (Priority, Subject, Owner, Status, Due Date), pagination, and clicking a row SHALL open that task's detail (Subject, Status, Priority, Task Subtype, Due Date, Owner, Client, Created, Last Modified, Description) with Edit, Cancel, and Save actions.

#### Scenario: Clicking a row opens its detail view
- **WHEN** the case manager clicks a task row on the Tasks page
- **THEN** the task's detail view opens, matching the header "Tasks — Click a task to open the activity."

#### Scenario: Edit / Cancel / Save round-trip
- **WHEN** the case manager clicks Edit, changes a field, and clicks Save
- **THEN** the change is persisted via `PATCH /api/tasks/:id` and the detail view reflects it; clicking Cancel instead discards the in-progress edit

### Requirement: Appointments are follow-up milestones, not a new data model
The system SHALL expose `GET /api/appointments?from=&to=`, returning case follow-up milestones (`Case.followUpMilestone`/`followUpDueDate`) whose due date falls within the requested range, each with case number, client name, and milestone label — without introducing a dedicated appointment table.

#### Scenario: A case's follow-up appears as an appointment on its due date
- **WHEN** a case has `followUpMilestone = '30'` and a computed `followUpDueDate` of a given day
- **THEN** `GET /api/appointments?from=&to=` for a range including that day includes an entry with that case's number, client, and "30 Day follow-up" as the milestone label

#### Scenario: A case with no follow-up set contributes no appointment
- **WHEN** a case has `followUpMilestone = 'none'`
- **THEN** it never appears in the appointments response for any date range

### Requirement: Calendar page renders a month grid with follow-up markers
The Calendar page (`/calendar`) SHALL render a month grid with weekday labels, previous/next month navigation, a marker on any day with at least one follow-up, and clicking a day SHALL list that day's follow-ups (case number, client, milestone) below the grid.

#### Scenario: A day with follow-ups shows a marker
- **WHEN** the displayed month includes a day with one or more appointments
- **THEN** that day's cell renders a visible marker

#### Scenario: Clicking a marked day lists its follow-ups
- **WHEN** the case manager clicks a day with appointments
- **THEN** the list below the grid shows each of that day's follow-ups, and clicking one opens its case

#### Scenario: Clicking an unmarked day shows the empty state
- **WHEN** the case manager clicks a day with no follow-ups
- **THEN** the list below the grid shows "No follow-ups scheduled for this day."

#### Scenario: Navigating months reflects that month's own follow-ups
- **WHEN** the case manager navigates to the next month
- **THEN** the grid's markers reflect appointments in the newly-displayed month, refetched via `GET /api/appointments`
