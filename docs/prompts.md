# Housing360 rebuild — OpenSpec prompt sequence

2026-09-22 · Prepared by @Shashank for CUBE84

## How to use this document

Six prompts, run in order. Each one is a single OpenSpec change: run `opsx:propose` with the prompt text as-is, review the generated proposal and spec deltas, then `opsx:apply` before moving to the next prompt. Don't start a screen's prompt before the phase before it lands; several screens share components and data that only exist once earlier phases are applied.

Build order follows data dependency, not nav order. My Clients comes before Cases, Cases before Assessments and Coordinated Entry, and Home comes last, because Home is a rollup dashboard reading from all of them. Building it first would mean building it twice.

Two assumptions, stated so they can be overridden in Phase 0 if they're wrong: TypeScript across both apps (drop the type annotations for plain JS, everything else holds), and MySQL as the primary store behind the repository layer, read from the root `.env` (if the `.env` points at MongoDB instead, only the model layer's implementation changes; the repository interfaces described below don't).

Put the design file at `docs/Housing360_Portal.html` and this document, exported, at `docs/openspec-prompts.md` before starting Phase 0, so every prompt below can point at both. Each screen prompt also carries its own field-level and behavior detail, so it doesn't depend on this project's memory once it's in the repo.

**Correction (2026-09-22, after Phase 1):** Phase 0 and Phase 1 below mention a `packages/ui` workspace package for shared components — that's the historical prompt text (already executed) so it's left as-is here, but it was tried twice and reverted both times: `apps/web` is the only consumer, so shared/reusable components live at `apps/web/src/components/ui/` instead, with no separate package. See the repo's `CLAUDE.md` (Standing rules). Phase 2 onward below has been corrected to say `apps/web/src/components/ui` directly, since those prompts haven't run yet.

## Phase 0 — Project setup and scaffolding

```markdown
Propose an OpenSpec change called `project-setup` for a fresh Turborepo monorepo that will hold the Housing360 rebuild: a Node.js/Express API and a React frontend, built to CUBE84's standing dev standards.

Structure:
- `apps/web` — React 18, Vite, Tailwind CSS, Redux Toolkit, TypeScript.
- `apps/api` — Node.js, Express, TypeScript.
- `packages/ui` — shared, framework-agnostic React components (built out in the next phase, empty scaffold for now).
- `packages/types` — shared TypeScript types/interfaces used by both apps.
- `packages/config` — shared ESLint, Prettier, and tsconfig base configs.
- `docs/` — already contains `Housing360_Portal.html` (the approved design) and this prompt sequence. Do not move or rename it.

Backend:
- Repository pattern throughout: routes → controllers → services → models. No controller talks to a model directly.
- Read all database connection details from the root `.env` (do not hardcode credentials, do not print or log raw values). Detect the engine from the `.env` variables present and configure the ORM accordingly; default to MySQL with Prisma if the `.env` is ambiguous.
- A common responder utility used by every controller, returning `{ success, code, message, data }` on success and adding an `errors` array on failure. No endpoint constructs its own response shape.
- A logger utility (structured, not console.log) applied to every endpoint via middleware: method, path, status, duration, and a request id, at minimum.
- Centralized error-handling middleware; controllers throw, they don't format error responses inline.
- Health-check endpoint (`GET /health`) that also confirms the DB connection.

Frontend:
- Redux Toolkit store with one slice per domain module (clients, cases, assessments, coordinatedEntry, dashboard), each in its own file; no god slice.
- Tailwind configured with a theme file (colors, spacing, type scale) as a single source of truth, not inline hex values scattered through components.
- React Router with route stubs for Home, My Clients, Cases, Assessments, Coordinated Entry (empty pages returning a placeholder for now).
- An API client layer (one module) that every slice's thunks go through, not fetch calls scattered across components.

Root:
- Root `.env.example` documenting every variable the app expects, with no real values.
- Root README covering how to run both apps, environment setup, and where the design file and this prompt sequence live.
- Turborepo `turbo.json` with `dev`, `build`, `lint`, and `test` pipelines wired for both apps.

Write the spec delta for a `project-scaffold` capability covering: the repository-pattern layering is enforced (not just documented), the responder shape is consistent across every endpoint, the logger runs on every endpoint, and the frontend route stubs render without console errors. Include a tasks checklist that ends with `turbo dev` running both apps cleanly from a fresh clone with only `.env` filled in.
```

