# release-of-information

## Purpose

Client consent tracking for releasing/receiving confidential information: the shared Release of Information form, its default 365-day expiry, and the single shared "active consent" status endpoint consumed by both the Plan tab's Refer-to-Partner flow and the Health and Wellness tab. Added by `case-workspace`.

## Requirements

### Requirement: Release of Information Form Captures Consent
The system SHALL provide a shared "Authorization to Release and Receive Confidential Information" form capturing the client's legal name and date of birth (pre-filled), recipient organization and contact details, a yes/no selection per information type (case management, day-to-day activity, mental health, chemical dependency, HIV/AIDS, other), purpose, the authorization text, client and staff signatures with Clear controls and signed dates, the 42 CFR Part 2 re-disclosure notice, and an expiry date.

#### Scenario: Client name and DOB pre-fill from the client record
- **WHEN** a case manager opens the Release of Information form for a client
- **THEN** the client's legal name and date of birth are pre-filled from the client record

#### Scenario: The authorization text and re-disclosure notice come from one configuration source
- **WHEN** the Release of Information form renders
- **THEN** its authorization text and 42 CFR Part 2 re-disclosure notice match a single named configuration value, with no other copy of that text inline in the form component

#### Scenario: A signature can be cleared and re-signed
- **WHEN** a case manager clears a signature pad and signs again
- **THEN** the form retains only the most recent signature and its signed date

### Requirement: Release of Information Expires 365 Days After Signing by Default
The system SHALL default a release of information's expiry date to 365 days after its signed date when no expiry date is given, and SHALL accept an explicit expiry date when provided.

#### Scenario: Omitting an expiry date defaults to 365 days out
- **WHEN** a release of information is saved with a signed date and no expiry date
- **THEN** its expiry date is stored as 365 days after the signed date

#### Scenario: An explicit expiry date is respected
- **WHEN** a release of information is saved with an explicit expiry date
- **THEN** that expiry date is stored instead of the 365-day default

### Requirement: Active Consent Requires an Unrevoked, Unexpired Release of Information
The system SHALL treat a client as having active consent only when at least one of their release-of-information records is both unrevoked and unexpired, and SHALL expose this status through a single shared endpoint used by every consumer.

#### Scenario: An unrevoked, unexpired release of information grants active consent
- **WHEN** a client has a release of information with no revocation and an expiry date in the future
- **THEN** the client's consent status is active

#### Scenario: An expired release of information does not grant active consent
- **WHEN** a client's only release of information has an expiry date in the past
- **THEN** the client's consent status is not active

#### Scenario: A revoked release of information does not grant active consent
- **WHEN** a client's only release of information has been revoked
- **THEN** the client's consent status is not active, even if its expiry date is still in the future
