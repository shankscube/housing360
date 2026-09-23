# Housing360 rebuild — OpenSpec prompt sequence

2026-09-22 · Prepared by @Shashank for CUBE84

## How to use this document

Eleven prompts, run in order. Each screen phase from 3 onward has a "b" follow-up (3b, 4b, 5b, 6b) that completes the full workflow found in the source portal; run it right after its parent phase. Each one is a single OpenSpec change: run `opsx:propose` with the prompt text as-is, review the generated proposal and spec deltas, then `opsx:apply` before moving to the next prompt. Don't start a screen's prompt before the phase before it lands; several screens share components and data that only exist once earlier phases are applied.

Build order follows data dependency, not nav order, with one addition: Phase 2 (design system implementation) comes before any screen, because screens should consume already-styled components instead of styling them ad hoc. After that, My Clients and its intake wizard (Phase 3b) come before Cases, Cases before Assessments and Coordinated Entry, and Home comes last, because Home is a rollup dashboard reading from all of them. Building it first would mean building it twice.

Two assumptions, stated so they can be overridden in Phase 0 if they're wrong: TypeScript across both apps (drop the type annotations for plain JS, everything else holds), and MySQL as the primary store behind the repository layer, read from the root `.env` (if the `.env` points at MongoDB instead, only the model layer's implementation changes; the repository interfaces described below don't).

Put the design file at `docs/Housing360_Portal.html` and this document, exported, at `docs/openspec-prompts.md` before starting Phase 0, so every prompt below can point at both. Each screen prompt also carries its own field-level and behavior detail, so it doesn't depend on this project's memory once it's in the repo.

Phase 2 pulls the visual tokens (colors, typography, spacing) out of that file into the shared components; every phase after that references it only for page-level composition, not for colors or spacing.

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

## Phase 2 — Design system implementation

```markdown
Propose an OpenSpec change called `design-system-implementation` that amends the existing `shared-ui` capability (from Phase 1) to bring every shared component and the layout shell to full visual parity with `docs/Housing360_Portal.html`. No new capability, no page-level screens, no route content in `apps/web` — this only touches `apps/web/src/components/ui` and the Tailwind theme.

Token extraction:
- Read colors, typography scale (font family, sizes, weights, line heights), spacing scale, border radius, shadow levels, and icon set directly from `docs/Housing360_Portal.html`.
- Write them into the Tailwind theme file scaffolded in Phase 0 as the single source of truth. No component in `apps/web/src/components/ui` should carry an inline hex value, arbitrary Tailwind value, or magic spacing number after this change; anything not already in the theme gets added to it.
- Where the bundle uses a value with no obvious semantic name yet (a specific gray, a specific spacing), name it for its role (for example `border-subtle`, `surface-muted`), not its raw value.

Component styling, each brought to full visual fidelity against the design file:
- Left navigation rail and top bar: exact spacing, active and selected state, icon set, collapse and expand transition.
- `KpiTile`: exact number and label typography, spacing, and the muted sub-line treatment.
- `StatusBadge`: fill in the real status-to-color map referenced in Phase 1 (urgent as red, warning as amber, resolved as green, informational as gray) with the bundle's exact tones, and cover every status word actually used across the four batch-1 screens, not just the four example categories.
- `FilterChipRow`: active versus inactive chip styling, hover state.
- `DataTable`: header styling, row hover, and whichever border or zebra treatment the bundle uses, plus an empty-state row and a loading-state row.
- `PageHeader`: title typography and the action-button row's button styling, including the primary and secondary distinction if the bundle has one.
- `StatusStepper` (interface reserved in Phase 1, no consumer yet): style it now even though nothing renders it in this batch. It is cheap to do while the rest of the token set is already in front of you and expensive to redo later against a stale visual memory of the bundle.
- The login screen from Phase 1's auth scaffold: apply the new theme tokens to it. If the bundle has no login mockup, keep its current layout and reskin it with the new tokens, and flag that gap as an open item rather than inventing a login design.

Verification:
- Update the Storybook or equivalent isolated preview built at the end of Phase 1 so each component's preview can sit side by side with the matching section of `docs/Housing360_Portal.html`.
- Tasks checklist ends with a manual visual pass confirming each component matches the bundle, and a check confirming no hardcoded hex or pixel values remain in `apps/web/src/components/ui`.

Write the spec delta as an amendment to the `shared-ui` capability, not a new one: add scenarios for the `StatusBadge` color map covering every status word in use, the `DataTable` empty and loading states, and the theme file being the only source of color and spacing values in `apps/web/src/components/ui`. Do not change the `auth` capability's behavior, only its screen's styling.
```

## Phase 3 — My Clients

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

## Phase 3b — Client intake wizard