## Phase 1 — Base components and shared infrastructure

```markdown
Propose an OpenSpec change called `base-components` that builds the shared shell and reusable component library every screen in this batch sits inside, plus a minimal auth scaffold. Build these in `packages/ui` (components) and `apps/api` (auth), consumed by `apps/web`.

Shared layout shell, persistent across all screens:
- Left navigation rail listing, in order: Home, My Clients, Cases, Assessments, Coordinated Entry, Resource Directory, Referrals (Internal, Outbound nested), Shelter Management (Beds, Daily Log nested), an Insights group (Data Quality, Reports), a Tools group (Data Import, Training). Only Home, My Clients, Cases, Assessments, and Coordinated Entry route to real pages in this batch; the rest render a route stub. Referrals shows a live unread/open count badge next to its label (wire it to a stub value of 0 for now; real data comes with the Referrals module later). The rail collapses to icon-only width via a toggle.
- Top bar: a global search input ("Search clients, cases, referrals..."), a notifications bell with an unread-count badge, and a settings icon. None of these need to be functional yet beyond rendering; stub their handlers.
- A shared content-area template: page-title band, then an optional KPI tile row, then the screen's main content, used by every screen rather than rebuilt per screen.

Reusable components, each in its own file in `packages/ui`, with a clear typed props interface and no screen-specific logic inside them:
- `KpiTile`: large number, label, optional muted qualifying sub-line. Must support any tile count in a row (screens use 4 or 5), not a fixed layout.
- `StatusBadge`: colored pill, single word or short phrase. Color is driven by a status-to-color map defined once (red or similar for urgent or overdue, amber for warning, green for resolved or on-track, neutral gray for informational), not hardcoded per usage.
- `FilterChipRow`: horizontal single-select pill toggles, active chip visually filled, rest outlined.
- `DataTable`: generic, column-configurable table that supports an optional inline row-actions slot (icon buttons in a row, for screens that need one-click actions without opening the record).
- `PageHeader`: title plus an optional action-button row (used for "New Intake / New Referral / New Case" style groups).
- Reserve (build the interface, no implementation needed yet) a `StatusStepper` component: a horizontal sequence of named stages with the current stage highlighted and support for a stage that has more than one possible terminal branch. This is for the Referrals module later; just make sure `packages/ui`'s structure has an obvious place for it.

Minimal auth:
- A single seeded case-manager user (for demo purposes), session- or JWT-based login, and a "Welcome, [First Name]" value available to any screen that needs it. No registration flow, no password reset, no role or permission system yet, all explicitly out of scope for this phase.

Write the spec delta for a `shared-ui` capability and an `auth` capability. Scenarios should cover: the nav collapses and expands, an unauthenticated request to any screen route redirects to login, `KpiTile` renders correctly with both 4 and 5 tiles in a row, and `FilterChipRow` only ever has one active chip at a time. Tasks checklist ends with a Storybook or equivalent isolated preview for each shared component, so later screen work doesn't have to eyeball them inside a page.
```

## Phase 2 — My Clients

