## ADDED Requirements

### Requirement: Tabs Component
`apps/web/src/components/ui` SHALL export a generic, content-agnostic `Tabs` component that renders a configurable set of tab labels and an active-tab indicator, styled from theme tokens only, with no knowledge of what any tab panel contains.

#### Scenario: Tabs renders configured tab set
- **WHEN** `Tabs` is given an ordered list of tab keys and labels and an active key
- **THEN** it renders each tab label and visually distinguishes the active tab

#### Scenario: Selecting a tab notifies the consumer
- **WHEN** a user selects a different tab
- **THEN** `Tabs` invokes its change callback with the newly selected tab's key, and does not itself decide what content renders for it
