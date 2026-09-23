# client-intake

## Purpose

The multi-step HUD client intake wizard — search-or-create, family members, program enrollment, and the Entry Assessment across living situation, income/benefits/insurance, and health/DV — plus disabilities, an optional interaction summary, and the domain writes and reference HUD option lists it depends on.

## Requirements

### Requirement: Client Search Before Intake
The system SHALL let a case manager search for an existing client by name before starting intake, and SHALL always offer a path to continue as a new client regardless of search results.

#### Scenario: Search with no match offers new-client continuation
- **WHEN** a name search in the intake wizard's search phase returns no matching clients
- **THEN** the wizard shows "No matching clients found. You can continue to create a new client." and the "Continue as New Client" action

#### Scenario: Continue as New Client is always available
- **WHEN** a search has been run, whether or not it returned results
- **THEN** the "Continue as New Client" action is available and starts the form phase with a blank Client Basic Information step

#### Scenario: Search results table omits full SSN
- **WHEN** the search phase renders its results table
- **THEN** each row shows name, email, date of birth, masked SSN, relationship to head of household, sex, and veteran status, with the SSN column never showing more than the last four digits

### Requirement: Selecting an Existing Client Pre-Fills the Wizard
The system SHALL, when an existing client is selected from search results, load that client's intake snapshot and enter the form phase pre-filled with already-known data, marking steps complete wherever their data already exists.

#### Scenario: Selecting a result pre-fills and marks Family Members complete
- **WHEN** a case manager selects a client from the search results table
- **THEN** the wizard loads that client's intake snapshot, marks the Family Members step complete, and enters the form at step 1 with the client's data pre-filled

#### Scenario: Existing enrollment selects as primary and marks Program complete
- **WHEN** the selected client's intake snapshot includes one or more program enrollments
- **THEN** the wizard selects the primary enrollment (or the first, if none is marked primary), marks the Program & Enrollment step complete, and calls `cases/ensure` for that client and enrollment

#### Scenario: Existing Entry Assessment data marks its section steps complete
- **WHEN** the selected enrollment's intake snapshot shows values already recorded for the Living Situation, Income & Benefits, or Health & DV sections
- **THEN** the wizard marks each corresponding step complete before the case manager reaches it

### Requirement: Step Rail Reflects and Gates Progress
The system SHALL render an 8-step rail where each step shows as upcoming, active, or complete, and SHALL only allow navigating to a step at or before the furthest step reached, saving the current step first when navigating away from it.

#### Scenario: Steps beyond the furthest reached step are not clickable
- **WHEN** a case manager is on step 3 and has never advanced past step 4
- **THEN** steps 5 through 8 in the rail are not clickable

#### Scenario: Clicking an eligible earlier step saves the current step first
- **WHEN** a case manager clicks a rail step that is at or before the furthest step reached
- **THEN** the currently active step's data is saved before the wizard navigates to the clicked step

### Requirement: Client Basic Information Step
The system SHALL capture first name, last name, title, name/SSN/DOB data-quality codes, SSN, birthdate, sex, relationship to head of household, multi-value race and ethnicity, mobile, email, and veteran status (with veteran details when applicable) as the wizard's first step, checking for duplicates before creating or updating the client.

#### Scenario: Missing required fields block advancing
- **WHEN** a case manager attempts "Save & Next" on step 1 without First Name, Last Name, Birthdate, Sex, or Relationship to HoH filled in
- **THEN** the wizard shows the toast "Missing information: Please fill in the highlighted required fields before continuing." and does not advance

#### Scenario: Veteran Status of Yes reveals veteran details
- **WHEN** a case manager sets Veteran Status to "Yes" on step 1
- **THEN** the Veteran Details section becomes visible and the view scrolls to it

#### Scenario: A duplicate-rule hit shows Save Anyway, which then succeeds
- **WHEN** saving step 1 returns a duplicate match (HTTP 409 with candidates)
- **THEN** the wizard shows an inline warning banner with "Save Anyway" and a dismiss control, not a toast, and clicking "Save Anyway" resends the request with `allowDuplicate: true` and succeeds

#### Scenario: First successful save creates the household if none exists
- **WHEN** step 1 saves successfully for a client with no existing household
- **THEN** the wizard creates a household for that client before advancing to step 2