```markdown
Propose an OpenSpec change called `client-intake-wizard` that replaces the single-form New Intake from `my-clients-screen` with the full multi-step HUD client intake flow. Match the visual design in `docs/Housing360 Portal.html`. This prompt specifies data, behavior, and wiring. Shared components go in `apps/web/src/components/ui` (see CLAUDE.md standing rules). Depends on `client-management`.

Scope note: this change introduces the Household, Program, ProgramEnrollment, Entry Assessment, Disability, InteractionSummary, and a minimal Case table, because intake writes to all of them. Later phases (`cases-screen`, `assessments-and-coordinated-entry`) must EXTEND these tables, not recreate them. Record that in the proposal.

## Data model (repository pattern: routes → controllers → services → models)
- `households`: id, head_client_id. `clients.household_id` and `clients.relationship_to_hoh` (HUD 3.15 codes).
- `clients` additions: title, name_data_quality, ssn_data_quality, dob_data_quality (HUD 3.01/3.02/3.03 codes), mobile, email, veteran_status (HUD 3.07), plus veteran details (military_branch, year_entered_service, discharge_status, ww2, korean_war, vietnam_war, other_theater). Race and ethnicity is multi-value (HUD 3.04, including 8/9/99). SSN: store it encrypted, plus a hash for duplicate matching and last4 for display. Never return the full SSN in list or search payloads, and never log it.
- `programs`: id, name, is_active (seed 3–5 active programs).
- `program_enrollments`: client_id, household_id, program_id, name, start_date, status, relationship_to_hoh, disabling_condition (HUD 3.08), enrollment_coc, program_case_manager_id, is_primary.
- `cases` (minimal): client_id, program_enrollment_id, status. Created idempotently per client and enrollment.
- `assessments`: client_id, program_enrollment_id, case_id, data_collection_stage (intake always writes stage 1 = project start / Entry), assessment_date, status. It carries every field for three sections:
  - Living situation (HUD 3.917): situation_category, situation, location_details, lease_own_60_day, leave_situation_14_days, months_homeless_past_3_years, moved_two_or_more, resources_to_obtain, stay_less_than_7_nights, subsequent_residence, institutional_stay_less_than_90_days, rental_subsidy_type, chronic_homelessness, night_before_streets_es_sh, times_homeless_past_3_years, length_of_stay, verified_by.
  - Income, non-cash benefits, and health insurance (HUD 4.02/4.03/4.04):
    - Income: income_from_any_source, then Yes/No plus amount for each source: earned, SSI, SSDI, unemployment, VA service-connected, VA non-service, private disability, workers' comp, TANF, general assistance, Social Security retirement, pension, child support, alimony, and other (with specify).
    - Non-cash benefits: benefits_from_any_source, SNAP, WIC, TANF child care, TANF transportation, other TANF, connection with SOAR, other source.
    - Health insurance: insurance_from_any_source, covered_by_health_insurance, then Yes/No plus a "no reason" for each type: Medicaid, Medicare, SCHIP, VHA, employer, COBRA, private pay, state, IHS, ADAP, Ryan White, and other (with specify).
  - Health and DV (HUD 4.11 and R-series): general, dental, and mental health status; pregnancy_status and due_date; domestic_violence_survivor, when_occurred, currently_fleeing.
- `disabilities` (child of assessment, HUD 4.05–4.10): disability_type, response, indefinite_and_impairs, plus HIV-only fields: anti_retroviral, t_cell_available, t_cell_count, t_cell_source, viral_load_available, viral_load, viral_load_source.
- `interaction_summaries`: client_id, case_id, title, status, meeting_notes, next_steps.
- HUD code lists (label and value, including 8 = client doesn't know, 9 = prefers not to answer, 99 = data not collected) are defined ONCE in a shared constants module. Serve them from `GET /api/reference/hud-options`. The frontend never hardcodes option lists.

## API (all through the common responder and logger)
- `GET /api/clients/search?name=`: name, email, DOB, masked SSN, relationship to HoH, sex, veteran.
- `GET /api/clients/:id/intake-snapshot`: household_id, case_id, the client's enrollments (flagging the primary one), and per-enrollment Entry assessment status (none / in progress / complete, plus which sections have values, and existing disabilities).
- `POST /api/clients` and `PATCH /api/clients/:id` (extend the existing ones): a duplicate match (name + DOB + SSN hash) returns 409 with candidates. Resending with `allowDuplicate: true` saves anyway.
- `POST /api/households` (creates the household with the client as a member). `POST /api/households/:id/members` bulk-creates family-member clients in one transaction.
- `GET /api/programs?active=true`, `GET /api/clients/:id/enrollments`, `POST /api/enrollments`, `PATCH /api/enrollments/:id`.
- `POST /api/cases/ensure {clientId, enrollmentId}`: idempotent, returns the existing case or creates one.
- `GET /api/enrollments/:id/assessments?stage=entry`, `POST /api/assessments`, `PATCH /api/assessments/:id`.
- `POST /api/assessments/:id/disabilities` and `DELETE /api/disabilities/:id`.
- `POST /api/interaction-summaries`.

## Frontend: `apps/web/src/features/intake/`
Build one reusable `IntakeWizard` modal with `onClose` and `onViewClient(clientId)` props, because it opens from My Clients, the Home quick action, and Referrals. Put the step config in one array (`key`, `label`, `icon`, `component`, `onNext`) so steps aren't hardcoded in the shell. Wizard state lives in an `intake` Redux slice: phase (search | form | finished), currentStep, furthestStep, completedSteps, and ids for client, household, case, enrollment, assessment, and interaction summary. Thunks go through the API client layer only.

**Phase A, search.** The "Find Existing Client" card has a name input and a Search button, disabled while the input is empty; Enter also searches. Results table columns: Name (email under it), DOB, SSN (masked), Relationship to HoH, Sex, Veteran. With no results, show "No matching clients found. You can continue to create a new client." The "Continue as New Client" button is always available after a search.
- Selecting a result loads the intake snapshot. It marks Family Members complete. If the client has enrollments, it selects the primary (or first) one, marks Program complete, calls cases/ensure, loads Entry assessment status, and marks the section steps that already hold values as complete. Then it enters the form at step 1, pre-filled.

**Phase B, the form.**
- Left rail: 8 steps, each upcoming, active, or complete. A step is clickable only if it is at or before the furthest step reached, and clicking one saves the current step first.
- Header shows "Step N of 8" and a progress bar. Footer has Back, and a primary button labeled "Save & Next" ("Save & Finish" on the last step).
- Missing required fields raise the toast "Missing information: Please fill in the highlighted required fields before continuing."

1. **Client Basic Information.**
   - Fields: First Name*, Last Name*, Title, Name DQ, SSN, SSN DQ, Birthdate*, DOB DQ, Sex*, Relationship to HoH*, Race and Ethnicity (dual listbox, multi), Mobile, Email, Veteran Status.
   - Veteran Status = Yes reveals the Veteran Details section and scrolls to it.
   - Save creates or updates the client. A 409 shows an inline warning banner with "Save Anyway" (resend with allowDuplicate) and a dismiss button, not a toast.
   - After the first save, create the household if none exists, then advance.
2. **Family Members.**
   - Inline editable table: First, Last, SSN, Birthdate, Sex, Race (multi), Relationship to HoH, Mobile, Email. Rows can be added with "+ Add Family Member" and cancelled.
   - Rows already saved are read-only, with SSN masked and labels resolved.
   - On Next, every new row with any name must have both first and last names. If one doesn't, show the toast "Each family member needs at least a first and last name."
   - Zero new rows skips straight ahead. Otherwise bulk-create the members in the household.
3. **Program & Enrollment.**
   - If the client has enrollments, show a searchable picker marked Primary, with "+ Create a new enrollment instead" and "‹ Use an existing enrollment instead" toggles.
   - A new enrollment takes: Program* (active programs), Name (default "<Program> - <Client>"), Start Date (default today), Status, Relationship to HoH, Disabling Condition, Enrollment CoC, and Program Case Manager.
   - On save: call cases/ensure, then load the enrollment's Entry assessment. If one exists, show "Resuming the unfinished Entry assessment already started for this enrollment." or "Already recorded for this enrollment; editing below updates that same record." If none exists, show "Not yet recorded for this enrollment."
   - Switching enrollment resets the section steps' completion.
4. **Living Situation.**
   - The Situation Type category drives the Situation dependent select, using HUD 3.917 codes grouped by category (Homeless, Institutional, Temporary, Permanent, Other).
   - Changing the type clears Situation and Rental Subsidy Type. Rental Subsidy Type is enabled only for Permanent situations.
   - Validate only, no save.
5. **Income & Benefits.**
   - Each "<source>: Yes/No" field gates its Amount field: enabled only when Yes, and cleared when it isn't.
   - Each insurance type's "No <type> reason" is enabled only when that type = No, using the HUD reason codes 1/2/3/4/8/9/99.
   - The insurance type rows show only when Covered by Health Insurance = Yes.
   - Build the gating as ONE declarative map (target field → {source field, enabling value}) consumed by a generic `GatedField` component, not 30 hand-written conditionals.
   - Validate only.
6. **Health & DV.** Health status fields, pregnancy with due date, DV survivor, When Occurred, and Currently Fleeing. Save & Next persists the WHOLE Entry assessment, covering steps 4–6, in one POST or PATCH.
7. **Disabilities.**
   - Add one record at a time: Type, Response, Indefinite and impairs.
   - When Type = HIV/AIDS and Response = Yes, reveal Anti-retroviral, T-cell available (→ count and source), and Viral load available (→ value and source).
   - Saved records show as a list with Remove (a delete call), plus "+ Add Another Disability".
   - A "No known disabilities to record" checkbox shows only while the list is empty.
   - Next requires at least one record or the checkbox. Otherwise show "Add at least one disability record, or check 'No known disabilities to record' to continue." A partially filled form is saved, then the wizard advances.
8. **Interaction Summary.**
   - First ask: "Would you like to add an Interaction Summary for this intake?" No finishes the intake.
   - Yes shows: Title (default "<Program> - Intake"), Status, Meeting Notes, and Next Steps, linked to the client and the case. Save & Finish.

**Phase C, finished.** Show the "Intake Complete" panel, a "View client record" link (fires `onViewClient`, then closes), and Back and Done buttons. Closing the wizard makes My Clients refetch its list.

**Also in this change**, now that enrollments exist:
- Back the My Clients "With Program / Without Program" filters with real enrollment data.
- Add the Program status `StatusBadge` column from the design, driven by the primary enrollment's status. The status→label mapping (Enrolled / Awaiting referral / Intake started) is an open item to confirm. Don't hardcode it per row.

## Spec delta: `client-intake` capability. Scenarios must cover at least:
- Search with no match → Continue as New Client.
- Selecting an existing client pre-fills the wizard and marks completed steps.
- A duplicate-rule hit shows Save Anyway, which then succeeds.
- A family row with only a first name is blocked.
- cases/ensure called twice creates only one case.
- A Permanent situation enables Rental Subsidy Type and any other category disables it.
- An income amount is disabled unless its source = Yes.
- Steps 4–6 produce exactly one Entry assessment record.
- Disabilities Next is blocked without a record or the checkbox.
- The HIV fields appear only for HIV/AIDS = Yes.
- Answering No to the Interaction Summary finishes without creating one.
- Rail steps beyond the furthest reached step are not clickable.
- SSN never appears unmasked in search or list payloads or logs.

The tasks checklist ends with an end-to-end run: create a new client with 2 family members, a new enrollment, all sections, 2 disabilities, and an interaction summary, and verify every row in the DB.
```