```markdown
Propose an OpenSpec change called `my-clients-screen` implementing the My Clients screen end to end: list, filters, intake, and the underlying Client entity. Match the visual design in `docs/Housing360_Portal.html` (My Clients screen); this prompt specifies data and behavior, not visual styling.

Data model — `Client` entity:
- HUD Universal Data Elements as first-class fields: Name, SSN, DOB, Sex, Race and Ethnicity.
- Household support: a `household_id` grouping clients, with exactly one client per household flagged as head of household.
- A reusable "disclosure field" type for sensitive fields (health, domestic violence, and similar): stores either a real value, or one of `client_doesnt_know`, `prefers_not_to_answer`, `data_not_collected`. Build this as a shared type/column pattern, not a one-off on a single field, since more sensitive fields will use it later.
- SSN and DOB are sensitive; do not return them in list endpoints by default, only in the single-client detail endpoint, and never log them (check this against the Phase 0 logger).

API (repository pattern — routes → controllers → services → models):
- `GET /api/clients` — paginated list, supports the filter set below and a search term, returns list-safe fields only (no SSN in the list payload).
- `GET /api/clients/:id` — full detail.
- `POST /api/clients` — create (the intake endpoint). Before creating, run a duplicate check on name + DOB + SSN and return existing-match candidates in the response instead of silently creating a duplicate; the caller (frontend) decides whether to proceed anyway.
- `PATCH /api/clients/:id` — update.

Frontend:
- My Clients page: `PageHeader` with a New Intake action, a `FilterChipRow` with All / Male / Female / With Program / Without Program / With Cases / Without Cases (single-select), a column-visibility control (let the user choose which columns show; do not call this "Fields to Display" or reference Salesforce anywhere in code, comments, or UI copy), and a `DataTable` with columns Name, SSN (masked in the UI, e.g. last 4 digits), DOB, Sex, Race and Ethnicity.
- New Intake form: fields for the HUD Universal Data Elements plus household assignment, using the disclosure-field pattern for any field flagged sensitive. On submit, call the duplicate-check endpoint first; if candidates come back, show them and require explicit confirmation before creating.
- A `clients` Redux slice: list state (with current filters and pagination), selected-client detail state, and intake-form state, each as separate reducers within the slice rather than one undifferentiated blob.

Known gap to carry forward, not to silently fix: there is no automated alert today for a person registered in more than one household. Leave a `// TODO(household-duplicate-alert)` comment at the point in the intake service where this check would go, and note it in the change's proposal as an explicit follow-up, not something this change resolves.

Write the spec delta for a `client-management` capability. Scenarios should cover at least: the duplicate check blocks a silent double-create, a disclosure field accepts all four answer states, filters combine correctly with search, and SSN never appears in a list response payload.
```

## Phase 3 — Cases

```markdown
Propose an OpenSpec change called `cases-screen` implementing the Cases screen: the Case Operations Center list and the case detail record. Match the visual design in `docs/Housing360_Portal.html` (Cases screen); this prompt specifies data and behavior, not visual styling. Depends on the `client-management` capability from Phase 2 (a case always belongs to a client).

Data model — `Case` entity:
- Case number (generated, unique), client reference, subject (free text), status, priority, last-contact date, assigned case manager.
- A `case_id` foreign key point for each of the 7 detail tabs' future data (Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness); for this change, only Overview needs real fields end to end. The other 6 tabs render as real tab panels with a clearly labeled "not yet built" state, not fake placeholder data, and not missing entirely — the tab structure itself is part of this change even though most tab content isn't.

HUD Data tab specifically:
- A checklist component of HUD-required data points per case, each pass or fail, with a toggle to show or hide already-satisfied items.
- A fixed disclosure line appears in the source app on this tab: "This workspace is an operating layer. HUD reporting remains the certified HMIS's system of record." Build the tab with a slot for this line, sourced from a single config value (not hardcoded inline), and leave that config value's exact wording as an open item, not decided by this change — whether it carries into the rebuild at all is a compliance decision pending leadership, not an engineering one.

API:
- `GET /api/cases` — paginated list, supports the filter set below.
- `GET /api/cases/:id` — full detail including which of the 7 tabs have real content.
- `POST /api/cases`, `PATCH /api/cases/:id`.
- `GET /api/cases/:id/hud-data` — the checklist for that case.