### Requirement: Family Members Step Validates New Rows
The system SHALL let a case manager add family-member rows inline, require any new row with a name to have both a first and last name before advancing, and bulk-create only the new rows in one request.

#### Scenario: A family row with only a first name is blocked
- **WHEN** a case manager attempts "Save & Next" on the Family Members step with a new row that has a first name but no last name (or vice versa)
- **THEN** the wizard shows the toast "Each family member needs at least a first and last name." and does not advance

#### Scenario: Zero new rows skips ahead without a write
- **WHEN** a case manager reaches the Family Members step with no new rows added
- **THEN** the wizard advances to the next step without calling the bulk-member-create endpoint

#### Scenario: New rows are bulk-created in one request
- **WHEN** a case manager adds one or more valid new family-member rows and advances
- **THEN** the wizard bulk-creates all new rows as members of the client's household in a single request

#### Scenario: Already-saved rows render read-only
- **WHEN** the Family Members step displays a row that was loaded from an existing client's household
- **THEN** that row is read-only and its SSN column is masked

### Requirement: Program & Enrollment Step Ensures a Case
The system SHALL let a case manager pick an existing enrollment or create a new one, and SHALL call `cases/ensure` for the resulting client-and-enrollment pair such that repeated calls never create more than one case.

#### Scenario: cases/ensure called twice creates only one case
- **WHEN** `cases/ensure` is called twice for the same client and enrollment (e.g. re-entering the wizard for the same enrollment)
- **THEN** only one `Case` record exists for that client-and-enrollment pair after both calls

#### Scenario: An existing unfinished Entry Assessment shows the resuming message
- **WHEN** the Program & Enrollment step saves and the enrollment already has an in-progress Entry Assessment
- **THEN** the wizard shows "Resuming the unfinished Entry assessment already started for this enrollment."

#### Scenario: An existing complete Entry Assessment shows the editing message
- **WHEN** the Program & Enrollment step saves and the enrollment already has a complete Entry Assessment
- **THEN** the wizard shows "Already recorded for this enrollment; editing below updates that same record."

#### Scenario: No existing Entry Assessment shows the not-yet-recorded message
- **WHEN** the Program & Enrollment step saves and the enrollment has no Entry Assessment yet
- **THEN** the wizard shows "Not yet recorded for this enrollment."

#### Scenario: Switching enrollment resets section step completion
- **WHEN** a case manager switches which enrollment is active on the Program & Enrollment step
- **THEN** the Living Situation, Income & Benefits, Health & DV, and Disabilities steps' completion state is reset

### Requirement: Living Situation Step Gates on Situation Category
The system SHALL derive the Situation options from the selected Situation Type category (HUD 3.917), clearing Situation and Rental Subsidy Type whenever the category changes, and SHALL enable Rental Subsidy Type only for the Permanent category.

#### Scenario: A Permanent situation enables Rental Subsidy Type
- **WHEN** a case manager selects a Permanent-category Situation Type
- **THEN** the Rental Subsidy Type field becomes enabled

#### Scenario: A non-Permanent situation disables Rental Subsidy Type
- **WHEN** a case manager selects a Situation Type in any category other than Permanent
- **THEN** the Rental Subsidy Type field is disabled and its value is cleared

#### Scenario: Changing situation category clears dependent fields
- **WHEN** a case manager changes the Situation Type category after already selecting a Situation
- **THEN** the Situation field is cleared along with Rental Subsidy Type

### Requirement: Income, Benefits, and Insurance Step Gates Fields Declaratively
The system SHALL enable each income source's Amount field only when that source's Yes/No field is Yes (clearing Amount otherwise), enable each insurance type's "No reason" field only when that type is No, show insurance type rows only when Covered by Health Insurance is Yes, and drive all of this gating from one declarative field-to-field mapping.

#### Scenario: An income amount is disabled unless its source is Yes
- **WHEN** an income source's Yes/No field is set to "No" (or left unset)
- **THEN** that source's Amount field is disabled and its value is cleared

#### Scenario: An income amount becomes enabled when its source is Yes
- **WHEN** an income source's Yes/No field is set to "Yes"
- **THEN** that source's Amount field becomes enabled

#### Scenario: An insurance "No reason" is enabled only when that type is No
- **WHEN** a health insurance type's Yes/No field is set to "No"
- **THEN** that type's "No reason" field becomes enabled, using the HUD reason codes

