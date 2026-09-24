## Why

Home (`/`) is still the `HomePage.tsx` stub from `project-setup` ("Home screen content coming soon"), and the `dashboardSlice`/`DashboardSummary` scaffolding it never wired up hits a `/dashboard/summary` endpoint that doesn't exist on the backend. Every module a real Home screen would roll up — clients, cases, assessments, coordinated entry — is now built and archived, so this is the first change where a real dashboard is actually possible. Case managers need one landing screen that surfaces their caseload, what's due today, and the day's quick actions, instead of navigating into each module cold.

## What Changes

- Add `GET /api/dashboard/home` — one aggregate endpoint returning every Home tile/panel's data in a single response (KPI counts, Today's Tasks, Data Quality Alerts, and placeholder markers for the two not-yet-specified panels).
- Replace the stub `dashboardSlice`/`DashboardSummary` (`/dashboard/summary`, `{ clientCount, caseCount }`) with a real `dashboard` slice and `HomeDashboardResponse` type built around the new endpoint. **BREAKING**: the old `fetchDashboardSummary` thunk, `/dashboard/summary` route, and `DashboardSummary` type are removed, not kept alongside the new ones — nothing currently consumes them (`HomePage` is still a stub), so there's no real migration.
- Replace the stub `HomePage.tsx` with the real composition: welcome band + quick actions (reusing `IntakeWizard` and `NewCaseModal` as-is; "New Referral" navigates to `/coordinated-entry` — see design.md for why a direct shortcut into the CE wizard's referral step isn't possible today), a 4-tile KPI row (Active Caseload, Open Referrals, Tasks Due Today, Assessments Due), and a two-column row (Today's Tasks / Data Quality Alerts) followed by a second two-column row (Today's Appointments / Recently Assessed) rendered in an explicit "not yet specified" state.
- Add a new shared `ListCard` component (`apps/web/src/components/ui/`) — the titled-card-containing-a-row-list shell that `TasksCard`/`InteractionSummariesCard` already hand-roll independently; Home's four panels are the first shared consumer.
- Add a minimal `DataQualityIssue` read model (`issue title`, `clientId`, computed `daysOpen`) as a deliberate stand-in for a future real Data Quality rule engine — **not a rule engine**. Demo-seeded lazily (once real clients exist) rather than via the install-time `prisma/seed.ts`, since that script runs before any `Client` row exists — see design.md.
- Derive "Today's Tasks" and "Assessments Due" from the existing shared `Task` and `Assessment` models (no new task-management or scoring logic) — "Tasks Due Today" reuses `Task.ownerId`/`dueDate`; "Assessments Due" reuses the same overdue/due-today `WHERE` logic `assessment-and-ce-workspace`'s Assessment Command Center already uses.
- "Open Referrals" reuses the same `Referral.status` vocabulary (`pending`/`new` = open) `case-workspace`'s Referrals tab and `coordinated-entry`'s "Send Referral" step already write.

## Capabilities

### New Capabilities
- `home-dashboard`: the aggregate `GET /api/dashboard/home` endpoint, the Home screen composition, the `dashboard` Redux slice, the shared `ListCard` component, and the minimal `DataQualityIssue` read model.

### Modified Capabilities
(none — this change is read-only against `client-management`, `case-management`, `assessment-tracking`, and `coordinated-entry`; no existing requirement in those specs changes.)

## Impact

- **Backend**: new `DataQualityIssue` Prisma model + migration; new `dashboard.routes.ts` / `.controller.ts` / `.service.ts`; new `dataQualityIssue.model.ts`/`.service.ts`; reuses existing `case.model.ts`, `assessment.model.ts`, `task.model.ts`, `referral.model.ts` query helpers rather than duplicating their WHERE-clause logic.
- **Frontend**: rewrites `apps/web/src/store/slices/dashboardSlice.ts` and `apps/web/src/routes/pages/HomePage.tsx`; adds `apps/web/src/components/ui/ListCard/`; adds `apps/web/src/features/dashboard/` for Home-specific panel components; no routing changes (`/` already resolves to `HomePage`).
- **Types**: replaces `packages/types/src/dashboard.ts`'s `DashboardSummary` with `HomeDashboardResponse` and its constituent panel/tile types.
- **No changes** to `client-management`, `case-management`, `assessment-tracking`, or `coordinated-entry` specs, schemas, or endpoints.
