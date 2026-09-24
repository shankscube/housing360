## ADDED Requirements

### Requirement: Coordinated Entry Is a 4-Step Linear Flow
The system SHALL present Coordinated Entry as a 4-step linear flow — Vulnerability Assessment, Recommended Program Types, Partner Agencies, Send Referral — with a visual stepper reflecting the current step, and SHALL NOT allow advancing to a later step until the current step's action has completed successfully.

#### Scenario: Stepper starts at step 1
- **WHEN** Coordinated Entry is opened for a client
- **THEN** the stepper shows "Vulnerability Assessment" as the current step and the later three steps as unreached

#### Scenario: A completed vulnerability assessment produces a score and advances the stepper
- **WHEN** the Vulnerability Assessment step is submitted with intake answers
- **THEN** the system calls `ScoringService.scoreVulnerability`, persists the resulting score and priority tier, and the stepper advances to "Recommended Program Types"

#### Scenario: A step cannot be skipped without completing the previous one
- **WHEN** no vulnerability assessment has been completed for the current session
- **THEN** "Recommended Program Types," "Partner Agencies," and "Send Referral" are not reachable

### Requirement: Recommended Programs Reflect the Vulnerability Priority Tier
`GET /api/coordinated-entry/recommended-programs` SHALL return active programs ranked according to the priority tier produced by the client's most recent vulnerability assessment.

#### Scenario: High-priority tier surfaces different programs than low
- **WHEN** one client's vulnerability assessment resolves to priority tier `high` and another's resolves to `low`
- **THEN** the recommended-programs response for each client reflects an ordering appropriate to that client's tier, and the two responses are not required to be identical

### Requirement: Partner Agencies Are Filterable by Service Domain
`GET /api/coordinated-entry/partner-agencies` SHALL return partner organizations, filterable by service domain, reusing the same organization/service-domain data the rest of the app already maintains.

#### Scenario: Agencies list is scoped to a service domain
- **WHEN** partner agencies are requested for a specific service domain
- **THEN** only organizations offering that service domain are returned

### Requirement: Send Referral Creates a Referral Record Without Requiring a Referrals UI
`POST /api/coordinated-entry/referrals` SHALL create a referral record (client, program, provider, status `new`) that is queryable by the existing referral-listing capability, without requiring any new referral list or detail screen to be built as part of this capability.

#### Scenario: Sending a referral creates a record with the expected fields
- **WHEN** step 4 is submitted with a chosen recommended program and a chosen partner agency
- **THEN** a referral record is created with that client, that program, that provider, and status `new`

#### Scenario: The created referral is visible to existing referral listings
- **WHEN** a coordinated-entry referral has been created for a client who later has a case opened
- **THEN** that referral appears when that case's referrals are listed, without any coordinated-entry-specific referral UI existing

#### Scenario: Completing step 4 finishes the flow
- **WHEN** "Send Referral" succeeds
- **THEN** the stepper shows step 4 as reached/complete and the flow reports the referral was sent

### Requirement: Prioritization List Quick Filters Compose
The Prioritization List SHALL support five quick filters — Top 5 High Priority, Veterans, Unaccompanied Youth, Safety Alerts, Awaiting Referral — each independently toggleable, applied together as an AND (composable), not as a mutually-exclusive single-select group.

#### Scenario: Two quick filters combine
- **WHEN** both "Veterans" and "Safety Alerts" are active
- **THEN** only clients who are both veterans and have an active safety alert are shown

#### Scenario: "Top 5 High Priority" composes with another filter rather than overriding it
- **WHEN** "Top 5 High Priority" and "Veterans" are both active
- **THEN** the result is the 5 highest-priority veterans, not the 5 highest-priority clients overall

#### Scenario: No quick filters active shows the full list
- **WHEN** no quick filter is active
- **THEN** the Prioritization List shows every client with a vulnerability assessment, ranked by priority tier and score

### Requirement: Prioritization List Reflects Persisted Vulnerability Assessments
`GET /api/coordinated-entry/prioritization-list` SHALL be backed by persisted vulnerability assessment records, ranked by priority tier and score, and SHALL reflect assessments completed by any user, not only the current session's flow.

#### Scenario: A newly completed vulnerability assessment appears on the list
- **WHEN** a vulnerability assessment is completed for a client not previously on the Prioritization List
- **THEN** that client subsequently appears on the Prioritization List
