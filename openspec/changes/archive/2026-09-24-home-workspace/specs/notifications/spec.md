# notifications

## Purpose

The top bar's notifications bell: pending inbound referrals and referral status updates the requesting case manager hasn't seen yet, backed by a `referral_status_events` audit trail written on every referral status transition (including a referral's initial creation).

## ADDED Requirements

### Requirement: A status event is written on every referral status transition
The system SHALL write one `referral_status_events` row (`referralId`, `fromStatus`, `toStatus`, `changedBy`, `changedAt`) whenever a referral's `status` changes, including at creation (`fromStatus: null`, `toStatus` = the referral's initial status) — from both the internal Referrals-tab flow and Coordinated Entry's Send Referral step.

#### Scenario: Creating a referral writes an initial status event
- **WHEN** a new referral is created with status `pending` or `new`
- **THEN** a `referral_status_events` row is written with `fromStatus: null`, `toStatus` equal to that initial status, and `changedBy` equal to the creating user

#### Scenario: Accepting or declining a referral writes a status event
- **WHEN** a referral's status changes via accept, decline, or an edit that changes `status`
- **THEN** a `referral_status_events` row is written recording the prior status, the new status, and who made the change

#### Scenario: A referral's sender is derivable from its earliest status event
- **WHEN** the system needs to know who originally sent a referral
- **THEN** it SHALL be the `changedBy` of that referral's `referral_status_events` row with the earliest `changedAt`

### Requirement: Aggregate notifications endpoint
The system SHALL expose `GET /api/notifications`, behind `requireAuth`, returning `pendingReferrals` (referrals routed to the requesting case manager's organization or programs with status `new`, each with title, client, and program) and `statusUpdates` (status events on referrals the requesting user sent that they have not yet seen, each with title and status label).

#### Scenario: Pending referrals reflect the unclaimed/self-assigned inbound queue
- **WHEN** `Referral` rows exist with `status = 'new'` and either no case or a case assigned to the requesting user
- **THEN** `pendingReferrals` includes exactly those rows, each with title, client name, and program name

#### Scenario: Status updates are scoped to referrals the requester sent, not seen, and not their own action
- **WHEN** a referral the requesting user sent has a status event with `seenByReferrerAt: null` and `changedBy` other than the requesting user
- **THEN** that event appears in `statusUpdates` with a title and a human-readable status label

#### Scenario: Both sections render "No new notifications right now." when empty
- **WHEN** `pendingReferrals` and `statusUpdates` are both empty
- **THEN** the notifications panel shows "No new notifications right now." instead of two empty sections

### Requirement: Marking status updates as seen
The system SHALL expose `POST /api/notifications/status-updates/seen`, marking every currently-unseen status update belonging to the requesting user as seen, and the notifications panel SHALL reflect that immediately.

#### Scenario: Marking seen clears the update from future notification loads
- **WHEN** the requesting user calls `POST /api/notifications/status-updates/seen`
- **THEN** every `referral_status_events` row that was included in their `statusUpdates` gets `seenByReferrerAt` set to the current time, and a subsequent `GET /api/notifications` no longer includes those events

#### Scenario: Clicking a status update marks it seen and opens the referral
- **WHEN** the case manager clicks a Referral Updates item in the notifications panel
- **THEN** the system marks that update seen and navigates to the referral's owning case (or, if the referral has no case yet, marks it seen without navigating)

### Requirement: Notification bell badge reflects the total count
The bell SHALL display a badge equal to the combined count of `pendingReferrals` and unseen `statusUpdates`, and SHALL show no badge (or a zero state) when both are empty.

#### Scenario: Badge count matches the sum of both sections
- **WHEN** there are 2 pending referrals and 1 unseen status update
- **THEN** the bell badge shows 3

#### Scenario: New case manager with no referral activity sees an empty badge
- **WHEN** the requesting case manager has never sent or received a referral
- **THEN** the bell badge shows 0 and opening the panel shows "No new notifications right now."
