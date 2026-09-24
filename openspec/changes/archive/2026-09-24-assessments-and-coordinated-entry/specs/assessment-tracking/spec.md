## ADDED Requirements

### Requirement: Assessment Command Center Lists Assessments Across Every Case
The system SHALL provide a paginated, global list of assessments (`GET /api/assessments`) spanning every client and case, each row carrying the assessment's client name, program enrollment, HUD stage, type, status, due date, and score, distinct from any single case's Assessments tab.

#### Scenario: Command Center lists assessments from multiple cases
- **WHEN** assessments exist for more than one client's case
- **THEN** the list response includes rows from every case, not scoped to a single enrollment or case

#### Scenario: Empty state
- **WHEN** no assessments exist yet
- **THEN** the list response returns an empty set and the page renders the table's empty state rather than an error

### Requirement: Status and Type Filters Combine
The Assessment Command Center SHALL support a status filter (`all | overdue | dueToday | inProgress | completed`) and, independently, an assessment-type filter (`entry | annual | exit`), and SHALL apply both together as an AND when both are set — matching only assessments that satisfy both the selected status and the selected type.

#### Scenario: Type filter alone
- **WHEN** the type filter is set to `annual` and the status filter is `all`
- **THEN** only annual assessments are returned, regardless of status

#### Scenario: Status filter alone
- **WHEN** the status filter is set to `overdue` and the type filter is unset (all types)
- **THEN** only overdue assessments are returned, regardless of type

#### Scenario: Status and type filters combine
- **WHEN** the status filter is set to `overdue` and the type filter is set to `entry`
- **THEN** only assessments that are both overdue and of type `entry` are returned — an overdue `annual` assessment is excluded

#### Scenario: KPI row counts are independent of the active filter
- **WHEN** the list is filtered to `overdue` + `entry`
- **THEN** the Due Today / In Progress / Completed / Total Assessments KPI tiles still reflect counts across the full, unfiltered assessment set

### Requirement: Assessment Detail Displays Score Prominently
`GET /api/assessments/:id` SHALL return the assessment's `score` and `scoreLabel` alongside its other fields, and the detail view SHALL render them as a prominent, labeled display element rather than as an editable plain numeric input.

#### Scenario: Scored assessment shows its score and label
- **WHEN** an assessment has `status: completed` and has been scored
- **THEN** the detail response includes a numeric `score` and a human-readable `scoreLabel` (e.g. `85` / `"Strong"`)

#### Scenario: Unscored assessment shows a pending state, not zero
- **WHEN** an assessment has not yet reached `completed` status
- **THEN** `score` and `scoreLabel` are `null`, and the detail view shows a "not yet scored" state rather than a misleading `0`

### Requirement: Scoring Is Produced by a Dedicated Scoring Service, Not the Controller
Assessment scores SHALL be computed exclusively by calling `ScoringService.scoreAssessment`, triggered when an assessment's status transitions to `completed`. Controllers and route handlers SHALL NOT compute or accept a client-supplied `score`/`scoreLabel`.

#### Scenario: Completing an assessment triggers scoring
- **WHEN** `PATCH /api/assessments/:id` transitions an assessment's status to `completed`
- **THEN** the system calls `ScoringService.scoreAssessment` with that assessment's recorded data and persists the returned `score`/`scoreLabel`

#### Scenario: Client-supplied score is ignored
- **WHEN** a request to create or update an assessment includes a `score` or `scoreLabel` field in its body
- **THEN** the system ignores those fields and computes them itself (or leaves them unset if the assessment is not yet completed)

### Requirement: Assessment Tracking Fields Do Not Break the Entry Assessment's Single-Record Guarantee
Adding `type`, `dueDate`, `score`, `scoreLabel`, and a recurrence key to the `Assessment` record SHALL NOT change the existing guarantee that the Health & DV wizard step produces exactly one Entry Assessment record per program enrollment.

#### Scenario: Re-submitting the Entry Assessment still upserts one row
- **WHEN** the intake wizard's Health & DV step saves twice for the same program enrollment
- **THEN** exactly one Assessment record exists for that enrollment with type `entry`, as before this change

#### Scenario: A second annual assessment cycle does not collide with the first
- **WHEN** an annual assessment for a program enrollment is marked `completed` and a new annual assessment is scheduled for the following year on the same enrollment
- **THEN** both rows persist independently and neither upsert overwrites the other
