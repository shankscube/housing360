## ADDED Requirements

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

## MODIFIED Requirements

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
