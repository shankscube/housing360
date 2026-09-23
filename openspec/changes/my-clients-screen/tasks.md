## 1. Shared Types

- [x] 1.1 Add `DisclosureStatus` union (`'provided' | 'client_doesnt_know' | 'prefers_not_to_answer' | 'data_not_collected'`) and generic `DisclosureField<T>` type to `packages/types/src/clients.ts`
- [x] 1.2 Replace the stub `Client` interface in `packages/types/src/clients.ts` with the full shape: HUD Universal Data Elements (name, sex, race and ethnicity as plain fields; SSN and DOB as `DisclosureField<string>`), `householdId`, `isHeadOfHousehold`, timestamps
- [x] 1.3 Add a `ClientListItem` (or equivalent) type omitting SSN and DOB entirely, for list-endpoint responses
- [x] 1.4 Add request/response types for create (including `confirmDuplicate` and the `duplicates_found`/`created` response variants), update, and the list filter/query params

## 2. Database Schema

- [x] 2.1 Add `Sex` and `DisclosureStatus` enums and a `Client` model to `apps/api/prisma/schema.prisma` per design.md's two-column-per-disclosure-field pattern (`ssn`/`ssnDisclosure`, `dob`/`dobDisclosure`), plus `householdId`, `isHeadOfHousehold`, name, race and ethnicity
- [x] 2.2 Run `prisma migrate dev` to generate and apply the migration; verify `prisma generate` produces a working client

## 3. API — Models Layer

- [x] 3.1 Create `apps/api/src/models/client.model.ts` with Prisma query functions: paginated list with filter/search support, find by id, find-candidates-for-duplicate-check (name + DOB + SSN match), create, update, find-head-of-household-by-householdId
- [x] 3.2 Add mapper helpers (in the model or a small adjacent module) converting between the flat Prisma row shape and the `DisclosureField<T>` shape used at the API boundary

## 4. API — Services Layer

