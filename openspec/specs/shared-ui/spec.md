# shared-ui

## Purpose

Shared application shell (navigation rail, top bar, content-area template) and a set of reusable `apps/web/src/components/ui` components (icons, KPI tiles, status badges, filter chips, data tables, page headers, status steppers) used across Housing360's screens, plus the design-token theme those components resolve every visual value from, and an isolated component-preview workflow. Visuals are held to `docs/Housing360 Portal.html`, the approved design reference. These are `apps/web`-only components, not a separate workspace package — see the repo's `CLAUDE.md` for why. TBD: expand as future changes add more shared components.

## Requirements

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
`apps/web/src/components/ui` SHALL export a `KpiTile` component displaying a large number, a label, and an optional muted qualifying sub-line, with a typed props interface, usable in rows of any tile count.

#### Scenario: KpiTile renders in a row of 4
- **WHEN** a page renders a KPI row with 4 `KpiTile` instances
- **THEN** all 4 tiles render correctly laid out in the row

#### Scenario: KpiTile renders in a row of 5
- **WHEN** a page renders a KPI row with 5 `KpiTile` instances
- **THEN** all 5 tiles render correctly laid out in the row

### Requirement: StatusBadge Component
`apps/web/src/components/ui` SHALL export a `StatusBadge` component rendering a colored pill with a single word or short phrase, with color driven by a single, centrally defined status-to-color map rather than hardcoded per usage. The map SHALL define the six tones used by the design bundle — `teal` (positive/active), `navy` (neutral-emphatic), `blue` (informational/in-progress), `gold` (waiting/warning), `coral` (urgent/overdue/rejected), and `quiet` (deemphasized) — each as a fill and text pair taken from the bundle.

#### Scenario: StatusBadge color follows the shared map
- **WHEN** `StatusBadge` is rendered with a given status value
- **THEN** its color is resolved from the shared status-to-color map, not a value hardcoded at the call site

#### Scenario: Every tone is defined
- **WHEN** any of the six tones is requested
- **THEN** the shared map returns that tone's fill and text pair, matching the design bundle's badge treatment

### Requirement: FilterChipRow Component
`apps/web/src/components/ui` SHALL export a `FilterChipRow` component rendering a horizontal row of single-select pill toggles, with the active chip visually filled and all other chips outlined.

#### Scenario: Only one chip is active at a time
- **WHEN** a user selects a chip in a `FilterChipRow` that already has a different chip active
- **THEN** the newly selected chip becomes the filled/active chip and the previously active chip returns to outlined/inactive, leaving exactly one active chip

### Requirement: DataTable Component
`apps/web/src/components/ui` SHALL export a generic, column-configurable `DataTable` component that supports an optional inline row-actions slot rendering icon buttons per row.

#### Scenario: DataTable renders configured columns
- **WHEN** `DataTable` is given a column configuration and row data
- **THEN** it renders a table with those columns and rows

#### Scenario: DataTable renders optional row actions
- **WHEN** `DataTable` is given a row-actions slot
- **THEN** each row renders the row-actions icon buttons inline without requiring the record to be opened

### Requirement: PageHeader Component
`apps/web/src/components/ui` SHALL export a `PageHeader` component rendering a title and an optional action-button row (e.g. "New Intake", "New Referral", "New Case" style groups). Action buttons SHALL support the design bundle's three visual variants — a filled primary, a filled secondary/accent, and an outlined tertiary — and SHALL render through the shared `Button` component rather than defining their own styling, so a page-header action and a standalone button of the same variant cannot drift apart.

#### Scenario: PageHeader renders without actions
- **WHEN** `PageHeader` is given only a title
- **THEN** it renders the title with no action-button row

#### Scenario: PageHeader renders with actions
- **WHEN** `PageHeader` is given a title and one or more actions
- **THEN** it renders the title alongside the action-button row

#### Scenario: Action variants are visually distinct
- **WHEN** `PageHeader` renders actions declaring the primary, secondary, and tertiary variants
- **THEN** each renders in its distinct bundle-matching treatment, with the variant styling resolved from theme tokens

#### Scenario: PageHeader actions and standalone buttons match
- **WHEN** a `PageHeader` action and a standalone `Button` declare the same variant and size
- **THEN** they render identically, because both resolve their styling from the same shared component

### Requirement: StatusStepper Component
`apps/web/src/components/ui` SHALL export a working `StatusStepper` component — a horizontal sequence of named stages with the current stage highlighted, stages before it shown as completed, connectors between stages, and support for a stage with more than one possible terminal branch — styled to match the design bundle's referral stepper. Its props interface remains the one reserved in the previous change.

