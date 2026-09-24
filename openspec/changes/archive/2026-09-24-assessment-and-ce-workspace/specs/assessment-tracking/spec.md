## MODIFIED Requirements

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

## ADDED Requirements

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