#### Scenario: Insurance type rows appear only when covered by health insurance
- **WHEN** "Covered by Health Insurance" is not set to "Yes"
- **THEN** the individual insurance type rows are not shown

### Requirement: Health & DV Step Completes One Entry Assessment Record
The system SHALL persist the Living Situation, Income & Benefits/Insurance, and Health & DV steps' fields as a single Entry Assessment record (`data_collection_stage = 1`) in one save when the Health & DV step's "Save & Next" is used.

#### Scenario: Steps 4–6 produce exactly one Entry assessment record
- **WHEN** a case manager completes the Living Situation, Income & Benefits, and Health & DV steps and saves on step 6
- **THEN** exactly one Assessment record exists for that client's enrollment at `data_collection_stage = 1`, containing fields from all three steps

### Requirement: Disabilities Step Requires a Record or an Explicit None
The system SHALL require at least one disability record or an explicit "no known disabilities" confirmation before advancing past the Disabilities step, and SHALL reveal HIV-specific fields only for an HIV/AIDS disability type with a Yes response.

#### Scenario: Disabilities Next is blocked without a record or the checkbox
- **WHEN** a case manager attempts to advance past the Disabilities step with no saved disability records and the "No known disabilities to record" checkbox unchecked
- **THEN** the wizard shows "Add at least one disability record, or check 'No known disabilities to record' to continue." and does not advance

#### Scenario: The "no known disabilities" checkbox only shows while the list is empty
- **WHEN** at least one disability record has been saved
- **THEN** the "No known disabilities to record" checkbox is not shown

#### Scenario: HIV fields appear only for HIV/AIDS with a Yes response
- **WHEN** a disability record's Type is HIV/AIDS and its Response is Yes
- **THEN** Anti-retroviral, T-cell available (with count and source), and Viral load available (with value and source) fields are shown; otherwise they are not

#### Scenario: Removing a disability issues a delete call
- **WHEN** a case manager clicks Remove on a saved disability record
- **THEN** the wizard issues a delete request for that record and removes it from the displayed list

### Requirement: Interaction Summary Step Is Optional
The system SHALL ask whether to add an Interaction Summary before finishing intake, finishing without creating one on "No", and creating one linked to the client and case on "Yes".

#### Scenario: Answering No finishes without creating a summary
- **WHEN** a case manager answers "No" to adding an Interaction Summary
- **THEN** the wizard finishes the intake without creating an `InteractionSummary` record

#### Scenario: Answering Yes creates a linked summary on Save & Finish
- **WHEN** a case manager answers "Yes", fills in Title, Status, Meeting Notes, and Next Steps, and clicks "Save & Finish"
- **THEN** an `InteractionSummary` record is created linked to the client and the case

### Requirement: Finished Phase Refreshes the Client List
The system SHALL show an "Intake Complete" panel after finishing, offer a "View client record" action and Back/Done controls, and SHALL cause the My Clients list to refetch once the wizard is closed.

#### Scenario: Closing the wizard refetches the client list
- **WHEN** the intake wizard is closed after reaching the finished phase
- **THEN** the My Clients screen refetches its client list

### Requirement: HUD Option Lists Are Served, Never Hardcoded
The system SHALL serve every HUD code list the wizard uses (including the 8/9/99 codes for "client doesn't know" / "prefers not to answer" / "data not collected") from one reference endpoint, and the frontend SHALL populate every option list from that endpoint rather than a hardcoded list.

#### Scenario: Wizard loads option lists from the reference endpoint
- **WHEN** the intake wizard mounts
- **THEN** it fetches HUD option lists from the reference endpoint and uses those values to populate every relevant select/checkbox-group in the wizard

### Requirement: SSN Never Appears Unmasked Outside Client Detail
The system SHALL never include an unmasked SSN in client search results, list payloads, or duplicate-candidate payloads used by the intake wizard, and SHALL never write an SSN value to application logs.

#### Scenario: SSN never appears unmasked in search or list payloads
- **WHEN** the intake wizard's search or duplicate-candidate results include a client with a provided SSN
- **THEN** the payload includes only the last-four value, never the full SSN

#### Scenario: SSN never appears in application logs
- **WHEN** an intake request containing an SSN value is processed
- **THEN** no application log entry contains the raw SSN value