Frontend:
- Case Operations Center page: KPI tile row (Active Cases, High Risk, Due Today, Closed Cases) using the shared `KpiTile`, a `FilterChipRow` with All Cases / My Caseload / High Risk / Due Today / Overdue / Recently Updated, and a `DataTable` with Case Number, Client Name, Subject, Status, Priority, Last Contact, Case Manager.
- Case detail page: 7-tab layout (Overview, Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness) using a shared tabs component (build it here if it doesn't exist yet in `apps/web/src/components/ui`, since Assessments will likely want tabbed sections too).
- A `cases` Redux slice mirroring the pattern from the `clients` slice: list state, selected-case detail state, each separate.

Write the spec delta for a `case-management` capability. Scenarios should cover at least: filters combine correctly, the HUD Data checklist toggle correctly hides and shows satisfied items, and each of the 6 not-yet-built tabs renders its labeled empty state without erroring.
```

## Phase 4 — Assessments and Coordinated Entry

```markdown
Propose an OpenSpec change called `assessments-and-coordinated-entry` implementing both the Assessments screen and the Coordinated Entry screen. Match the visual design in `docs/Housing360_Portal.html` for each; this prompt specifies data and behavior, not visual styling. Depends on `client-management` (Phase 2); Coordinated Entry produces a referral hand-off, so its "Send Referral" step should create a referral record but does not need the full Referrals module UI, which isn't in this batch.

Data model — `Assessment` entity:
- Client reference, program enrollment reference, HUD assessment type (`entry` | `annual` | `exit`), HUD stage, status, due date.
- A `score` field and a `score_label` (for example, "85" / "Strong") produced by a scoring service, not computed inline in the controller.

Scoring service — important: the real housing-stability scoring logic and the Coordinated Entry vulnerability-scoring logic (VI-SPDAT-style) are both flagged as needing their own dedicated design pass; do not invent the real algorithm here. Instead:
- Define a clean `ScoringService` interface (`scoreAssessment(assessmentInput): { score, label }`, `scoreVulnerability(intakeInput): { score, priorityTier }`) that the rest of the app calls.
- Implement it now with a clearly-labeled placeholder algorithm (documented in code as provisional, not final) so the UI has real numbers to render and the seams are already in the right place when the real scoring design lands as its own change later.

API:
- `GET /api/assessments` — paginated list, supports the filter set below.
- `GET /api/assessments/:id` — detail including score and score label.
- `POST /api/assessments`, `PATCH /api/assessments/:id`.
- `POST /api/coordinated-entry/vulnerability-assessment` — step 1, returns a vulnerability score/tier via `ScoringService`.
- `GET /api/coordinated-entry/recommended-programs` — step 2, given the vulnerability result.
- `GET /api/coordinated-entry/partner-agencies` — step 3.
- `POST /api/coordinated-entry/referrals` — step 4, creates a minimal referral record (client, program, provider, status `new`) that the future Referrals module will read; do not build a Referral list/detail UI here.
- `GET /api/coordinated-entry/prioritization-list` — supports the quick filters below.

Frontend:
- Assessment Command Center page: KPI tile row (Due Today, In Progress, Completed, Total Assessments), a `FilterChipRow` with two visually distinct groups — status filters (All, Overdue, Due Today, In Progress, Completed) and assessment-type filters (Entry, Annual, Exit) — and a `DataTable` with Assessment, Client, Program Enrollment, HUD Stage, Status, Due Date, Actions.
- Assessment detail: score and score label displayed prominently, not as a plain numeric input field.
- Coordinated Entry page: a 4-step linear stepper (reuse or extend the `StatusStepper` interface reserved in Phase 1) for Vulnerability Assessment → Recommended Program Types → Partner Agencies → Send Referral, and below it a Prioritization List with quick-filter chips: Top 5 High Priority, Veterans, Unaccompanied Youth, Safety Alerts, Awaiting Referral.
- An `assessments` and a `coordinatedEntry` Redux slice, kept separate even though they share a screen grouping, since they're different domains with different lifecycles.

Write the spec delta for `assessment-tracking` and `coordinated-entry` capabilities. Scenarios should cover at least: type filters and status filters both apply and combine correctly, a completed vulnerability assessment produces a score and moves the stepper forward, the prioritization list quick filters are mutually exclusive or clearly composable (decide and document which), and "Send Referral" creates a referral record without requiring the Referrals UI to exist.
```

## Phase 5 — Home dashboard

```markdown
Propose an OpenSpec change called `home-dashboard` implementing the Home screen. Match the visual design in `docs/Housing360_Portal.html` (Home screen); this prompt specifies data and behavior, not visual styling. This is a rollup screen: it depends on `client-management`, `case-management`, and `assessment-tracking` / `coordinated-entry` all being applied first, since every tile on it reads from those.

Layout, top to bottom:
1. Welcome band: "Welcome, [First Name]" (from the auth scaffold in Phase 1) with the current date.
2. Quick actions: New Intake, New Referral, New Case, as a button row — reuse the intake flow from `client-management` and the referral creation from `coordinated-entry`; New Case opens the case-creation form from `case-management`.
3. KPI tile row, 4 tiles: Active Caseload (from `client-management`), Open Referrals, Tasks Due Today, Assessments Due (from `assessment-tracking`). Each tile shows a large number and a short qualifying sub-line (for example, "+7 created this month," "24 pending review," "85 overdue," "Requires immediate completion").
4. Two-column row: Today's Tasks (left), Data Quality Alerts (right).

Two of these tiles/panels read from modules that are not in this batch yet:
- Open Referrals: the minimal referral records created by `coordinated-entry`'s "Send Referral" step are enough to produce a real count and a "pending review" style sub-line; do not build the full Referrals module to support this tile.
- Data Quality Alerts: there is no Data Quality module yet. Build a minimal `DataQualityIssue` read model (issue title, client reference, days-open) seeded with a handful of representative rows (for example "Prior Living Situation Required," "Duplicate Person Account Suspected"), clearly documented in the proposal as a stand-in for the real Data Quality rule engine, which is its own future change. Do not build a rule engine here.

Today's Tasks: a simple task list (title, client/context line, due date, overdue flag) is enough; a full task-management module is not in scope. Seed or derive a small set of tasks from overdue assessments and cases for a realistic-looking demo.

Today's Appointments and Recently Assessed sections were seen in the source app but not fully captured during discovery. Build the layout slot for both (so the page composition matches the design file) but render them as a clearly labeled "not yet specified" state rather than inventing content for them; flag this in the proposal as an open item.

API:
- `GET /api/dashboard/home` — one aggregate endpoint returning all tile and panel data for the authenticated case manager, rather than the frontend firing five separate requests and assembling them client-side.

Frontend:
- A `dashboard` Redux slice with a single async thunk hitting the aggregate endpoint.
- Compose the page from `KpiTile`, `PageHeader`, and a generic list-card component (build a `ListCard` in `apps/web/src/components/ui` if one doesn't already exist from Today's Tasks and Data Quality Alerts sharing the same visual pattern of a titled card containing a list of rows).

Write the spec delta for a `home-dashboard` capability. Scenarios should cover at least: the aggregate endpoint returns correctly even when a case manager has zero of something (empty states, not errors), the Data Quality Alerts panel is clearly marked as provisional data in a code comment and in the proposal, and the four KPI tiles' numbers match what `client-management`, `assessment-tracking`, and `coordinated-entry` actually report.
```

## What's next

This batch covers the four screens that were designed and specified: Home, My Clients, Cases, and Assessments plus Coordinated Entry. The nav shell built in Phase 1 already lists Referrals, Resource Directory, Shelter Management, Data Quality, Reports, Data Import, and Training as route stubs; none of them have real screens yet.

As each of those gets designed the same way this batch did (walked live, written up, and turned into a design file), add it to this document as its own numbered phase, following the same shape: what it depends on from the phases already applied, its data model, its API, its frontend composition, and its spec delta with scenarios. Two of them already have enough discovery detail to draft a phase now if wanted before they're designed: Referrals (the full field-level detail is in the discovery doc) and Data Quality (flagged in Phase 5 as needing its own rule-engine design, separate from the placeholder read model built there).