## Phase 4 — Cases

```markdown
Propose an OpenSpec change called `cases-screen` implementing the Cases screen: the Case Operations Center list and the case detail record. Match the visual design in `docs/Housing360_Portal.html` (Cases screen); this prompt specifies data and behavior, not visual styling. Depends on the `client-management` capability from Phase 3 (a case always belongs to a client).

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

## Phase 4b — Case workspace (full)

```markdown
Propose an OpenSpec change called `case-workspace` that completes the Cases module: New Case, the full case detail header and Edit, and real content for every detail tab that `cases-screen` left as a labeled empty state. Match the visual design in `docs/Housing360 Portal.html`. Shared components go in `apps/web/src/components/ui` (see CLAUDE.md standing rules). Depends on `client-management`, `client-intake` (Phase 3b: households, programs, program_enrollments, cases, assessments, disabilities, interaction_summaries) and `case-management` (Phase 4). EXTEND those tables; do not recreate them. This change is large: group the tasks checklist by tab so it can be applied and verified tab by tab.

## Data model additions
- `cases` additions: case_number (generated, unique), subject, description, status, priority, stage, origin, case_manager_id, referral_id, program_enrollment_id, opened_date, closed_at, next_hmis_review_due, hmis_data_quality_status, follow_up_milestone (none | 30 | 60 | 90 day) and follow_up_due_date (computed from opened_date or last contact when a milestone is set).
- `tasks` (one table for every task in the app): subject, description, status, priority, subtype, due_date, owner_id, client_id, and nullable links case_id, goal_assignment_id, interaction_summary_id. Home, Tasks, and Client 360 all read this table later.
- `interaction_summaries` additions: interaction_purpose, confidentiality_type, partner_account, offering, related_record (polymorphic: type and id).
- Care plans: `care_plan_templates` (name, description, is_published, template goals with default tasks), `care_plans` (case_id, client_id, name, description, status Proposed | Draft | Active | Completed | Cancelled, start_date, end_date, template_id), `goal_definitions` (catalog of suggested goals with a service domain), `goal_assignments` (care_plan_id, goal_definition_id nullable, name, description, priority High | Medium | Low, status Not Started | In Progress | Completed | Canceled, service_domain), goal tasks live in `tasks` via goal_assignment_id.
- Services: `benefits` (program_id, name, service_domain), `benefit_assignments` (program_enrollment_id, benefit_id, status), `service_disbursements` (benefit_assignment_id, recipient_client_id, disbursement_type, status, disbursement_date, description, trigger_reason, voucher_number, voucher_amount, bed_identifier, shift).
- Beds (minimal, the Shelter Management module will extend these later): `beds` (program_id, identifier, is_active), `bed_assignments` (program_enrollment_id, bed_id, start_date, end_date), `bed_nights` (bed_assignment_id, log_date, shift Day | Overnight, status Present | Absent).
- Referrals (create only if an earlier phase has not): `referrals` (title, client_id, case_id, program_id, provider_org_id, referrer_org_id, referral_date, type, status, priority, category, outcome, description, comments, client_contact, provider_contact, referrer_contact, case_manager_comments, decline_reason, decline_notes, is_external).
- Partner agencies: `organizations` (name, address, contact_email, is_partner) and `organization_service_domains` (which service domains an agency provides).
- Release of Information: `releases_of_information` (client_id, recipient organization and contact details, info types released: case management, day-to-day activity, mental health, chemical dependency, HIV/AIDS, other; purpose, client signature, client signed_at, staff signature, staff signed_at, expires_on defaulting to signed_at + 365 days, revoked_at). A client has active consent when an unrevoked, unexpired ROI exists.
- Clinical read model for Health & Wellness: `clinical_summaries` and `clinical_encounters` (encounter number, date, type, location, provider, status), filled by an EHR adapter.

