# assessment-tracking

## Purpose

Tracks HUD assessments (Entry/Annual/Exit) across every client and case, giving case managers and supervisors a global, filterable view — the Assessment Command Center — distinct from a single case's own Assessments tab. Owns the assessment scoring contract: scores are always produced by a dedicated `HousingStabilityScoringService`, never computed inline by a controller or accepted from a client request, and the Entry Assessment's single-record-per-enrollment guarantee is preserved as the model gains recurrence/type/scoring fields. Also owns stage eligibility (which HUD stage can be started/resumed on an enrollment), draft discard rules, cross-enrollment-safe "carry forward" pre-fill, disability set replacement, Exit-assessment program-exit recording, and rule-driven care plan template recommendations.

## Requirements

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
Assessment scores SHALL be computed exclusively by calling `HousingStabilityScoringService.score`, triggered when an assessment's status transitions to `completed`. The service SHALL persist one contribution row per matching scoring rule, and the sum of those contributions SHALL equal the persisted `score`. Controllers and route handlers SHALL NOT compute or accept a client-supplied `score`/`scoreLabel`.

#### Scenario: Completing an assessment triggers scoring
- **WHEN** `PATCH /api/assessments/:id` transitions an assessment's status to `completed`
- **THEN** the system calls `HousingStabilityScoringService.score` with that assessment's recorded data and persists the returned `score`/`scoreLabel`

#### Scenario: Client-supplied score is ignored
- **WHEN** a request to create or update an assessment includes a `score` or `scoreLabel` field in its body
- **THEN** the system ignores those fields and computes them itself (or leaves them unset if the assessment is not yet completed)

#### Scenario: The score equals the sum of persisted contributions
- **WHEN** an assessment is scored and its contribution breakdown is fetched
- **THEN** the sum of every persisted `assessment_score_contributions` row for that assessment equals the assessment's `score`, and every field that matched an active scoring rule appears in the breakdown

### Requirement: Stage Eligibility Governs Which Assessment Types Can Be Started
`GET /api/enrollments/:id/assessment-eligibility` SHALL return, for a program enrollment, every HUD stage (Entry, Update, Annual, Exit) with whether it is currently `allowed` and a `reason`, computed by a single `AssessmentEligibilityService`. Entry SHALL be allowed only when the enrollment has no Entry assessment. Annual SHALL be allowed only within 30 days before or after an anniversary of the enrollment's start date, and only once per such window. Exit SHALL be allowed only once, while the enrollment is active. Update SHALL be allowed at any time after Entry and before Exit.

#### Scenario: An enrollment with an Entry assessment offers no second Entry
- **WHEN** a program enrollment already has an Entry assessment
- **THEN** the eligibility response marks Entry as not allowed, with a reason explaining an Entry assessment already exists

#### Scenario: Annual is allowed only inside the anniversary window
- **WHEN** the current date is more than 30 days before or after any anniversary of the enrollment's start date
- **THEN** the eligibility response marks Annual as not allowed for that date

#### Scenario: Annual is allowed inside the anniversary window
- **WHEN** the current date is within 30 days before or after an anniversary of the enrollment's start date, and no Annual assessment has been completed for that window
- **THEN** the eligibility response marks Annual as allowed

### Requirement: An Unfinished Draft Forces Resume Instead of a New Assessment
When a stage already has an unfinished (draft) assessment on the enrollment, the eligibility response for that stage SHALL include the draft assessment's id so the UI offers "Resume Draft" instead of starting a new assessment of that stage.

#### Scenario: An existing draft forces Resume instead of a new assessment of that stage
- **WHEN** an enrollment has a draft Annual assessment and the Launch Assessment flow is opened for that enrollment
- **THEN** the Annual option shows "resume" with the draft's id, rather than allowing a second Annual assessment to be started

### Requirement: Discarding an Assessment Is Limited to Drafts
`DELETE /api/assessments/:id` SHALL succeed only when the assessment's status is not `completed`. Discarding a completed assessment SHALL be rejected with HTTP 409.

