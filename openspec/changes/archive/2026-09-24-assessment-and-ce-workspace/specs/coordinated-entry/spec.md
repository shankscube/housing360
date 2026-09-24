## MODIFIED Requirements

### Requirement: Coordinated Entry Is a 4-Step Linear Flow
The system SHALL present Coordinated Entry as a 4-step linear flow — Vulnerability Assessment, Recommended Program Types, Partner Agencies, Send Referral — with a visual stepper reflecting the current step, and SHALL NOT allow advancing to a later step until the current step's action has completed successfully. The Vulnerability Assessment step SHALL render its questions from the configurable question bank (`GET /api/ce/questions`), not from a fixed/hardcoded set.

#### Scenario: Stepper starts at step 1
- **WHEN** Coordinated Entry is opened for a client
- **THEN** the stepper shows "Vulnerability Assessment" as the current step and the later three steps as unreached

#### Scenario: A completed vulnerability assessment produces a score and advances the stepper
- **WHEN** the Vulnerability Assessment step is submitted with answers to the active questions plus intake flags
- **THEN** the system calls `CoordinatedEntryService.score`, persists the resulting total score, band, and flags as a `ce_assessments` record, and the stepper advances to "Recommended Program Types"

#### Scenario: A step cannot be skipped without completing the previous one
- **WHEN** no vulnerability assessment has been completed for the current session
- **THEN** "Recommended Program Types," "Partner Agencies," and "Send Referral" are not reachable

#### Scenario: Questions render from configuration, not from the component
- **WHEN** an active question is added to or removed from the question bank
- **THEN** the Vulnerability Assessment step's rendered questions change accordingly, without any code change to the step component

### Requirement: Recommended Programs Reflect the Score Band's Recommended Project Types
`GET /api/ce/clients/:id/recommendation` SHALL return the score band matching the client's most recent `ce_assessments` total score, that band's base recommended project types, any flag overrides applied (and how), and whether referral is suppressed. `GET /api/ce/recommended-programs?projectType=` SHALL return active programs whose project type matches, including their operating organization's address and live bed availability.

#### Scenario: A CE score of exactly a band's min or max lands in that band
- **WHEN** a client's total score exactly equals a `ce_score_bands` row's `min_score` or `max_score`
- **THEN** that band is the one selected for the client's recommendation, not a neighboring band

#### Scenario: A "replace" override replaces the base recommendation
- **WHEN** a client has a flag whose matching `ce_flag_overrides` row has behavior `replace`
- **THEN** the recommendation response's recommended project types are the override's types, not the base band's types, and the response marks that override as applied

#### Scenario: An "add" override appends to it
- **WHEN** a client has a flag whose matching `ce_flag_overrides` row has behavior `add`
- **THEN** the recommendation response's recommended project types include both the base band's types and the override's types, and the response marks that override as applied

#### Scenario: No project types currently have eligible programs
- **WHEN** none of the recommended project types have any active `Program` with a matching `projectTypeCode`
- **THEN** the Recommended Program Types step shows "No project types currently have eligible programs."

#### Scenario: Recommended programs include address and live bed availability
- **WHEN** recommended programs are requested for a project type that has matching active programs
- **THEN** each returned program includes its operating organization's address and a live count of available beds

## ADDED Requirements

### Requirement: A Safety Alert Suppresses Referral and Surfaces an External Message
When a client's Safety Alert flag triggers a `ce_flag_overrides` row, the recommendation response SHALL report referral as suppressed and SHALL include that override's external referral message. A suppressed client SHALL NOT be offered the Send Referral step's normal action.

#### Scenario: A Safety Alert client never shows Send Referral
- **WHEN** a client's recommendation has `referralSuppressed: true`
- **THEN** the Coordinated Entry workflow shows the suppression banner and its external referral message in place of the normal Send Referral action

### Requirement: Rule Administration Requires the ce:manage-rules Permission and Is Audited
CRUD operations on Coordinated Entry questions, answer options, score bands, and flag overrides SHALL require the `ce:manage-rules` permission, and every successful write SHALL create a `ce_rule_changes` record capturing who changed what, when, and the before/after values.

#### Scenario: Editing a question or band without ce:manage-rules returns 403
- **WHEN** a user without the `ce:manage-rules` permission attempts to edit a question, answer option, score band, or flag override
- **THEN** the request is rejected with HTTP 403 and no change is made

#### Scenario: Every allowed edit writes an audit row
- **WHEN** a user with the `ce:manage-rules` permission successfully edits a score band
- **THEN** a `ce_rule_changes` record is created capturing that user, the timestamp, and the before/after values

### Requirement: Priority Queue Filter Is Single-Select
The Coordinated Entry priority queue (`GET /api/ce/priority-queue`) SHALL accept a single active quick filter (`TOP5 | VETERAN | YOUTH | SAFETY_ALERT | AWAITING_REFERRAL`, or none) rather than multiple simultaneously-active filters, and SHALL combine that filter with the search term when both are present.

#### Scenario: Priority queue filters are single-select and combine with search
- **WHEN** the `VETERAN` filter is active and a search term is also present
- **THEN** the response includes only veteran clients matching the search term, and selecting the `YOUTH` filter replaces the `VETERAN` filter rather than adding to it

#### Scenario: No filter active shows the full list
- **WHEN** no quick filter is active
- **THEN** the priority queue shows every client with a CE assessment, ranked by priority tier and score, filtered only by any search term present

## REMOVED Requirements

### Requirement: Prioritization List Quick Filters Compose
**Reason**: Replaced by "Priority Queue Filter Is Single-Select" — this change's priority-queue contract (`GET /api/ce/priority-queue?filter=...`) and frontend spec both call for a single active quick filter rather than independently-toggleable, AND-composed filters. Combining two quick filters (e.g. Veterans + Safety Alerts simultaneously) is no longer supported.
**Migration**: Any caller currently passing multiple simultaneous quick-filter flags must pass a single `filter` value instead; the frontend's `PrioritizationList.tsx` moves from five independent toggle buttons to a single-select `FilterChipRow`.
