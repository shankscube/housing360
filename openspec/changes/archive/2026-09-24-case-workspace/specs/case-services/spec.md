## ADDED Requirements

### Requirement: Services Tab Lists Program Enrollments With Assigned Services
The Services tab SHALL provide a searchable list of the client's program enrollments, flagging the primary enrollment, with status, start, and end dates, each expandable to its assigned services and each service's disbursements.

#### Scenario: Primary enrollment is flagged
- **WHEN** the Services tab lists a client's program enrollments
- **THEN** the enrollment marked primary shows a Primary badge

#### Scenario: Expanding an enrollment shows its services and disbursements
- **WHEN** a case manager expands a program enrollment row
- **THEN** the enrollment's assigned services are shown, each expandable to its own disbursements

#### Scenario: No enrollments shows a labeled empty state
- **WHEN** a case manager opens the Services tab for a client with no program enrollments
- **THEN** the tab shows a labeled empty state, not an error

### Requirement: Assign Service Offers Only Benefits Configured for the Program
The system SHALL let a case manager assign a service to a program enrollment, offering only the benefits configured for that enrollment's program.

#### Scenario: No benefits configured shows a labeled message
- **WHEN** a case manager opens "Assign Service" for an enrollment whose program has no configured benefits
- **THEN** the dialog shows "No benefits are configured for this program yet." and no service can be assigned

#### Scenario: Assigning a service links it to the enrollment
- **WHEN** a case manager assigns a benefit configured for the enrollment's program
- **THEN** a service assignment is created linking that benefit to the enrollment

### Requirement: Service Disbursements Are Created and Edited Per Assigned Service
The system SHALL let a case manager create and edit a disbursement under an assigned service, capturing type, status, date, recipient, description, trigger reason, voucher number and amount, and bed identifier and shift where relevant.

#### Scenario: A disbursement is created under a service
- **WHEN** a case manager saves a new disbursement with type, status, date, and recipient
- **THEN** the disbursement is created and linked to that service assignment

#### Scenario: Bed identifier and shift only apply to bed-related disbursement types
- **WHEN** a case manager creates a disbursement of a type unrelated to bed usage
- **THEN** the bed identifier and shift fields are not required

### Requirement: Bed Assignment Logs the First Night as Present
The system SHALL let a case manager assign a bed to a program enrollment by program, date, and shift after finding available beds, and SHALL log that day's night as Present in the same action, and SHALL NOT offer a bed already assigned for the requested date and shift.

#### Scenario: Find Available Beds excludes already-assigned beds
- **WHEN** a case manager searches for available beds on a program, date, and shift where a bed is already assigned for that date and shift
- **THEN** that bed does not appear in the available list

#### Scenario: Assigning a bed logs today's night as Present
- **WHEN** a case manager assigns an available bed
- **THEN** a bed assignment is created and a bed-night record for the current date is logged as Present

#### Scenario: Assignment shows a confirmation
- **WHEN** a bed assignment succeeds
- **THEN** a confirmation is shown stating the bed was assigned and today's stay was logged

### Requirement: Daily Log Tracks Nightly Bed Status Per Assignment
The system SHALL provide, per bed assignment, a calendar view of nights marked Present, Absent, or Not logged, with one-click logging, and a Recent Daily Logs list showing date, status, and shift.

#### Scenario: A night is logged with one click
- **WHEN** a case manager clicks a calendar cell for an unlogged night and selects Present or Absent
- **THEN** that night's status is recorded and reflected on the calendar

#### Scenario: An already-logged night can be corrected
- **WHEN** a case manager changes the status of an already-logged night
- **THEN** the bed-night record is updated to the new status

#### Scenario: Recent Daily Logs reflects logged nights
- **WHEN** a case manager opens the Daily Log for a bed assignment with logged nights
- **THEN** Recent Daily Logs lists each logged night with its date, status, and shift
