# activity-feed

## Purpose

A generic, service-written `record_activity` log covering views and edits of Clients, Cases, Referrals, and Assessments, feeding the Home screen's Recently Accessed panel and the standalone Recently Modified page.

## ADDED Requirements

### Requirement: Services write record_activity on view and modify, not controllers
The system SHALL write one `record_activity` row (`userId`, `recordType`, `recordId`, `action`, `at`) whenever a client, case, referral, or assessment is viewed (its detail is read) or modified (created or updated), written from each domain's service layer so every module feeds the log the same way.

#### Scenario: Viewing a client's detail records a "viewed" activity
- **WHEN** the requesting user calls the client detail endpoint for a given client
- **THEN** a `record_activity` row is written with `recordType: 'client'`, that client's id, `action: 'viewed'`, and the requesting user's id

#### Scenario: Editing a case records a "modified" activity
- **WHEN** the requesting user updates a case's fields
- **THEN** a `record_activity` row is written with `recordType: 'case'`, that case's id, and `action: 'modified'`

#### Scenario: Referrals and assessments follow the same pattern
- **WHEN** the requesting user views or edits a referral or an assessment
- **THEN** a corresponding `record_activity` row is written with `recordType` of `'referral'` or `'assessment'`

#### Scenario: A logging failure never blocks the underlying operation
- **WHEN** writing a `record_activity` row fails for any reason
- **THEN** the triggering view or edit operation still succeeds and returns normally

### Requirement: Recently Accessed is deduplicated to the latest action per record
Reads over `record_activity` (Home's Recently Accessed panel and the Recently Modified page) SHALL return at most one entry per distinct record, reflecting that record's most recent action and timestamp, even though the underlying table may hold multiple rows for the same record.

#### Scenario: Viewing then editing the same case yields one feed entry
- **WHEN** a case is viewed and later edited by the same user
- **THEN** the Recently Accessed feed shows exactly one entry for that case, with `action: 'modified'` and the edit's timestamp

#### Scenario: Viewing or editing a record adds it to the top exactly once
- **WHEN** any client, case, referral, or assessment is viewed or edited
- **THEN** it appears in the requesting user's Recently Accessed feed exactly once, ordered at the top by most recent activity

### Requirement: Recent activity is scoped to the acting user
`GET /api/recent-activity` and Home's `recentlyAccessed` SHALL return only activity performed by the requesting user, not activity performed by other case managers.

#### Scenario: Another user's activity is excluded
- **WHEN** a different case manager views or edits a record
- **THEN** that activity does not appear in the requesting user's Recently Accessed feed or Recently Modified page

### Requirement: Paginated, filterable recent-activity endpoint
The system SHALL expose `GET /api/recent-activity?type=all|cases|referrals|clients|assessments&page=`, filtering by record type and paginating results, newest first.

#### Scenario: Filtering by type narrows the feed
- **WHEN** `GET /api/recent-activity?type=cases` is requested
- **THEN** the response includes only case activity, newest first

#### Scenario: An empty feed renders its empty state
- **WHEN** the requesting user has no recorded activity yet
- **THEN** the response is an empty, successful (200) result, and the Recently Modified page shows "Nothing found for this filter."

### Requirement: Home's Recently Accessed panel shows the 5 newest items with a type icon
The Home screen's Recently Accessed panel SHALL show the 5 most recent distinct-record activity entries for the requesting user, each with a type icon, and a "View All" link to the Recently Modified page.

#### Scenario: A brand-new user sees the empty state
- **WHEN** the requesting user has never viewed or edited any client, case, referral, or assessment
- **THEN** the Recently Accessed panel shows "Nothing updated in your caseload yet."

#### Scenario: "View All" opens the Recently Modified page
- **WHEN** the case manager clicks "View All" on the Recently Accessed panel
- **THEN** the Recently Modified page (`/recent`) opens

### Requirement: Recently Modified page lists, filters, and paginates the requester's own activity
The Recently Modified page (`/recent`) SHALL show the subtitle "Cases, referrals, clients, and assessments from your own caseload, newest first," filter tabs (All, Cases, Referrals, Clients, Assessments), a Refresh action, and Prev/Next pagination.

#### Scenario: Switching filter tabs re-fetches the scoped feed
- **WHEN** the case manager selects the "Referrals" filter tab
- **THEN** the page shows only referral activity, newest first

#### Scenario: Refresh re-fetches the current filter's feed
- **WHEN** the case manager clicks Refresh
- **THEN** the page re-fetches the currently selected filter's activity

#### Scenario: Pagination moves between pages of results
- **WHEN** the case manager clicks "Next ›"
- **THEN** the next page of results for the current filter loads, and "‹ Prev" becomes available