- [x] 4.1 Create `apps/api/src/services/client.service.ts`: `listClients(query)` applying filter (all/male/female/withProgram/withoutProgram/withCases/withoutCases per design.md's current-scope rules) + search + pagination, returning list-safe fields only
- [x] 4.2 Add `getClientById(id)` returning full detail (including SSN/DOB), throwing `AppError(404, ...)` when not found
- [x] 4.3 Add `createClient(input)`: run the name+DOB+SSN duplicate check; if candidates exist and `confirmDuplicate` is not `true`, return `{ status: 'duplicates_found', candidates }` without writing; otherwise create and return `{ status: 'created', client }`
- [x] 4.4 Enforce exactly one head of household per `householdId` in `createClient`/`updateClient` (reject with `AppError(409, ...)` on conflict)
- [x] 4.5 Add `// TODO(household-duplicate-alert)` comment at the point where a cross-household duplicate-person check would go, per the proposal's carried-forward gap
- [x] 4.6 Add `updateClient(id, input)` supporting partial updates including disclosure fields

## 5. API — Controllers & Routes

- [x] 5.1 Create `apps/api/src/controllers/client.controller.ts` with handlers for list/detail/create/update, each validating input and calling through to the service, using `sendSuccess`/`AppError` exclusively (no inline error construction)
- [x] 5.2 Create `apps/api/src/routes/client.routes.ts` mounting `GET /`, `GET /:id`, `POST /`, `PATCH /:id`
- [x] 5.3 Mount the client router at `/api/clients` in `apps/api/src/routes/index.ts` (first `/api`-prefixed route group in the app)
- [x] 5.4 Verify the layering lint rule (`boundaries.js`) passes — controllers must not import `models/` directly, only `services/`

> **Note**: routes were also put behind `requireAuth` (a judgment call, not explicitly in the original task text) — `/api/clients` serves SSN/DOB, and the `auth` spec's route-guard requirement only covers `apps/web` screen navigation, not the API surface itself, so leaving these endpoints unauthenticated would have been the weaker default.

## 6. Logging Safety

- [x] 6.1 Add `redact` paths to the Pino config in `apps/api/src/utils/logger.ts` covering `req.body.ssn`, `req.body.dob`, and equivalent nested paths, so intake/update request bodies never leak SSN/DOB into logs
- [x] 6.2 Audit `client.service.ts`/`client.controller.ts` for any `logger.*` calls that pass a full client object, and change them to log by `id` only

## 7. Frontend — API Client & Redux Slice

- [x] 7.1 Add `listClients`, `getClient`, `createClient`, `updateClient` calls to `apps/web/src/api/client.ts`
- [x] 7.2 Rewrite `apps/web/src/store/slices/clientsSlice.ts` with `{ list, detail, intakeForm }` sub-state and dedicated reducers/thunks per design.md (list filter/page/search reducers, detail select/clear, intake field-set/duplicate-candidates/reset), replacing the current single-`items` stub
- [x] 7.3 Wire the three thunks (`fetchClients`, `fetchClientById`, `createClient`) into the slice's `extraReducers`

## 8. Frontend — My Clients Screen

> Prerequisite satisfied: `shared-ui-button` was applied and archived on 2026-09-23, so the `Button` that 8.3 needs is already exported from `src/components/ui`.

- [x] 8.1 Build the My Clients page in `apps/web/src/routes/pages/MyClientsPage.tsx`: a `PageHeader` (title + subtitle, no actions) above one content card — `rounded-2xl bg-surface shadow-card overflow-hidden` — matching the bundle's My Clients layout
- [x] 8.2 In the card's header row, render `FilterChipRow` wired to the slice's list filter (All/Male/Female/With Program/Without Program/With Cases/Without Cases) plus a search input
- [x] 8.3 Add the "New Intake" button to the right of that header row as `<Button variant="secondary" size="sm">` — the bundle's teal in-card treatment, **not** a `PageHeader` action
- [x] 8.4 Add the bundle's caption strip between the header row and the table (`surfaceMuted` band, muted `xs` text): "Columns follow HUD Universal Data Elements. Duplicate check on name + DOB + SSN runs before any new record is created."
- [x] 8.5 Render the `DataTable` (Name, SSN masked to last 4, DOB, Sex, Race and Ethnicity), setting `numeric` on the SSN and DOB columns so digits align as the bundle's do, and leaving Name to the default first-column emphasis — SSN/DOB render as a fixed masked placeholder since `ClientListItem` omits both fields entirely; see follow-up note below
- [x] 8.6 Wire `DataTable`'s own `isLoading` and `emptyMessage` props to the slice's list state — do **not** hand-roll a spinner or a "no results" block; pass a filter-aware empty message (e.g. "No clients match these filters.")
- [x] 8.7 Add a column-visibility control (local component state only, per design.md) letting the user toggle which `DataTable` columns render — avoid the terms "Fields to Display" or any Salesforce reference in code/comments/UI copy
- [x] 8.8 Compose only — confirm the screen adds no inline hex, no arbitrary Tailwind value (`bg-[#…]`, `text-[10px]`), and no local restyling of a shared component. If something screen-agnostic is missing, raise it as a `shared-ui` change rather than inlining it (see design.md)

> **Follow-up surfaced during implementation**: `ClientListItem` (by spec) omits SSN/DOB entirely from list responses, so the list table has no real value to mask — it renders a fixed placeholder instead of an actual last-4 mask. Genuinely masking requires a per-row "reveal" action against the detail endpoint; out of scope for this change, worth a small follow-up.

## 9. Frontend — New Intake Form

- [x] 9.1 Build the New Intake form component (HUD Universal Data Elements, household assignment, disclosure-field inputs for SSN/DOB with the four-state control)
- [x] 9.2 Wire submit to call `createClient` without `confirmDuplicate`; on a `duplicates_found` response, render the candidates and require explicit user confirmation before re-submitting with `confirmDuplicate: true`
- [x] 9.3 On a `created` response, close the form and refresh/update the client list

## 10. Verification

- [x] 10.1 `npm run lint` — confirm layering and no-raw-response-methods rules pass for the new API files
- [x] 10.2 `npm run build` — confirm both apps and `packages/types` build with the updated `Client` type
- [x] 10.3 Manually verify: list response omits SSN/DOB; detail response includes them; duplicate check blocks a silent double-create and confirms-through works; a disclosure field round-trips all four states; filters combine with search; SSN renders masked in the UI
- [x] 10.4 Verify the list's loading and empty states render `DataTable`'s shared states (load with a slow/blocked request, and with a filter that matches nothing)
- [x] 10.5 Visual pass: compare the finished screen against the My Clients section of `docs/Housing360 Portal.html` — card, header row, chips, teal New Intake, caption strip, table header band, row hairlines and hover
- [x] 10.6 Grep `apps/web/src/routes/pages/MyClientsPage.tsx` and any new intake-form components for `#[0-9a-fA-F]{3,6}`, `[[0-9.]+(px|rem)]` and `-[#` — confirm zero matches

> **Verification notes** (ran directly against the live dev server, not just code review):
> - Confirmed via live HTTP calls (logged in as the seeded demo user): duplicate check blocks silent double-create and returns candidates; `confirmDuplicate: true` creates through; all four disclosure states (`provided`/`client_doesnt_know`/`prefers_not_to_answer`/`data_not_collected`) round-trip on both SSN and DOB; list response never includes `ssn`/`dob` keys at all; detail response includes both; filter+search combine with AND semantics; `withCases`/`withProgram` return empty, `withoutCases`/`withoutProgram` return everything (per design.md's documented current-scope behavior); a second head-of-household in the same household is rejected with 409; grepped the live dev server log for the raw SSN/DOB values used in testing — zero matches, confirming the redact config works against real request traffic, not just the config's presence.
> - Confirmed via a headless-browser pass against the running app: default list view, single-select filter chips, search-with-no-match empty state ("No clients match these filters."), column-visibility toggle actually removes a column from the table, and the New Intake form (all documented fields, disclosure-status selects, household radio) all render and behave as designed. Zero browser console errors.
> - Visual comparison against `docs/Housing360 Portal.html`'s My Clients screen: card/chip/caption/table structure and the teal in-card New Intake button match closely. Confirmed deliberate divergences: (a) the reference's 6th "Program status" `StatusBadge` column is omitted, per the confirmed decision in design.md's open question; (b) the reference masks SSN as a real last-4 value (and prints the disclosure status as text, e.g. "Prefers not to answer") directly in the list row — this change's list payload excludes SSN/DOB entirely per spec, so the table shows a fixed placeholder instead; this is the same UX gap flagged by the frontend implementation (see below) and requires the future per-row "reveal" follow-up, not a fix here; (c) the reference's filter-chip set (6 chips, no explicit "Without Cases") differs slightly from the 7-chip set this change implements — the original change request explicitly specified all 7 filter values as data/behavior, which takes precedence over the static visual reference for chip content (not styling).
>
> **Known follow-up (not resolved by this change, carried forward alongside the household-duplicate-alert TODO)**: because `ClientListItem` omits SSN/DOB entirely (by spec, so they never leak into a list payload), the table cannot render a true last-4 mask from list data alone — it shows a fixed placeholder. A future change could add a per-row "reveal" action against the detail endpoint to show a real masked value on demand.

## 11. Post-Apply UI Adjustments (live user feedback on the running screen)

- [x] 11.1 Removed the column-visibility control entirely (task 8.7 reversed per explicit user feedback) — `MyClientsPage.tsx` no longer has per-column toggles; `spec.md`'s "My Clients List Screen" requirement updated to drop that scenario.
- [x] 11.2 Reworked the card's header: filter chips + "New Intake" button now share one row (button right-aligned), with the search input moved to its own full-width row below (was wrapping onto its own line under the chips at common viewport widths, and was visually small/inline) — bigger padding/text than before.
- [x] 11.3 Added pagination as a first-class, reusable `DataTable` capability (`apps/web/src/components/ui/DataTable/DataTable.tsx`'s new optional `pagination` prop — page/pageSize/total/onPageChange, rendered as a `<tfoot>` row with a range label and Prev/Next controls), not a My-Clients-only bolt-on, so any future paginated table gets it for free. Wired into `MyClientsPage` via the list slice's existing `page`/`pageSize`/`total`/`setListPage`.
- [x] 11.4 Moved "Log out" off the `TopBar` (which now only shows "Welcome, [name]") to a click-to-open account menu on the nav rail's user card (`NavRail.tsx`'s `UserCard`), portaled to `document.body` (via `createPortal`) so it isn't clipped by the rail's own `overflow-hidden`, positioned at the icon's bottom-right and closing on outside click.
- [x] 11.5 Added a `menuWidth` (176px) token to `apps/web/src/theme/tokens.ts`'s `layout` object for the new account-menu popover, following the existing named-token convention (no arbitrary Tailwind values introduced).

> These four are layout-shell/shared-component changes (11.2–11.4 touch `TopBar`/`NavRail`/`DataTable`, not `client-management`-specific code), applied directly per live user feedback rather than routed through a separate `shared-ui` change — a pragmatic call for a same-session UI tweak, not a precedent for skipping that process on larger shared-component work. Verified via `npm run lint`, `tsc -b`, and a headless-browser pass against the running dev server (including actually clicking through to logout and confirming the redirect to `/login`).
