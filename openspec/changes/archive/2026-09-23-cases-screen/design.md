## Context

`Case` already exists in `apps/api/prisma/schema.prisma` as a minimal row (`id`, `clientId`, `programEnrollmentId`, `status`, `@@unique([clientId, programEnrollmentId])`), created idempotently via `POST /api/cases/ensure` from the intake wizard's Program & Enrollment step (see `client-intake-wizard`). No screen reads or manages it today — `CasesPage` is a `ContentAreaTemplate` stub. This change turns that row into a real, browsable case record with a list screen (Case Operations Center) and a 7-tab detail screen, per `docs/Housing360 Portal.html`'s Cases screen (visual reference only — this document is about data/behavior).

Follows the same shape as `my-clients-screen` (list + filters + KPI row + `DataTable`) and `client-intake-wizard` (Redux slice pattern, HUD-coded scalars as plain strings resolved against `hudOptions.ts`-style config). No new external dependencies.

## Goals / Non-Goals

**Goals:**
- Extend `Case` with case-manager-facing fields without touching `cases/ensure`'s idempotency contract or existing columns.
- Give every one of the 7 detail tabs a real tab panel — Overview with real fields, the other 6 with a genuine, labeled "not yet built" state (not a fake data mockup, not an absent tab).
- Add a reusable `Tabs` component to `apps/web/src/components/ui/`, since Assessments will need tabbed sections later too.
- Make the HUD Data tab's checklist and disclosure line configuration-driven, so neither requires a code change to adjust content.

**Non-Goals:**
- Populating Plan/Services/Assessments/Referrals/Health and Wellness with real data models — that's future work, each tab's own change.
- Deciding the disclosure line's final wording or whether it survives into the rebuild at all — explicitly an open item for leadership (see Open Questions).
- A "change assigned case manager" audit trail, case timeline/activity feed, or case closure workflow — out of scope; `status`/`priority` are plain fields with no state-machine enforcement in this change.
- Editing `cases/ensure`'s behavior, the intake wizard, or `ProgramEnrollment`.

## Decisions