## API (all through the common responder and logger)
- `GET /api/cases/dashboard`: KPI tiles (active, high risk, due today, closed this month, plus active-cases trend vs last month) and the paginated list. Search matches client name, case number, program, or case manager.
- `POST /api/cases`, `GET /api/cases/:id`, `PATCH /api/cases/:id`, `PATCH /api/cases/:id/follow-up {milestone}`.
- `GET /api/cases/:id/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`.
- `GET /api/cases/:id/interaction-summaries?search=`, `POST /api/interaction-summaries` (accepts an optional task block: create_task, task_title, task_due_date, task_assigned_to, use_next_steps_as_description), `PATCH /api/interaction-summaries/:id`, `GET /api/interaction-summaries/:id` (with its tasks).
- Care plans: `GET /api/cases/:id/care-plans` (with progress: tasks done / total), `GET /api/care-plan-templates?published=true&search=`, `GET /api/cases/:id/recommended-care-plan-templates`, `POST /api/care-plans` (plan plus goals plus tasks in one transaction), `GET/PATCH /api/care-plans/:id`, `POST /api/care-plans/:id/goals`, `GET/PATCH /api/goal-assignments/:id`, `POST /api/goal-assignments/:id/tasks`, `PATCH /api/tasks/:id/status`.
- Service gaps and partner referral: `GET /api/cases/:id/service-gaps` (goal service domains no in-house benefit covers), `GET /api/partner-agencies?domain=`, `GET /api/clients/:id/roi-status`, `POST /api/referrals/external`.
- Services: `GET /api/clients/:id/enrollments`, `GET /api/enrollments/:id/services`, `GET /api/enrollments/:id/assignable-benefits`, `POST /api/enrollments/:id/services`, `GET/POST /api/benefit-assignments/:id/disbursements`, `PATCH /api/disbursements/:id`.
- Beds: `GET /api/programs/:id/beds/available?date=&shift=`, `POST /api/bed-assignments` (also logs today's night as Present), `GET /api/bed-assignments/:id/nights`, `POST /api/bed-nights`, `PATCH /api/bed-nights/:id`.
- Referrals tab: `GET /api/cases/:id/referrals`, `POST /api/referrals`, `PATCH /api/referrals/:id`, `POST /api/referrals/:id/accept`, `POST /api/referrals/:id/decline {reason, notes}`.
- ROI: `POST /api/releases-of-information`.
- Health & Wellness: `GET /api/clients/:id/health-wellness`.

## Frontend: `apps/web/src/features/cases/`
**Case Operations Center.** Reuse the Phase 4 page. Add the "New Case" modal: Subject*, Description, Client (search field), Case Manager, Referral, Opened Date, Status, Priority, Origin, Escalated, Contact. Toasts "Case created successfully." and "Unable to create the case. Please check the required fields." The Active Cases tile shows the trend line ("▲/▼ N% vs last month").

**Case detail header.** Title "<Subject> — <Client>", "Case <number>", then Client (link to client), Status, Referral, Priority, Stage, Origin, and an Edit button opening an edit form (Subject, Status, Priority, Stage, Origin, HMIS Data Quality Status, Next HMIS Review Due, Case Manager, Description). Back returns to the list with filters preserved. Tabs: Overview, Plan, Services, Assessments, Referrals, HUD Data, Health & Wellness.

**Overview tab.**
- Left: Interaction Summaries card with search, New, a list, and a "Don't forget!" nudge when there are none. New and Edit use one form: Title, Status, Interaction Purpose, Confidentiality Type, Meeting Notes, Next Steps, Partner Account, plus an optional "Create a Task" block (Title, Due Date, Assigned To, "Use Next Steps as the task description"). Opening one shows the Interaction Summary detail (Information, More Details, and an Upcoming & Overdue activity list with New Task).
- Right: Details (Client & Program: client, program, enrollment, referral, case manager, description, closed, next HMIS review due, HMIS data quality status), a Follow-Up Reminder control (No follow-up, 30 Day, 60 Day, 90 Day, Set Reminder) that writes follow_up_milestone and follow_up_due_date, a Tasks card with New Task (Subject*, Status, Priority, Due Date, Description; "Please enter a subject for the task." when blank), and System Information (created/modified by and on).

**Plan tab.**
- List care plans for the case with status, start, target, tasks done, and description. Each expands to its goals; each goal expands to its tasks with inline status change and New Task.
- "New Care Plan" and "New from Template" open a 3-step Care Plan wizard: Plan details (template picker with "Recommended for this client" first, then published templates with search; Name, Description, Status, Start, End) → Goals (type a goal or pick a suggested goal definition, priority; "Give every goal a name, or remove the empty one, to continue.") → Tasks under each goal (subject, due date; "Give every task a subject, or remove the empty one, to continue."; a goal with no tasks is fine). The same wizard edits an existing plan, adds goals, or edits one goal.
- Service gaps: when a goal's service domain has no in-house benefit, show "<domain> isn't offered in-house." with "Refer to Partner". That opens Refer to Partner Agency: pick an agency offering the domain (flag agencies with no contact email as "can't be reached yet"), then the ROI check. With active consent, show what the client authorized. Without it, offer "Create Release of Information" or "Continue Without ROI" behind the confirmation checkbox "I understand this referral will be sent without any client details beyond initials." Optional notes, then Send Referral. Without consent only the client's initials are stored on the external referral.

**Services tab.**
- Program Enrollments list (searchable, Primary badge, status, start, end). Expanding one shows its assigned services and each service's disbursements.
- "Assign Service" picks from the benefits configured for that enrollment's program ("No benefits are configured for this program yet." when empty).
- "New Disbursement" and edit: type, status, date, recipient, description, trigger reason, voucher number and amount, and bed identifier and shift where relevant.
- "Assign Bed": program, date, shift (Day or Overnight), Find Available Beds, pick one; success toast "The bed was assigned and today's stay was logged."
- Daily Log sub-view per bed assignment: a calendar of nights marked Present, Absent, or Not logged, one-click logging, and Recent Daily Logs (date, status, shift).

**Assessments tab.** Enrollment picker, then the assessments on that enrollment (stage, date, status, score) with Resume Draft and Discard on drafts, and a "Recommended Care Plans" strip with "Create from Template" that opens the Care Plan wizard pre-filled. The assessment form and scoring arrive in Phase 5b; until then Resume and New route to a placeholder, not a broken link.

**Referrals tab.** Referrals for the case (category, outcome, client, provider, and referrer contacts, case manager comments), New Referral (the shared modal: Title*, Client*, Program, Provider, Referrer, Referral Date, Type, Status, Priority, Category, Description, Comments), Edit, Accept, and Decline with Reason (default "Client declined services") and optional Notes.

**HUD Data tab.** Keep the Phase 4 checklist. Add the "✓ All clear" state, the empty-filter message ("Nothing matches the current filter; toggle Show satisfied items to see the full checklist."), and the no-rules state. Keep the disclosure line config-driven as Phase 4 specified.

**Health & Wellness tab.** Clinical Summary (last clinical visit, next scheduled appointment, open follow-ups), Release of Information status with a "Create Release of Information" action, and Recent Visits (encounter number, date, type, location, provider, status). Define an `EhrAdapter` interface with a no-op implementation so the tab shows "No clinical data on file for this client yet." Do not name the vendor in UI copy.

**ROI form (shared component).** "Authorization to Release and Receive Confidential Information": client legal name and DOB (pre-filled), recipient organization and contact details, yes/no per information type, purpose, the authorization text, client and staff signature pads with Clear and date, the 42 CFR Part 2 re-disclosure notice, and the expiry date (default 365 days). Put the legal text in one config file, not inline in the component, so compliance can change it.

Redux: extend the `cases` slice with a `caseDetail` sub-state; add `carePlans`, `services`, and `referrals` slices. Every thunk goes through the API client layer.

## Spec delta: amend `case-management`, add `care-planning`, `case-services`, `release-of-information`. Scenarios must cover at least:
- New Case without Subject is rejected; with it, the case appears in the list with a generated case number.
- Setting a 60 Day follow-up stores the milestone and a due date 60 days out; "No follow-up" clears both.
- An interaction summary with "Create a Task" and "Use Next Steps" checked creates one task whose description equals Next Steps.
- The care plan wizard blocks an unnamed goal and an unnamed task, and saves plan, goals, and tasks in one transaction.
- A goal whose domain has no in-house benefit shows Refer to Partner; without active ROI the referral stores initials only.
- An ROI expires 365 days after signing when no date is given, and an expired ROI is not active consent.
- Assigning a bed logs today's night as Present; a bed already assigned for that date and shift is not offered.
- Declining a referral stores reason and notes and sets its status to declined.
- Every tab renders an empty state, not an error, for a case with no related data.

The tasks checklist ends with an end-to-end run on one case: create it, set a follow-up, log an interaction summary with a task, build a care plan from a template, assign a service, log a disbursement, assign a bed and mark two nights, add and decline a referral, and sign an ROI.
```

## Phase 5 — Assessments and Coordinated Entry

```markdown
Propose an OpenSpec change called `assessments-and-coordinated-entry` implementing both the Assessments screen and the Coordinated Entry screen. Match the visual design in `docs/Housing360_Portal.html` for each; this prompt specifies data and behavior, not visual styling. Depends on `client-management` (Phase 3); Coordinated Entry produces a referral hand-off, so its "Send Referral" step should create a referral record but does not need the full Referrals module UI, which isn't in this batch.

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

## Phase 5b — Assessment workspace and Coordinated Entry engine (full)

```markdown
Propose an OpenSpec change called `assessment-and-ce-workspace` that completes the Assessments and Coordinated Entry modules and replaces the placeholder scoring from `assessments-and-coordinated-entry` (Phase 5) with the real, configurable models. Match the visual design in `docs/Housing360 Portal.html`. Shared components go in `apps/web/src/components/ui`. Depends on `client-intake` (3b), `case-workspace` (4b), and `assessment-tracking` / `coordinated-entry` (5). EXTEND the existing `assessments`, `disabilities`, `referrals`, `beds`, and `care_plan_templates` tables. REUSE the living situation, income and benefits, health and DV, and disabilities section components built for the 3b intake wizard; do not build a second copy.

## Part 1: HUD assessments

**Data model additions.**
- `assessments` additions: status Draft | Complete, due_date, assessor_id, legacy_sync_status (Not Synced | Pending | Synced | Failed) and legacy_sync_date. Stage uses HUD data collection stage codes: 1 project start (Entry), 2 update, 3 project exit, 5 annual.
- `program_exits` (program_enrollment_id, assessment_id, exit_date, destination_type, destination, case_manager_exit_reason). Recording an exit sets the enrollment's end date and status.
- `assessment_score_contributions` (assessment_id, field, value, contribution) written by the scoring service.

**Stage eligibility, in one `AssessmentEligibilityService`.** Given an enrollment it returns every stage with `allowed` and a `reason`:
- Entry: allowed only when the enrollment has no Entry assessment.
- Update: allowed any time after Entry and before Exit.
- Annual: allowed only inside the HUD annual window, 30 days before to 30 days after each anniversary of the enrollment start date, and only once per window.
- Exit: allowed once, while the enrollment is active.
- Any stage with an unfinished Draft returns that draft so the UI can offer "Resume Draft" instead of a new one.
The source system computes this server-side and the exact rules were not visible, so implement the HUD-standard rules above, keep them in this one service, and list "confirm eligibility rules against the source org" as an open item.

**Scoring, in one `HousingStabilityScoringService`.** Score = sum of rule contributions. Keep rules in a `scoring_rules` table (field, match value or range, contribution points) and seed a clearly marked provisional rule set. It returns `{ score, label, contributions[] }` and persists contributions. Care-plan recommendations come from a `care_plan_template_rules` table (score band or field condition → template). The real weights are an open item for the program team; the engine, contribution breakdown, and recommendation wiring are not.

**API.**
- `GET /api/assessments/dashboard`: KPI tiles (Due Today, In Progress = drafts, Completed this month, Total across programs) and the paginated, filterable list (status: All, Overdue, Due Today, In Progress, Completed; type: Entry, Annual, Exit; search).
- `GET /api/enrollments/:id/assessment-eligibility`, `GET /api/enrollments/:id/assessments`, `GET /api/enrollments/:id/latest-assessment-values` (for carry forward), `GET /api/enrollments/:id/summary`.
- `POST /api/assessments` (Draft or Complete), `PATCH /api/assessments/:id`, `DELETE /api/assessments/:id` (drafts only; a completed assessment returns 409), `GET /api/assessments/:id` (with score, contributions, disabilities).
- `PUT /api/assessments/:id/disabilities` (replace the full set in one call).
- `POST /api/enrollments/:id/exit` (called by an Exit assessment on completion).
- `GET /api/enrollments/:id/recommended-care-plan-templates`.

**Frontend: `apps/web/src/features/assessments/`.**
- Assessment Command Center (extend Phase 5): "Launch Assessment" button, KPI sub-lines ("Requires immediate completion", "Drafts awaiting completion", "Completed this month", "Across all programs"), and Resume and Discard in the Actions column for drafts (Discard asks for confirmation through the shared confirm dialog, never a browser `confirm`).
- Launch Assessment modal, three numbered steps: 1. Client (search field), 2. Program Enrollment ("This client has no program enrollments yet. Create one before recording an assessment." when none), 3. Assessment Type showing only allowed stages. If a draft exists, show "An unfinished <stage> assessment already exists on this enrollment — resume it to continue." with "Resume Draft ›". When nothing is allowed, show "No assessment type is available to record on this enrollment right now." Continue opens the form.
- Assessment form modal: stage (disabled options show their reason), Assessment Date, a "Carry forward previous answers" action that pre-fills from the latest assessment on the enrollment, the reused section components, disabilities (add and remove rows, saved as a set), and for Exit an Exit Details section (Destination Type → Destination dependent select using the same HUD situation code map, plus case manager exit reason). Footer: Discard Draft, ‹ Back, Cancel, Save Draft, and Complete. Completing runs scoring, sets legacy_sync_status to Pending, and for Exit records the program exit.
- Assessment detail page: Assessment Overview (status, stage, date, due date), Client & Enrollment (client, enrollment, assessor), the score with "Show what contributed to this score" expanding a Field | Value | Contribution table, disabilities with their HIV fields when present, and System Information. Resume Draft and Discard for drafts.
- Wire the same form and detail into the Case → Assessments tab that 4b left as a placeholder, including "Create from Template" on recommended care plans.

## Part 2: Coordinated Entry

**Configurable rule model.** Replace the Phase 5 placeholder with tables:
- `ce_questions` (text, client_facing_prompt, sequence, is_active, weight_note for documentation only) and `ce_answer_options` (question_id, text, score).
- `ce_score_bands` (name, min_score, max_score, description, badge_color, recommended_project_type_codes).
- `ce_flag_overrides` (flag Veteran | Unaccompanied Youth | Safety Alert, optional trigger_question_id and trigger_min_score, behavior add | replace, external_referral_message).
- `ce_rule_changes` (audit: who changed which rule, when, before and after).
- `ce_assessments` (client_id, assessor_id, assessed_at, total_score, band_id, flags) and `ce_responses` (ce_assessment_id, question_id, answer_option_id, score).
Seed 5 active questions with answer options, 3 score bands, and one override per flag, all marked as demo configuration.

**Engine, in one `CoordinatedEntryService`.** Score = sum of chosen answer scores. The band whose range contains the score sets priority and the base recommended project types. Each flag override that matches (flag set, and trigger condition met when present) adds to or replaces the recommendation and is shown as "override applied". A Safety Alert sets "Referral Suppressed" and surfaces the override's external referral message in place of normal referral actions.

**API.**
- `GET /api/ce/questions` (active, ordered), `POST /api/ce/assessments`, `GET /api/ce/assessments/:id` (details, flags, responses, previous assessments for the client).
- `GET /api/ce/priority-queue?filter=TOP5|VETERAN|YOUTH|SAFETY_ALERT|AWAITING_REFERRAL&search=&page=`.
- `GET /api/ce/clients/:id/recommendation`: band, base project types, applied overrides, suppression state.
- `GET /api/ce/recommended-programs?projectType=`: programs with partner agency, address, and live bed availability from the 4b `beds` tables.
- `POST /api/referrals` (from CE, with the referrer's default organization and the provider case manager resolved).
- Rule admin API, behind a `ce:manage-rules` permission check: CRUD for questions, answer options, score bands, and flag overrides, each writing a `ce_rule_changes` row, plus `GET /api/ce/rule-changes`. The editor UI belongs to the later Admin Panel phase; build the API and permission check now.

**Frontend: `apps/web/src/features/coordinated-entry/`.**
- Page header "Coordinated Entry" with "View All Clients" and "Vulnerability Assessment" buttons.
- Vulnerability Assessment modal: client search, intake flags (Veteran, Unaccompanied Youth, "Safety Alert (fleeing domestic violence or other safety concern)"), the active questions rendered in sequence from config, Save Assessment. Nothing about questions or scores is hardcoded in the component.
- Coordinated Entry Workflow stepper: Vulnerability Assessment → Recommended Program Types → Partner Agencies → Send Referral, with Back links between steps.
  - Recommendation card: "Coordinated Entry Recommendation — score-based routing per the Coordinated Entry scoring model", the band badge, override markers, and the suppression banner "Safety Alert — Referral Suppressed" with the external message.
  - Recommended Program Types: click one to see partner programs; "No project types currently have eligible programs." when empty.
  - Partner Agencies: Program, Address, Beds (live), Action.
  - Send Referral review panel: Client, Program, Organization, Priority, Referral Date, Status New, Referral Type, Category, Referrer Case Manager, Provider Case Manager, Description, Comments ("Add any comments for the receiving program..."). Toast "Referral sent" and refresh the queue row's Referral Status.
- Prioritization List: Name, DOB, SSN (masked), Intake Flags (badges), Score, Priority, Assessed, Referral Status; quick filters Top 5 High Priority, Veterans, Unaccompanied Youth, Safety Alerts, Awaiting Referral (single-select); search; pagination. A row opens the CE assessment detail (details, flags or "No flags on record", responses, previous assessments, View Client).

## Spec delta: amend `assessment-tracking` and `coordinated-entry`. Scenarios must cover at least:
- An enrollment with an Entry assessment offers no second Entry; Annual is allowed only inside the ±30-day anniversary window.
- An existing draft forces Resume instead of a new assessment of that stage; discarding a completed assessment is rejected.
- Carry forward pre-fills from the most recent assessment on the same enrollment only.
- Completing an Exit assessment records the program exit and closes the enrollment.
- The score equals the sum of persisted contributions, and the breakdown lists every contributing field.
- A CE score of exactly a band's min or max lands in that band.
- A "replace" override replaces the base recommendation; an "add" override appends to it.
- A Safety Alert client never shows Send Referral, and the external message is shown.
- Editing a question or band without `ce:manage-rules` returns 403, and every allowed edit writes an audit row.
- Priority queue filters are single-select and combine with search.

The tasks checklist ends with two end-to-end runs: (1) launch an Annual assessment inside its window, carry forward, complete it, and check the score breakdown; (2) run a vulnerability assessment for a veteran, follow the recommendation to a program with an open bed, send the referral, and see it in the queue as sent.
```

## Phase 6 — Home dashboard

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

## Phase 6b — Home workspace (full)

```markdown
Propose an OpenSpec change called `home-workspace` that completes the Home screen and the pages it links to. It replaces the stubs `home-dashboard` (Phase 6) left in place: the stubbed top bar, the "not yet specified" Today's Appointments and Recently Accessed slots, and the derived task list. Match the visual design in `docs/Housing360 Portal.html`. Shared components go in `apps/web/src/components/ui`. Depends on `client-intake` (3b), `case-workspace` (4b), `assessment-and-ce-workspace` (5b), and `home-dashboard` (6). Read from the existing tables; add only what is listed below.

## Data model additions
- `referral_status_events` (referral_id, from_status, to_status, changed_by, changed_at, seen_by_referrer_at). Write one row on every referral status change from 4b and 5b.
- `record_activity` (user_id, record_type client | case | referral | assessment, record_id, action viewed | modified, at). Write it from the services, not the controllers, so every module feeds it the same way.
- No appointments table: "appointments" in the source system are case follow-up milestones (4b's follow_up_milestone and follow_up_due_date).

## API (all through the common responder and logger)
- `GET /api/search?q=`: at most 5 hits per group across Clients, Cases, Referrals, Tasks, and Assessments, each with type, id, title, subtitle, and icon key. Minimum 2 characters. Only records the user can see. Masked SSN only, and never search by SSN in the free-text box.
- `GET /api/notifications`: `pendingReferrals` (referrals routed to the user's organization or programs with status new: title, client, program) and `statusUpdates` (status events on referrals the user sent that they have not seen: title, status label). Plus `POST /api/notifications/status-updates/seen`.
- `GET /api/dashboard/home` (extend Phase 6): real Active Caseload, Open Referrals, Tasks Due Today, and Assessments Due tiles with sub-lines; today's tasks from `tasks` (owner = me, open, due today or overdue, with overdue flag, priority, and client); open data quality alerts (participant, days open, related record type and id); today's appointments (cases I manage with follow_up_due_date = today: case number, client, milestone); the 5 most recent `record_activity` items.
- `GET /api/appointments?from=&to=`: follow-up milestones in a date range, for the Calendar page.
- `GET /api/tasks?filter=all|due_today|overdue|upcoming&search=&page=`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`.
- `GET /api/recent-activity?type=all|cases|referrals|clients|assessments&page=`.

## Frontend
**Top bar (shared shell, replacing the Phase 1 stubs).**
- Global search: debounced input "Search clients, cases, referrals...", a dropdown grouped by type with icon, title, and subtitle, "Searching…" and "No matches found." states, keyboard navigation, and click-through to the record. Close on blur and on Escape.
- Notifications bell: badge with the total count. The panel has two sections, New Referrals (title, client, program) and Referral Updates (title, status label), and "No new notifications right now." when both are empty. Clicking an item opens the referral and marks status updates seen.

**Home page (extend Phase 6).**
- Welcome band with first name and today's date.
- Quick actions: New Intake (the 3b `IntakeWizard`), New Referral (the shared New Referral modal from 4b), New Case (the 4b modal). Each refreshes the dashboard on close.
- KPI tiles are clickable: Active Caseload → Cases filtered to My Caseload; Open Referrals → the Referrals route (a stub until the Referrals phase); Tasks Due Today → Tasks page with Due Today; Assessments Due → Assessments with Due Today.
- Today's Tasks: subject, priority, due date, client, and an "Overdue" badge; "No open tasks assigned to you." when empty; a row opens the Task detail.
- Data Quality Alerts: a dot colored by severity, title, participant, and days open; "No open data quality issues." when empty; a row opens the related record.
- Today's Appointments: case number, client, and milestone ("30 Day follow-up"); "No follow-ups scheduled for today." when empty; a row opens the case. A "Calendar" link opens the Calendar page.
- Recently Accessed: the 5 newest items with a type icon; "Nothing updated in your caseload yet." when empty; "View All" opens the Recently Modified page.

**Tasks page (`/tasks`, reached from Home).** "Tasks — Click a task to open the activity." Filter chips All Tasks, Due Today, Overdue, Upcoming; search by subject or owner; columns Priority, Subject, Owner, Status, Due Date; pagination; "No tasks found." A row opens Task detail: Subject, Status, Priority, Task Subtype, Due Date, Owner, Client, Created, Last Modified, Description, with Edit, Cancel, and Save.

**Calendar page (`/calendar`).** Month grid with previous and next month, weekday labels, a marker on days that have follow-ups, and clicking a day lists that day's follow-ups (case number, client, milestone) below the grid; "No follow-ups scheduled for this day." A follow-up opens its case.

**Recently Modified page (`/recent`).** "Cases, referrals, clients, and assessments from your own caseload, newest first." Filter tabs All, Cases, Referrals, Clients, Assessments; Refresh; pagination ("‹ Prev", "Next ›"); "Nothing found for this filter."

Redux: add `search`, `notifications`, `tasks`, `calendar`, and `recentActivity` slices; extend `dashboard`. All thunks go through the API client layer.

## Spec delta: amend `home-dashboard`; add `global-search`, `notifications`, `task-management`, `activity-feed`. Scenarios must cover at least:
- Search under 2 characters makes no request; results never include records outside the user's caseload or an unmasked SSN.
- A referral status change creates a status event, shows in the referrer's Referral Updates, and disappears after being marked seen.
- Setting a case's 30 Day follow-up makes it appear in Today's Appointments on its due date and on that Calendar day.
- Today's Tasks shows overdue tasks with the Overdue badge and excludes completed tasks.
- Each KPI tile navigates to its list with the matching filter already applied.
- Viewing or editing a client, case, referral, or assessment adds it to Recently Accessed exactly once, at the top.
- Every Home panel renders its empty state for a brand-new user.

The tasks checklist ends with an end-to-end run as a new case manager: see all empty states, create an intake, a case with a 30 Day follow-up, a task due today, and a referral; then check each Home panel, the Calendar, the Tasks page, search, and the notification bell reflect them.
```

## What's next

This batch covers the four screens that were designed and specified: Home, My Clients, Cases, and Assessments plus Coordinated Entry. The nav shell built in Phase 1 already lists Referrals, Resource Directory, Shelter Management, Data Quality, Reports, Data Import, and Training as route stubs; none of them have real screens yet.

As each of those gets designed the same way this batch did (walked live, written up, and turned into a design file), add it to this document as its own numbered phase (the next one is Phase 7), following the same shape: what it depends on from the phases already applied, its data model, its API, its frontend composition, and its spec delta with scenarios. Two of them already have enough discovery detail to draft a phase now if wanted before they're designed: Referrals (the full field-level detail is in the discovery doc) and Data Quality (flagged in Phase 6 as needing its own rule-engine design, separate from the placeholder read model built there).
