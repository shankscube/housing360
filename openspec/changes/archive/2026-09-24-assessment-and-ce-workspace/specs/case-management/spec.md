## MODIFIED Requirements

### Requirement: Assessments Tab Lists Assessments Per Enrollment
The Assessments tab SHALL provide an enrollment picker and, for the selected enrollment, list its assessments with stage, date, status, and score, offering Resume Draft and Discard on draft assessments and a Recommended Care Plans strip. Resume Draft and New Assessment SHALL open the real Assessment form modal, and Discard SHALL require confirmation through the shared confirm dialog before deleting a draft.

#### Scenario: Selecting an enrollment lists its assessments
- **WHEN** a case manager selects an enrollment in the Assessments tab
- **THEN** the tab lists that enrollment's assessments with their stage, date, status, and score

#### Scenario: Resume and New open the real assessment form
- **WHEN** a case manager clicks Resume Draft or starts a new assessment from the Assessments tab
- **THEN** the Assessment form modal opens against that enrollment's draft or a newly eligible stage, using the same form the Assessment Command Center uses

#### Scenario: Discard requires confirmation
- **WHEN** a case manager clicks Discard on a draft assessment
- **THEN** a confirmation dialog is shown before the assessment is deleted, and declining the confirmation leaves the draft intact

#### Scenario: Recommended Care Plans strip offers Create from Template
- **WHEN** the Assessments tab has at least one recommended care plan template for the client
- **THEN** a "Create from Template" action opens the Care Plan wizard pre-filled with that template
