## Why

`home-dashboard` (Phase 6) shipped the Home screen's layout and KPI math, but left three things as documented stand-ins: the top bar's search and notifications controls are unwired stubs, Today's Appointments and Recently Assessed render a "not yet specified" empty state with no backing data, and there is no real place for a task, a follow-up, or a piece of recent activity to be opened from. Every module that produces this data — `client-intake` (3b), `case-workspace` (4b, follow-up milestones and referrals), and `assessment-and-ce-workspace` (5b, assessments and CE referrals) — has been in place since before this proposal. This change closes the gap: it gives the Home screen its intended real content and adds the four small screens (Tasks, Calendar, Recently Modified, plus the top bar's search/notifications) those panels link out to, without introducing any new domain concept beyond two small, purely observational tables.

## What Changes

- Add `record_activity` (a generic, service-written view/modify log for `client`/`case`/`referral`/`assessment` records) and `referral_status_events` (one row per referral status transition), both read models — nothing else in the app changes shape.
- **BREAKING**: `home-dashboard`'s `HomeDashboardResponse.todaysAppointments` and `.recentlyAssessed` are no longer fixed-empty (`[]` literal) types — they carry real `HomeAppointmentItem[]` / `HomeRecentActivityItem[]` payloads. `GET /api/dashboard/home` now derives KPI sub-lines and the two panels from real data instead of always returning empty arrays.
- Add `GET /api/search` — a top-bar global search across Clients, Cases, Referrals, Tasks, and Assessments, scoped to what the requesting case manager can see, at most 5 hits per group, minimum 2 characters, masked SSN only.
- Add `GET /api/notifications` and `POST /api/notifications/status-updates/seen` — pending-referral and referral-status-update notifications for the top bar's bell.
- Add `GET /api/appointments` — case follow-up milestones (`Case.followUpMilestone`/`followUpDueDate`) in a date range, backing the new Calendar page. No new "appointment" data model; an appointment *is* a case follow-up.
- Add `GET /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id` — a real Task list/detail/edit surface behind the existing `Task` table (previously only ever read by the Home/Overview-tab panels).
- Add `GET /api/recent-activity` — a paginated, filterable feed over `record_activity`, scoped to the requesting case manager's own caseload.
- Replace the top bar's inert search input and 0-badge bell (`apps/web/src/components/layout/TopBar.tsx`) with a working debounced global search dropdown and a working notifications panel.
- Add three new routed screens: `/tasks` (Tasks page), `/calendar` (Calendar page), `/recent` (Recently Modified page).
- Rewire the Home screen's KPI tiles to navigate to their matching filtered list, and its Today's Appointments / Recently Accessed panels to render real rows with click-through, per `home-dashboard`'s own "TBD: expand as future changes give these real backing data" note.
- Extend `case-workspace`'s `NewReferralModal` to accept an optional `caseId` (the `Referral` model and API already allow a case-less referral — see `client.model.ts`'s `attachOrphanReferralsToCase`), so Home's "New Referral" quick action can reuse it directly instead of redirecting into the Coordinated Entry wizard.
- Give `CaseDetailPage` an optional initial-tab entry point (e.g. via route state or a query param) so search results, notifications, and Today's Appointments rows can deep-link straight to a case's Referrals tab (or wherever the click needs to land) instead of always opening on Overview.

## Capabilities

### New Capabilities
- `global-search`: the top bar's cross-entity search endpoint and dropdown UI.
- `notifications`: the top bar's bell — pending-referral and referral-status-update notifications, and the `referral_status_events` audit trail that feeds the latter.
- `task-management`: the Task list/detail/edit API and the new Tasks page, plus the case-follow-up-derived Calendar/Appointments API and page (appointments are a read over existing `Case` columns, grouped here with Tasks as the app's two "things due on a date" surfaces).
- `activity-feed`: the `record_activity` write path (fed by `client-management`, `case-management`, the Referrals tab, and `assessment-tracking`'s own services) and the read/paginate API plus the Recently Modified page.

### Modified Capabilities
- `home-dashboard`: `GET /api/dashboard/home` gains real `todaysAppointments` and `recentlyAssessed` payloads (replacing the always-empty arrays), KPI tiles become clickable/navigable, and the Home screen's quick actions and panels wire into the newly-added screens instead of rendering placeholder empty states.

## Impact

- **Database**: two new tables, `record_activity` and `referral_status_events` (see design.md for exact columns) — both purely additive, no changes to existing tables/columns.
- **Backend**: new `search`, `notifications`, `task`, `appointment`, and `recentActivity` route/controller/service/model quartets; `referral.service.ts` gains a status-event write on every status transition (`updateReferral`, `acceptReferral`, `declineReferral`, and CE's referral creation path); `client.service.ts`, `case.service.ts`, `referral.service.ts`, `assessment.service.ts` each gain a `recordActivity(...)` call on their existing read-detail and write paths; `dashboard.service.ts` is extended, not replaced.
- **Frontend**: `TopBar.tsx` rewritten; three new routed pages (`TasksPage`, `CalendarPage`, `RecentlyModifiedPage`) under `apps/web/src/routes/pages/` with feature code under `apps/web/src/features/` per the standing per-feature convention; five new/extended Redux slices (`search`, `notifications`, `tasks`, `calendar`, `recentActivity`, plus `dashboard` extended); `HomePage.tsx` rewired; `NewReferralModal.tsx` and `CaseDetailPage.tsx` get small, backward-compatible prop extensions.
- **Types**: `packages/types/src/dashboard.ts`'s `HomeDashboardResponse` shape changes (breaking, as noted above); new shared types for search results, notifications, tasks, appointments, and activity-feed items.