#### Scenario: Current and completed stages are distinguished
- **WHEN** `StatusStepper` renders with a current stage partway along the sequence
- **THEN** stages up to and including the current one render in the completed/active treatment and later stages render in the inactive treatment, with the connectors between completed stages filled

#### Scenario: Terminal branch renders
- **WHEN** `StatusStepper` renders a stage set that includes a terminal branch (for example a referral's `Rejected` outcome)
- **THEN** the branch renders as a terminal node after the linear sequence, in its inactive treatment when not reached and in its own terminal treatment when it is the current stage

#### Scenario: Preview entry exists without a consumer screen
- **WHEN** a developer opens the isolated preview tool
- **THEN** `StatusStepper` has preview entries covering its stage states and its terminal branch, independent of any application screen

### Requirement: Component Isolated Preview
Every shared component introduced in this change (`KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, `StatusStepper`) SHALL have an isolated preview (Storybook or equivalent) that can be viewed independent of any screen.

#### Scenario: Component preview available without a host screen
- **WHEN** a developer opens the isolated preview tool
- **THEN** every shared component listed above has at least one preview entry, viewable without navigating to an application screen

### Requirement: Theme Is The Only Source Of Design Values
The Tailwind theme file (`apps/web/src/theme/tokens.ts`, consumed by `apps/web/tailwind.config.ts`) SHALL be the only source of color, spacing, radius, shadow, and typography values used by components in `apps/web/src/components/ui` and `apps/web/src/components/layout`. No component in those directories SHALL contain an inline hex color, an arbitrary Tailwind value (e.g. `bg-[#0E2242]`, `text-[10px]`, `min-w-[10rem]`), or an unnamed pixel/rem literal. Any value required by `docs/Housing360 Portal.html` that is not yet in the theme SHALL be added to the theme, named for its role (e.g. `border-subtle`, `surface-muted`) rather than its raw value.

#### Scenario: No hardcoded design values in shared components
- **WHEN** the source of every file under `apps/web/src/components/ui` and `apps/web/src/components/layout` is searched for hex color literals, bracketed arbitrary Tailwind values, and bare pixel/rem literals
- **THEN** no match is found, and every color, spacing, radius, shadow, and type value in those files resolves through a theme-defined Tailwind class

#### Scenario: A value missing from the theme is added to the theme
- **WHEN** a component needs a color, spacing, radius, shadow, or type value from the design bundle that the theme does not yet define
- **THEN** the value is added to `apps/web/src/theme/tokens.ts` under a role-descriptive name and consumed via the generated Tailwind class, rather than inlined at the call site

#### Scenario: Preview tool shares the same theme
- **WHEN** the isolated component preview renders a shared component
- **THEN** it resolves the same theme values as the main app, with no duplicated palette or scale of its own

### Requirement: Status Word To Tone Mapping
`apps/web/src/components/ui` SHALL provide a single, centrally defined map from status word to status tone, covering every status word used across the batch-1 screens (My Clients, Cases, Assessments, Coordinated Entry) — including `Enrolled`, `Awaiting referral`, `Intake started`, `Active`, `Pending review`, `Closed`, `High`, `Medium`, `Low`, `Completed`, `Due today`, `In progress`, `Overdue`, `Entry`, `Annual`, and `Exit`. `StatusBadge` SHALL resolve its tone from this map by default, and SHALL accept an explicit tone that overrides the map for statuses whose meaning is domain-specific.

#### Scenario: A batch-1 status word resolves without a call-site tone
- **WHEN** `StatusBadge` is rendered with a status word used on any batch-1 screen and no explicit tone
- **THEN** its tone is resolved from the shared status-word map, and its fill and text colors come from the shared tone-to-color map

#### Scenario: An explicit tone overrides the map
- **WHEN** `StatusBadge` is rendered with both a status word present in the map and an explicit tone
- **THEN** the explicit tone is used, so a word that means different things in different domains (e.g. `Enrolled` as a program status versus a referral stage) can render differently

#### Scenario: An unmapped status word degrades safely
- **WHEN** `StatusBadge` is rendered with a status word that is not in the map and no explicit tone
- **THEN** it renders with the neutral/deemphasized tone rather than throwing or rendering without color

### Requirement: DataTable Empty And Loading States
`DataTable` SHALL render a dedicated empty-state row when it has no rows, and a dedicated loading-state row while its data is in flight, each spanning the full column set. When both conditions apply, the loading state SHALL take precedence.

#### Scenario: Empty state
- **WHEN** `DataTable` is rendered with an empty row set and is not loading
- **THEN** it renders its configured column headers plus a single full-width row carrying the empty-state message, and no data rows

#### Scenario: Loading state
- **WHEN** `DataTable` is rendered in a loading state
- **THEN** it renders its configured column headers plus a single full-width loading-state row, and no data rows

#### Scenario: Loading takes precedence over empty
- **WHEN** `DataTable` is rendered in a loading state with an empty row set
- **THEN** it renders the loading-state row, not the empty-state row

### Requirement: Visual Parity With The Design Bundle
The shared shell (`apps/web/src/components/layout`) and every component in `apps/web/src/components/ui` SHALL match the corresponding section of `docs/Housing360 Portal.html` in color, typography, spacing, radius, shadow, iconography, and interactive state treatment (active, selected, hover). Where the bundle provides no reference for a state the application requires, the existing layout SHALL be retained and re-tokenized rather than redesigned, and the gap SHALL be recorded as an open item.

#### Scenario: Navigation rail matches the bundle
- **WHEN** the navigation rail renders
- **THEN** its item spacing, active-item treatment, group headers, referral count badge, and icons match the bundle, with icons drawn from the shared icon set rather than text or emoji placeholders

#### Scenario: Components match the bundle
- **WHEN** `KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, or the top bar renders
- **THEN** its typography, spacing, fills, borders, radius, shadow, and hover/active states match the corresponding section of the bundle

#### Scenario: A state with no bundle reference is re-tokenized, not redesigned
- **WHEN** a required state has no counterpart in the bundle (for example the login screen, or the navigation rail's collapsed state)
- **THEN** its existing layout is preserved and restyled using theme tokens only, and the missing reference is recorded as an open item rather than a new design being invented

### Requirement: Side-By-Side Preview Against The Bundle
Every shared component's entry in the isolated preview tool SHALL identify which screen and section of `docs/Housing360 Portal.html` it corresponds to, so a reviewer can compare the two directly. Preview coverage SHALL include every `StatusBadge` tone, the full status-word map, and `DataTable`'s empty and loading states.

#### Scenario: Preview entry names its bundle reference
- **WHEN** a developer opens a component's entry in the isolated preview tool
- **THEN** the entry states which screen and section of the design bundle it mirrors, and points at the bundle file

#### Scenario: New states and tones are previewable
- **WHEN** a developer opens the isolated preview tool
- **THEN** every status tone, every mapped status word, and `DataTable`'s empty and loading states each have a preview entry

### Requirement: Button Component
`apps/web/src/components/ui` SHALL export a `Button` component rendering the design bundle's action-button treatments, with a typed props interface exposing a visual variant — `primary` (filled navy), `secondary` (filled teal), `tertiary` (outlined) — and a size — `md` (page-level) and `sm` (in-card) — with all styling resolved from the theme. Any shared or screen-level code needing one of these buttons SHALL render `Button` rather than restyling a bare `<button>`.

#### Scenario: Variants are visually distinct
- **WHEN** `Button` is rendered with each of the three variants
- **THEN** each renders in its distinct bundle-matching treatment, with fills, borders, text color and hover states resolved from theme tokens

#### Scenario: Sizes are distinct
- **WHEN** `Button` is rendered at `md` and at `sm`
- **THEN** the two differ in padding and type size, matching the bundle's page-level and in-card buttons respectively

#### Scenario: Defaults require no configuration
- **WHEN** `Button` is rendered with neither a variant nor a size
- **THEN** it renders as a `primary`, `md` button

#### Scenario: Standard button behavior is preserved
- **WHEN** `Button` is given native button attributes such as `type`, `disabled`, or an accessible label
- **THEN** they apply to the underlying button element, and a `Button` inside a form does not submit unless it declares `type="submit"`

#### Scenario: Disabled state is defined once
- **WHEN** any `Button` is rendered in a disabled state
- **THEN** it renders the single shared disabled treatment, rather than a treatment defined at the call site

#### Scenario: Button is previewable in isolation
- **WHEN** a developer opens the isolated preview tool
- **THEN** `Button` has preview entries covering every variant, both sizes, and the disabled state, with its bundle reference named

### Requirement: Tabs Component
`apps/web/src/components/ui` SHALL export a generic, content-agnostic `Tabs` component that renders a configurable set of tab labels and an active-tab indicator, styled from theme tokens only, with no knowledge of what any tab panel contains.

#### Scenario: Tabs renders configured tab set
- **WHEN** `Tabs` is given an ordered list of tab keys and labels and an active key
- **THEN** it renders each tab label and visually distinguishes the active tab

#### Scenario: Selecting a tab notifies the consumer
- **WHEN** a user selects a different tab
- **THEN** `Tabs` invokes its change callback with the newly selected tab's key, and does not itself decide what content renders for it
