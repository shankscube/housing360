## ADDED Requirements

### Requirement: Plan Tab Lists Care Plans With Expandable Goals and Tasks
The Plan tab SHALL list the case's care plans with status, start date, target (end) date, tasks-done-over-total progress, and description, each expandable to its goals, and each goal expandable to its tasks with inline status change and a "New Task" action.

#### Scenario: A care plan expands to its goals
- **WHEN** a case manager expands a care plan row
- **THEN** the plan's goals are shown beneath it

#### Scenario: A goal expands to its tasks
- **WHEN** a case manager expands a goal row
- **THEN** the goal's tasks are shown beneath it, each with its status changeable inline

#### Scenario: Progress reflects completed tasks
- **WHEN** a care plan's goals have a combined total of tasks, some marked complete
- **THEN** the plan's row shows the count of completed tasks over the total

#### Scenario: No care plans shows a labeled empty state
- **WHEN** a case manager opens the Plan tab for a case with no care plans
- **THEN** the tab shows a labeled empty state, not an error

### Requirement: Care Plan Wizard Creates a Plan, Its Goals, and Their Tasks
The system SHALL provide a 3-step Care Plan wizard (Plan details, Goals, Tasks) that creates a care plan together with its goals and each goal's tasks in a single transaction, and SHALL reuse the same wizard to edit an existing plan, add goals to it, or edit one goal.

#### Scenario: Plan details step offers recommended templates first
- **WHEN** a case manager opens the Care Plan wizard's Plan details step for a specific client
- **THEN** templates recommended for that client are listed before other published templates, and published templates can be searched

#### Scenario: An unnamed goal blocks advancing
- **WHEN** a case manager attempts to advance past the Goals step with a goal row that has no name
- **THEN** the wizard shows "Give every goal a name, or remove the empty one, to continue." and does not advance

#### Scenario: An unnamed task blocks advancing
- **WHEN** a case manager attempts to save the Tasks step with a task row that has no subject
- **THEN** the wizard shows "Give every task a subject, or remove the empty one, to continue." and does not save

#### Scenario: A goal with no tasks is valid
- **WHEN** a case manager completes the Tasks step leaving one goal with zero tasks
- **THEN** the wizard saves successfully with that goal having no tasks

#### Scenario: Plan, goals, and tasks save in one transaction
- **WHEN** a case manager completes the Care Plan wizard for a new plan with two goals and tasks under each
- **THEN** the care plan, both goals, and all their tasks exist after the save, or none of them do if the save fails

#### Scenario: Creating from a template clones its goals and tasks as a starting point
- **WHEN** a case manager selects a template on the Plan details step
- **THEN** the Goals and Tasks steps pre-fill with that template's goals and default tasks, editable before saving

#### Scenario: Editing an existing plan reuses the same wizard
- **WHEN** a case manager opens Edit on an existing care plan
- **THEN** the wizard opens pre-filled with that plan's current name, description, status, dates, goals, and tasks

### Requirement: Service Gap Detection Flags Goals With No In-House Benefit
The system SHALL identify, for a case, any goal's service domain that no in-house benefit covers, and the Plan tab SHALL show a "Refer to Partner" action for each such goal.

#### Scenario: A goal with an uncovered domain shows Refer to Partner
- **WHEN** a case's care plan includes a goal whose service domain has no configured in-house benefit
- **THEN** the Plan tab shows "<domain> isn't offered in-house." with a "Refer to Partner" action for that goal

#### Scenario: A goal with a covered domain shows no gap message
- **WHEN** a case's care plan includes a goal whose service domain is covered by an in-house benefit
- **THEN** no service-gap message is shown for that goal

### Requirement: Refer to Partner Agency Flow Is Gated on Release of Information Consent
The system SHALL let a case manager refer a service gap to a partner agency offering that service domain, checking the client's release-of-information consent before sending, and SHALL flag an agency with no contact email as unreachable.

#### Scenario: Selecting an agency with no contact email flags it
- **WHEN** a case manager views the list of agencies offering the gap's service domain and one has no contact email
- **THEN** that agency is shown flagged as "can't be reached yet"

#### Scenario: Active consent shows what was authorized
- **WHEN** a case manager reaches the ROI check for a client with active, unrevoked, unexpired consent
- **THEN** the flow shows what the client authorized and proceeds to Send Referral without requiring a new signature

#### Scenario: No consent offers Create ROI or Continue Without ROI
- **WHEN** a case manager reaches the ROI check for a client with no active consent
- **THEN** the flow offers "Create Release of Information" and "Continue Without ROI", the latter behind a confirmation checkbox stating the referral will be sent without client details beyond initials

#### Scenario: Continuing without ROI stores initials only
- **WHEN** a case manager confirms "Continue Without ROI" and sends the referral
- **THEN** the resulting external referral stores only the client's initials, no other client contact details

#### Scenario: Sending requires the confirmation checkbox when proceeding without consent
- **WHEN** a case manager attempts to send a referral without active consent and without checking the confirmation checkbox
- **THEN** the referral is not sent
