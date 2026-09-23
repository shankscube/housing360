## Why

Housing360 has no client system of record yet — `MyClientsPage` is a placeholder and `clientsSlice`/`Client` are empty stubs. Case managers can't intake a new client, see their caseload, or search/filter it. This change builds the first real domain entity (`Client`) and the first fully-functional screen, establishing the intake-with-duplicate-check and sensitive-field-disclosure patterns that later domains (cases, assessments, coordinated entry) will reuse.

## What Changes

- Add a `Client` Prisma model carrying the HUD Universal Data Elements (name, SSN, DOB, sex, race and ethnicity) plus `householdId` and `isHeadOfHousehold`.
- Add a reusable "disclosure field" pattern (real value vs. `client_doesnt_know` / `prefers_not_to_answer` / `data_not_collected`) for sensitive fields, applied to SSN and DOB now and intended for reuse by future sensitive fields (health, domestic violence, etc.).
- Add `GET /api/clients` (paginated list, filters + search, list-safe fields only — no SSN), `GET /api/clients/:id` (full detail), `POST /api/clients` (intake, with a pre-create duplicate check), `PATCH /api/clients/:id` (update), following the existing routes → controllers → services → models layering.
- Implement the My Clients screen end to end, composing the now-styled `shared-ui` primitives rather than restyling anything: a `PageHeader` title band, then one content card holding a header row (single-select `FilterChipRow` — All / Male / Female / With Program / Without Program / With Cases / Without Cases — plus a `secondary` (teal) New Intake button, which is where `docs/Housing360 Portal.html` puts it on this screen, not in the `PageHeader`), a caption strip, a column-visibility control, and a `DataTable` (Name, SSN masked, DOB, Sex, Race and Ethnicity) using the component's own `isLoading`/`emptyMessage` states and `numeric` columns for SSN/DOB.
- Implement the New Intake form, including the duplicate-check-then-confirm flow.
- Replace the stub `clientsSlice` with list / detail / intake-form state as separate reducers.
- Add the `client-management` capability spec.

Explicitly out of scope (carried forward, not resolved by this change):
- No automated alert for a person already registered in another household — flagged with a `// TODO(household-duplicate-alert)` comment at the relevant point in the intake service, for a later change to pick up.
- "With Program" / "With Cases" filters key off future domain entities (programs, cases) that don't exist yet; this change defines the filter contract and treats those clients as having none until those entities exist.

## Capabilities

### New Capabilities
- `client-management`: Client entity (HUD Universal Data Elements, household grouping, disclosure fields), the `/api/clients` CRUD + duplicate-check API, and the My Clients list/filter/intake screen.

### Modified Capabilities
_None._ No existing capability's requirements change — `auth`, `shared-ui`, and `project-scaffold` are consumed as-is (route guarding; `DataTable`/`FilterChipRow`/`PageHeader`/`StatusBadge` and the design-token theme; layering/lint rules) but none of their requirements are altered.

> Rebased on `shared-ui` as of `openspec/changes/archive/2026-09-23-design-system-implementation/`. That change restyled every shared component to `docs/Housing360 Portal.html` and added capability this screen should use rather than hand-roll: `DataTable`'s `isLoading`/`emptyMessage` states, its `numeric` and `emphasis` columns, `PageHeader`'s three action variants, `StatusBadge`'s six tones resolved from a shared status-word map, the `Icon` set, and `src/theme/tokens.ts` as the only source of color/spacing/radius/shadow/type values. Nothing in this plan referenced the pre-restyle APIs, so nothing here is invalidated — but the frontend tasks below are now written against the current ones.

## Impact

- **Database**: new `Client` model + migration in `apps/api/prisma/schema.prisma`; `AppMeta` placeholder can stay (still needed if it were ever the only model, though no longer strictly required — left alone, out of scope for this change).
- **API**: new `apps/api/src/{routes,controllers,services,models}/client*.ts`, mounted at `/api/clients` (this is the first `/api`-prefixed route group in the app — `/health` and `/auth` are unprefixed).
- **Shared types**: `packages/types/src/clients.ts` gets a real `Client` shape (replacing the current 3-field stub) plus the disclosure-field type, consumed by both apps.
- **Frontend**: `apps/web/src/routes/pages/MyClientsPage.tsx` becomes a real screen; `apps/web/src/store/slices/clientsSlice.ts` gains list/detail/intake-form reducers; new intake form component(s) under `apps/web/src/routes/` or `apps/web/src/components/` (screen-specific, not `components/ui/`); `apps/web/src/api/client.ts` gains client endpoints.
- **Depended on `shared-ui-button` — already satisfied** (archived 2026-09-23): the table-card "New Intake" button is not a `PageHeader` action, so it needed the exported `Button` that change extracted. Nothing blocks this change now.
- **No changes** to auth, layout/shell, other domain slices (cases, assessments, coordinated entry, dashboard), `src/components/ui/`, or `src/theme/` — this screen consumes the design system, it does not extend it. If it turns out to need a genuinely screen-agnostic component or a missing token, that is a `shared-ui` change, not something to inline here.
