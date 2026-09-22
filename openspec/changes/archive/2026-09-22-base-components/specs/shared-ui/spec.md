## ADDED Requirements

### Requirement: Navigation Rail
The system SHALL render a left navigation rail, persistent across all authenticated screens, listing items in this order: Home, My Clients, Cases, Assessments, Coordinated Entry, Resource Directory, Referrals (with nested Internal and Outbound items), Shelter Management (with nested Beds and Daily Log items), an Insights group (Data Quality, Reports), and a Tools group (Data Import, Training).

#### Scenario: Only implemented screens route to real pages
- **WHEN** a user clicks Home, My Clients, Cases, Assessments, or Coordinated Entry in the nav
- **THEN** the app routes to that screen's real page

#### Scenario: Unimplemented nav destinations render a route stub
- **WHEN** a user clicks Resource Directory, Referrals (or its Internal/Outbound children), Shelter Management (or its Beds/Daily Log children), or any Insights/Tools item
- **THEN** the app routes to a placeholder route-stub page for that destination, not a real screen

### Requirement: Navigation Rail Collapse
The navigation rail SHALL support collapsing to an icon-only width and expanding back to full width via a toggle control.

#### Scenario: Collapsing the rail
- **WHEN** the user activates the collapse toggle while the rail is expanded
- **THEN** the rail renders at icon-only width with item labels hidden

#### Scenario: Expanding the rail
- **WHEN** the user activates the collapse toggle while the rail is collapsed
- **THEN** the rail renders at full width with item labels visible

### Requirement: Referrals Badge
The navigation rail SHALL display an unread/open count badge next to the Referrals label, sourced from a stub value of 0 in this change.

#### Scenario: Referrals badge renders stub count
- **WHEN** the navigation rail renders
- **THEN** the Referrals item displays a badge showing the stub count (0)

### Requirement: Top Bar
The system SHALL render a top bar containing a global search input (placeholder text "Search clients, cases, referrals..."), a notifications bell with an unread-count badge, and a settings icon.

#### Scenario: Top bar controls render with stub behavior
- **WHEN** the top bar renders
- **THEN** the search input, notifications bell (with badge), and settings icon are visible and their interaction handlers are stubbed (no functional search, notification list, or settings navigation is required)

### Requirement: Shared Content-Area Template
The system SHALL provide a shared content-area template — a page-title band, followed by an optional KPI tile row, followed by the screen's main content — used by every routed screen instead of each screen rebuilding this layout.

#### Scenario: Screen renders via the shared template
- **WHEN** a routed screen (e.g. Home) mounts
- **THEN** it renders inside the shared content-area template with a page-title band and its own main content

#### Scenario: KPI tile row is optional
- **WHEN** a screen does not supply KPI tiles
- **THEN** the content-area template renders without a KPI tile row, with no layout gap or error

### Requirement: KpiTile Component
`packages/ui` SHALL export a `KpiTile` component displaying a large number, a label, and an optional muted qualifying sub-line, with a typed props interface, usable in rows of any tile count.

#### Scenario: KpiTile renders in a row of 4
- **WHEN** a page renders a KPI row with 4 `KpiTile` instances
- **THEN** all 4 tiles render correctly laid out in the row

#### Scenario: KpiTile renders in a row of 5
- **WHEN** a page renders a KPI row with 5 `KpiTile` instances
- **THEN** all 5 tiles render correctly laid out in the row

### Requirement: StatusBadge Component
`packages/ui` SHALL export a `StatusBadge` component rendering a colored pill with a single word or short phrase, with color driven by a single, centrally defined status-to-color map (e.g. red/similar for urgent or overdue, amber for warning, green for resolved or on-track, neutral gray for informational) rather than hardcoded per usage.

#### Scenario: StatusBadge color follows the shared map
- **WHEN** `StatusBadge` is rendered with a given status value
- **THEN** its color is resolved from the shared status-to-color map, not a value hardcoded at the call site

### Requirement: FilterChipRow Component
`packages/ui` SHALL export a `FilterChipRow` component rendering a horizontal row of single-select pill toggles, with the active chip visually filled and all other chips outlined.

#### Scenario: Only one chip is active at a time
- **WHEN** a user selects a chip in a `FilterChipRow` that already has a different chip active
- **THEN** the newly selected chip becomes the filled/active chip and the previously active chip returns to outlined/inactive, leaving exactly one active chip

### Requirement: DataTable Component
`packages/ui` SHALL export a generic, column-configurable `DataTable` component that supports an optional inline row-actions slot rendering icon buttons per row.

#### Scenario: DataTable renders configured columns
- **WHEN** `DataTable` is given a column configuration and row data
- **THEN** it renders a table with those columns and rows

#### Scenario: DataTable renders optional row actions
- **WHEN** `DataTable` is given a row-actions slot
- **THEN** each row renders the row-actions icon buttons inline without requiring the record to be opened

### Requirement: PageHeader Component
`packages/ui` SHALL export a `PageHeader` component rendering a title and an optional action-button row (e.g. "New Intake", "New Referral", "New Case" style groups).

#### Scenario: PageHeader renders without actions
- **WHEN** `PageHeader` is given only a title
- **THEN** it renders the title with no action-button row

#### Scenario: PageHeader renders with actions
- **WHEN** `PageHeader` is given a title and one or more actions
- **THEN** it renders the title alongside the action-button row

### Requirement: StatusStepper Interface Reservation
`packages/ui` SHALL define a typed props interface for a `StatusStepper` component — a horizontal sequence of named stages with the current stage highlighted and support for a stage with more than one possible terminal branch — in an obvious, dedicated location within the package structure, without requiring a working implementation in this change.

#### Scenario: StatusStepper location is discoverable
- **WHEN** a future change implements the Referrals module's status stepper
- **THEN** it finds an existing `StatusStepper` file/location in `packages/ui` with a defined props interface to implement against

### Requirement: Component Isolated Preview
Every shared component introduced in this change (`KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, `StatusStepper`) SHALL have an isolated preview (Storybook or equivalent) that can be viewed independent of any screen.

#### Scenario: Component preview available without a host screen
- **WHEN** a developer opens the isolated preview tool
- **THEN** every shared component listed above has at least one preview entry, viewable without navigating to an application screen