### 1. Extend the existing `Case` model in place; don't create a new entity or a v2 table
New columns: `caseNumber` (String, unique, generated), `subject` (String, nullable — free text), `priority` (String, HUD-style plain-string code resolved against a config map, not a Prisma enum, consistent with the rest of the schema's HUD-coded-scalar convention), `lastContactDate` (DateTime, nullable), `assignedCaseManagerId` (String, FK to `User`, nullable — the seeded demo user is the only case manager today, so this defaults to the creating/current user but is editable).
`status` already exists (String, defaulted `"open"` by `cases/ensure`) — reused for the Status column/filter rather than adding a second status-like field. The Case Operations Center's "Closed Cases" KPI and filter read `status`; this change does not add a new enum of allowed status values beyond what `hudOptions`-style config or a small local constant defines (`open`, `closed`, plus whatever intermediate values the bundle's Status column shows — resolved from the design bundle's own vocabulary at implementation time, not invented here).

**Alternative considered**: a separate `CaseDetail` 1:1 table to keep `Case` itself minimal. Rejected — `cases/ensure`'s upsert already targets `Case` directly; splitting the row adds a join for every read with no isolation benefit, since these fields are never bulk-written for reasons `Case` itself isn't already being touched for.

### 2. The 6 not-yet-built tabs get no new tables in this change — `Case` detail response reports readiness via existence checks, not stored flags
Rather than adding a `hasPlan`/`hasServices`/... boolean column set (which would need manual upkeep as soon as those tables appear), `GET /api/cases/:id` computes each tab's "has real content" flag by checking for related rows the moment those tables exist, and reports `false` for every tab that has no backing table yet (Plan, Services, Referrals, Health and Wellness — no table this change). Assessments already has a real table (`Assessment`, keyed by `programEnrollmentId`) from the intake wizard — this change wires the Assessments tab's readiness flag to "does an `Assessment` row exist for this case's `programEnrollmentId`," which is the one detail tab that can honestly report real content today even though this change doesn't add Assessments UI. HUD Data is derived (see Decision 4), never "not yet built."

This means the proposal's "`case_id` foreign key point for each of the 7 tabs" is satisfied structurally by tab routing + a response contract (`tabsWithContent: string[]` or per-tab booleans) rather than by literally creating 6 empty child tables today — creating empty tables with no columns and no writers would be dead schema. When Plan/Services/Referrals/Health and Wellness get real models in a future change, each just adds its own `caseId` FK column at that time, same as `Assessment.programEnrollmentId` already does.

**Alternative considered**: create empty placeholder tables (`CasePlan`, `CaseService`, etc.) now with just `id`+`caseId`. Rejected per the "no half-finished implementations" convention — an empty table nothing ever writes to is schema noise, and a future change adding real columns to it is no harder than creating the table fresh.

### 3. `caseNumber` generation: server-side, sequential-looking but not a raw auto-increment exposed as PK
Format `CASE-YYYY-NNNNN` (year + zero-padded sequence), generated in `case.service.ts` at creation time inside the same transaction as the insert (query `MAX` of the current year's sequence, or maintain a small counter row — implementation detail for tasks.md). Never client-supplied. Matches the bundle's visible case-number style without exposing the internal UUID `id`.

### 4. HUD Data tab: checklist definitions are static config; check results are computed, not stored
`apps/api/src/constants/hudDataChecklist.ts` (mirroring `hudOptions.ts`'s role) holds an ordered list of `{ key, label, check }`-shaped entries describing each HUD-required data point (e.g. "Living Situation recorded," "Income & Benefits recorded," "Disability status recorded" — each mapped to an existing field/table this repo already has, primarily the client's `Assessment` row and its `Disability` children). `GET /api/cases/:id/hud-data` evaluates each entry against the case's client/enrollment/assessment data and returns pass/fail per item — nothing is written or cached. The show/hide-satisfied toggle is purely a frontend filter over this response; it never changes the request.

The disclosure line is a single config constant, `HUD_WORKSPACE_DISCLOSURE_TEXT` (or similar), in that same constants file (or a dedicated `src/constants/disclosures.ts`), served as part of the `hud-data` response (or a small `/api/reference` addition — implementation detail for tasks.md) so the frontend never hardcodes it. Seeded with the prompt's literal text as a placeholder; flagged in Open Questions as pending sign-off, not finalized by this change.

**Alternative considered**: hardcode the disclosure string directly in the React component. Rejected per the proposal's explicit requirement that it be a single config value, precisely because the wording is expected to change independent of any code change.

### 5. Frontend: `Tabs` component is generic and content-agnostic
`src/components/ui/Tabs/Tabs.tsx` takes `{ tabs: {key, label}[], activeKey, onChange, children }` (or a render-prop per active tab) and renders the bundle's tab strip styling from theme tokens only — no case-specific logic. `CaseDetailPage` owns which of the 7 panels is mounted and passes each its own data/empty-state; `Tabs` itself doesn't know about "not yet built." A shared `NotYetBuiltPanel` (small, in `src/features/cases/` since it's case-detail-specific copy, not generic enough for `components/ui/`) renders the labeled empty state for the 6 stub tabs.

### 6. `cases` Redux slice mirrors `clients`: `{ list, detail }`, no shared state with `intake`
`casesSlice.ts` has `list` (items/pagination/filter/loading, same shape as `clientsSlice.list`) and `detail` (selected case + its hud-data sub-state, loading/error). Thunks: `fetchCases`, `fetchCaseDetail`, `createCase`, `updateCase`, `fetchCaseHudData`. No coupling to `intakeSlice`'s `ids.caseId` — that field continues to exist for the wizard's own use; this slice is a separate read/write surface for the new screens.

## Risks / Trade-offs

- [Computed-readiness approach for 6 tabs means `GET /api/cases/:id` does a small amount of extra work per tab] → acceptable at current scale (single case manager, seeded data); revisit only if a future change adds enough tabs/tables to matter.
- [`priority`/`status` as plain strings with no enforced state machine] → matches existing HUD-coded-scalar convention repo-wide, but means the frontend must not assume server-side transition validation; if unauthorized/invalid transitions ever look like a problem, that's a follow-up requirement, not something this change silently prevents.
- [Disclosure line wording is a placeholder] → shipping it as configurable, not deleting the tab or blocking on legal sign-off, so the tab structure (this change's actual scope) isn't held hostage by a pending compliance decision. Mitigation: config constant + Open Question, not a guess dressed up as final copy.

## Open Questions

- Final wording (and whether it appears at all) of the HUD Data tab's compliance disclosure line — pending leadership/compliance sign-off, tracked as a follow-up, not decided here.
- Exact set of allowed `status` and `priority` values beyond what's needed to satisfy the KPI tiles (Active/High Risk/Due Today/Closed) and the filter chips — to be finalized against the design bundle's own Status/Priority column values during implementation, since the prompt specifies behavior, not the bundle's exact vocabulary.
- Whether "Due Today" and "Overdue" derive from `lastContactDate` (e.g. a follow-up-due convention) or a separate due-date field not in the prompt's data model — assumed to derive from `lastContactDate` plus a fixed follow-up cadence for this change; flagged for confirmation during implementation if the bundle implies otherwise.
