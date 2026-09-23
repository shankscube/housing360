## 1. Data Model

- [x] 1.1 Add `caseNumber` (unique, generated), `subject`, `priority`, `lastContactDate`, `assignedCaseManagerId` (FK to `User`) columns to `Case` in `apps/api/prisma/schema.prisma`, leaving `id`, `clientId`, `programEnrollmentId`, `status`, and the `@@unique([clientId, programEnrollmentId])` constraint untouched
- [x] 1.2 Generate and review the Prisma migration; confirm existing `Case` rows created by `cases/ensure` backfill cleanly (case number generated for pre-existing rows, other new fields nullable/defaulted)
- [x] 1.3 Add case number generation logic (`CASE-YYYY-NNNNN` or equivalent) to `case.service.ts`, used by both direct creation and confirmed unaffected on `cases/ensure`'s path
- [x] 1.4 Add/confirm a small `status`/`priority` value constant (not a Prisma enum, per repo convention) covering at least the values needed for the KPI tiles and filter chips

## 2. API — Case List, Detail, Create, Update

- [x] 2.1 Add `case.controller.ts` / extend existing cases controller with `GET /api/cases` (pagination + single-select filter set: All Cases, My Caseload, High Risk, Due Today, Overdue, Recently Updated — mirrors `client-management`'s filter+search contract — plus free-text search)
- [x] 2.2 Implement filter logic in `case.service.ts`: My Caseload (assigned case manager = requesting user), High Risk (priority), Due Today/Overdue (derived from `lastContactDate`), Recently Updated (recent `updatedAt`)
- [x] 2.3 Add KPI count logic (Active Cases, High Risk, Due Today, Closed Cases) reusing the same filter predicates as the list endpoint
- [x] 2.4 Add `GET /api/cases/:id` returning Overview fields plus per-tab content-readiness flags (Assessments computed from existing `Assessment` table; Plan/Services/Referrals/Health and Wellness always `false` this change; HUD Data always considered "derived," not a readiness flag)
- [x] 2.5 Add `POST /api/cases` (direct create, independent of `cases/ensure`) and `PATCH /api/cases/:id` (subject/status/priority/lastContactDate/assignedCaseManagerId only — case number and client reference immutable after creation)
- [x] 2.6 Wire all case routes behind `requireAuth`, through `sendSuccess`/`AppError`, following the layering (`routes/ → controllers/ → services/ → models/`) and no-raw-`res.json` lint rules

## 3. API — HUD Data Checklist

- [x] 3.1 Add `apps/api/src/constants/hudDataChecklist.ts` (or similar) with the ordered list of HUD-required data points and how each maps to existing client/enrollment/assessment/disability fields
- [x] 3.2 Add the disclosure-line config constant (single source, seeded with the prompt's placeholder text) in the same or a dedicated constants file
- [x] 3.3 Implement `GET /api/cases/:id/hud-data`: evaluate each checklist entry against the case's current data at request time (no persistence), include the disclosure line text in the response
- [x] 3.4 Confirm no PII (SSN/DOB/etc.) is logged when this endpoint is called, consistent with existing `logger.ts` redact config

## 4. Frontend — Shared Tabs Component

- [x] 4.1 Create `apps/web/src/components/ui/Tabs/Tabs.tsx`: `{ tabs, activeKey, onChange }`, styled from theme tokens only, no inline hex/arbitrary values/magic px
- [x] 4.2 Re-export from `src/components/ui/index.ts` and `src/components/index.ts`
- [x] 4.3 Add a `ui-preview` story for `Tabs` under `ui-preview/stories/`, referencing the bundle's Cases screen tab strip

## 5. Frontend — `cases` Redux Slice

- [x] 5.1 Create `src/store/slices/casesSlice.ts`: `list` (items/pagination/filter/search/loading, mirroring `clientsSlice.list`) and `detail` (selected case, per-tab readiness, hud-data sub-state, loading/error)
- [x] 5.2 Add thunks: `fetchCases`, `fetchCaseDetail`, `createCase`, `updateCase`, `fetchCaseHudData`
- [x] 5.3 Register the slice in `src/store/index.ts`
- [x] 5.4 Thunks call `apiClient.get/post/patch` directly, mirroring `clientsSlice.ts`'s own pattern (never call `fetch` directly from the slice)

## 6. Frontend — Case Operations Center Page

- [x] 6.1 Replace the `CasesPage` stub with the real page: KPI row (Active Cases, High Risk, Due Today, Closed Cases) via shared `KpiTile`, through `ContentAreaTemplate`
- [x] 6.2 Add `FilterChipRow` (All Cases / My Caseload / High Risk / Due Today / Overdue / Recently Updated) wired to `casesSlice`'s list filter
- [x] 6.3 Add search input, wired to the list search param
- [x] 6.4 Add `DataTable` with columns: Case Number, Client Name, Subject, Status, Priority, Last Contact, Case Manager — `StatusBadge` for Status (reusing the shared status-word-to-tone map; add any new status words to `statusToneByLabel.ts` rather than inlining a color)
- [x] 6.5 Wire pagination via `DataTable`'s existing `pagination` prop
- [x] 6.6 Wire row selection/action to navigate to the case detail route (first real detail-route precedent in the app — confirm this doesn't regress My Clients' documented `onViewClient` stand-in)

## 7. Frontend — Case Detail Page

- [x] 7.1 Add `CaseDetailPage.tsx` route (`AppRoutes.tsx`, behind `RouteGuard`) rendering the shared `Tabs` component with all 7 tabs (Overview, Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness)
- [x] 7.2 Build the Overview tab panel with real fields (case number, client, subject, status, priority, last-contact date, assigned case manager), editable via `updateCase`
- [x] 7.3 Add a shared `NotYetBuiltPanel` (in `src/features/cases/`, not `components/ui/` — case-detail-specific copy) for Plan, Services, Referrals, Health and Wellness
- [x] 7.4 Wire the Assessments tab to show real content when the case's enrollment already has an Entry Assessment (reuse the intake-snapshot-style check), and the "not yet built" panel otherwise until a future change adds real Assessments UI
- [x] 7.5 Build the HUD Data tab: checklist list (pass/fail), show/hide-satisfied toggle (pure frontend filter, no re-fetch), and the disclosure line rendered from the API's config value (never hardcoded in the component)

## 8. Verification

- [x] 8.1 Confirm `npm run lint` passes (layering boundaries, no-raw-`res.json`, `react-refresh/only-export-components` for any split files) — ran full `eslint .` in both `apps/api` and `apps/web`, zero errors/warnings; also `tsc --noEmit` clean in `apps/api`, `apps/web`, and `packages/types`
- [x] 8.2 Backend contract verified end-to-end against the running dev server via direct API calls (single-select filter + search combine correctly, `highRisk`/`myCaseload`/`dueToday`/`overdue` each isolate the right cases, KPI counts move correctly on status/priority/lastContactDate changes, HUD Data checklist computes pass/fail correctly and carries the disclosure line) — see chat log for the request/response trace. **Not independently verified**: actually clicking through `CasesPage`/`CaseDetailPage` in a real browser (hide-satisfied toggle re-render, all 7 tabs selectable without a console error) — no browser-automation tool was available in this session. Frontend code compiles cleanly (`tsc --noEmit` + `eslint`, zero errors) but that only proves it typechecks and lints, not that it renders correctly; recommend a manual click-through before treating this as fully verified.
- [x] 8.3 Verified `cases/ensure` still behaves idempotently after the schema change — two consecutive calls for the same (clientId, enrollmentId) returned the identical case row (same `id`/`createdAt`), confirmed via direct API call against the running dev server
- [x] 8.4 Update root `CLAUDE.md` to reflect what was actually built (per the standing instruction at the top of that file)
