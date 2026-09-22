## Why

Every screen in the upcoming batch (Home, My Clients, Cases, Assessments, Coordinated Entry) needs to sit inside the same navigation shell, use the same reusable UI primitives, and sit behind a login gate. Building this shared shell, component library, and minimal auth now — rather than letting each screen improvise its own nav/layout/components — avoids inconsistent UX and duplicated work across the batch.

## What Changes

- Add a persistent app shell to `apps/web`: left navigation rail (with grouped/nested items, a live badge stub for Referrals, and collapse/expand to icon-only width) and a top bar (search input, notifications bell with unread badge, settings icon — all stubbed, non-functional beyond rendering).
- Add a shared content-area template (page-title band → optional KPI tile row → main content) used by every routed screen instead of being rebuilt per screen.
- Add route stubs for all non-implemented nav destinations (Resource Directory, Referrals > Internal/Outbound, Shelter Management > Beds/Daily Log, Insights > Data Quality/Reports, Tools > Data Import/Training).
- Add a `packages/ui` component library with typed, screen-agnostic components: `KpiTile`, `StatusBadge` (single status-to-color map), `FilterChipRow` (single-select), `DataTable` (column-configurable, optional inline row-actions), `PageHeader` (title + optional action-button row). Reserve (interface only, no implementation) a `StatusStepper` component for the future Referrals module.
- Add a Storybook (or equivalent) isolated preview setup in `packages/ui` covering every shared component built in this change.
- Add minimal auth to `apps/api` + `apps/web`: a single seeded demo case-manager user, session- or JWT-based login/logout, an auth middleware/guard that redirects unauthenticated screen requests to a login page, and a "Welcome, [First Name]" value available to any screen. Explicitly out of scope: registration, password reset, roles/permissions.

## Capabilities

### New Capabilities
- `shared-ui`: the persistent app shell (nav rail, top bar, content-area template, route stubs) and the `packages/ui` reusable component library (`KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, reserved `StatusStepper`), plus the isolated component preview setup.
- `auth`: seeded demo user, login/logout flow, session/token issuance, route-level auth guard with redirect-to-login, and the current-user "Welcome, [First Name]" value.

### Modified Capabilities
(none — `apps/web` and `apps/api` exist only as scaffolding from `project-setup`; no prior spec-level behavior is being changed)

## Impact

- **`packages/ui`**: new package — components, `StatusStepper` interface stub, Storybook/preview config, status-color map. Consumed by `apps/web`.
- **`apps/web`**: new shell layout, router changes (nested routes, auth guard, login page, route stubs for unbuilt sections), new `packages/ui` dependency, global search/notifications/settings UI stubs, auth state (current user, login/logout) wired into Redux.
- **`apps/api`**: new `auth` domain (routes/controllers/services per the existing layering convention), a seeded case-manager user, session or JWT issuance/verification, an auth middleware applied to protected routes.
- **Database**: adds a real Prisma model for the seeded user (first model beyond the placeholder `AppMeta`), plus a seed script.
- No changes to existing `project-setup` scaffolding conventions (layering, responder shape, logging, env loading) — this change builds within them.