#### Scenario: Discarding a completed assessment is rejected
- **WHEN** `DELETE /api/assessments/:id` targets an assessment with status `completed`
- **THEN** the request is rejected with HTTP 409 and the assessment is not deleted

#### Scenario: Discarding a draft succeeds
- **WHEN** `DELETE /api/assessments/:id` targets an assessment with status `in_progress`
- **THEN** the assessment is deleted

### Requirement: Carry Forward Pre-Fills From the Most Recent Assessment on the Enrollment
`GET /api/enrollments/:id/latest-assessment-values` SHALL return the field values of the most recently completed (or, if none is completed, most recently updated) assessment on that specific program enrollment, for use as a "Carry forward previous answers" pre-fill. It SHALL NOT pre-fill from an assessment belonging to a different enrollment.

#### Scenario: Carry forward pre-fills from the most recent assessment on the same enrollment only
- **WHEN** a client has assessments on two different program enrollments and "Carry forward" is used while recording a new assessment on enrollment A
- **THEN** the pre-filled values come only from enrollment A's most recent assessment, never from enrollment B's

### Requirement: Disabilities Are Edited as a Replaceable Set
`PUT /api/assessments/:id/disabilities` SHALL replace the assessment's full set of disability records in one call, rather than requiring individual add/remove requests.

#### Scenario: Replacing the set removes rows not included
- **WHEN** an assessment currently has two disability rows and `PUT /api/assessments/:id/disabilities` is called with only one of them plus a new one
- **THEN** the assessment ends up with exactly the two rows from the request — the original row not included is removed

### Requirement: Completing an Exit Assessment Records the Program Exit
Completing an assessment with HUD stage Exit SHALL, in the same transaction as the scoring write, create a `program_exits` record (exit date, destination type, destination, case manager exit reason) and close the associated program enrollment (set its end date and a closed status).

#### Scenario: Completing an Exit assessment records the program exit and closes the enrollment
- **WHEN** an Exit-stage assessment's status transitions to `completed`
- **THEN** a `program_exits` record is created referencing that assessment and enrollment, and the program enrollment's end date and status reflect that it is closed

#### Scenario: An incomplete Exit assessment does not close the enrollment
- **WHEN** an Exit-stage assessment is saved as a draft (not completed)
- **THEN** no `program_exits` record is created and the enrollment remains open

### Requirement: Care Plan Template Recommendations Are Rule-Driven
`GET /api/enrollments/:id/recommended-care-plan-templates` SHALL rank published care plan templates using `care_plan_template_rules` (matched against the enrollment's latest completed assessment's score band or field conditions) rather than returning every published template unconditionally.

#### Scenario: A matching rule surfaces its template first
- **WHEN** an enrollment's latest completed assessment's score falls inside a `care_plan_template_rules` row's score band
- **THEN** that row's template is included in the recommendation response

#### Scenario: No scored assessment falls back to all published templates
- **WHEN** an enrollment has no completed, scored assessment yet
- **THEN** the recommendation response falls back to every published template, preserving the prior behavior rather than returning an empty list

### Requirement: Assessment Tracking Fields Do Not Break the Entry Assessment's Single-Record Guarantee
Adding `type`, `dueDate`, `score`, `scoreLabel`, and a recurrence key to the `Assessment` record SHALL NOT change the existing guarantee that the Health & DV wizard step produces exactly one Entry Assessment record per program enrollment.

#### Scenario: Re-submitting the Entry Assessment still upserts one row
- **WHEN** the intake wizard's Health & DV step saves twice for the same program enrollment
- **THEN** exactly one Assessment record exists for that enrollment with type `entry`, as before this change

#### Scenario: A second annual assessment cycle does not collide with the first
- **WHEN** an annual assessment for a program enrollment is marked `completed` and a new annual assessment is scheduled for the following year on the same enrollment
- **THEN** both rows persist independently and neither upsert overwrites the other
