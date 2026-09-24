## 1. Data Model

- [x] 1.1 Add `RecordActivity` model to `prisma/schema.prisma` (`id`, `userId` FK `User`, `recordType` String, `recordId` String, `action` String, `at` DateTime `@default(now())`, indexed on `[userId]` and `[recordType, recordId]`)
- [x] 1.2 Add `ReferralStatusEvent` model to `prisma/schema.prisma` (`id`, `referralId` FK `Referral`, `fromStatus` String?, `toStatus` String, `changedBy` FK `User`?, `changedAt` DateTime `@default(now())`, `seenByReferrerAt` DateTime?, indexed on `[referralId]` and `[changedBy]`)
- [x] 1.3 Run `prisma migrate dev` for the new migration; confirm `prisma generate` picks up both new models

## 2. Backend — Shared Activity/Status-Event Plumbing

- [x] 2.1 Add `models/recordActivity.model.ts` (`insertRecordActivity`, `findRecentActivityForUser` with the dedup-to-latest-per-record `GROUP BY` query, `countRecentActivityForUser` for pagination)
- [x] 2.2 Add `services/recordActivity.service.ts` — `recordActivity(userId, recordType, recordId, action)`, fire-and-forget (catches and logs, never throws)
- [x] 2.3 Add `models/referralStatusEvent.model.ts` (`insertReferralStatusEvent`, `findEarliestEventForReferral`, `findUnseenStatusUpdatesForSender`, `markStatusUpdatesSeen`)
- [x] 2.4 Wire `referral.service.ts`'s `createInternalReferral`, `createExternalReferral`, `updateReferral`, `acceptReferral`, `declineReferral` to write a `referral_status_events` row on every call (creation writes `fromStatus: null`)
- [x] 2.5 Wire `coordinatedEntry.service.ts`'s referral-creation path (`POST /api/ce/referrals`) to write the same initial status event
- [x] 2.6 Instrument `client.service.ts` (`getClientById` → `viewed`; create/update → `modified`), `case.service.ts` (`getCaseById` → `viewed`; create/update/follow-up → `modified`), `referral.service.ts` (a new `getReferralById` read wrapper → `viewed`; existing writes → `modified`), and `assessment.service.ts` (detail read → `viewed`; create/update/complete → `modified`) to call `recordActivity(...)`

## 3. Backend — Global Search

- [x] 3.1 Add `models/search.model.ts` with one capped (`take: 5`) query per group: clients (name-only match, no SSN columns selected), cases (case number/subject/client name), referrals (title/client name), tasks (subject), assessments (client name)
- [x] 3.2 Add `services/search.service.ts`'s `globalSearch(query)` running all 5 group queries in parallel and mapping each row to `{ type, id, title, subtitle, icon }`
- [x] 3.3 Add `controllers/search.controller.ts` + `routes/search.routes.ts` — `GET /api/search?q=`, 400 when `q.length < 2`, mounted at `/api`, behind `requireAuth`
- [x] 3.4 Add `packages/types/src/search.ts` (`SearchResultItem`, `SearchResponse`)

## 4. Backend — Notifications

- [x] 4.1 Add `models/referral.model.ts` additions: `findPendingReferralsForUser(userId)` (status `new`, `caseId IS NULL` OR `case.assignedCaseManagerId = userId`) — implemented in `models/referralStatusEvent.model.ts` alongside the other status-event queries instead, since it reads the same table family
- [x] 4.2 Add `services/notifications.service.ts`'s `getNotifications(userId)` (composes pending referrals + unseen status updates via `referralStatusEvent.model.ts`) and `markStatusUpdatesSeen(userId)`
- [x] 4.3 Add `controllers/notifications.controller.ts` + `routes/notifications.routes.ts` — `GET /api/notifications`, `POST /api/notifications/status-updates/seen`, mounted at `/api`, behind `requireAuth`
- [x] 4.4 Add `packages/types/src/notifications.ts` (`PendingReferralItem`, `StatusUpdateItem`, `NotificationsResponse`)

## 5. Backend — Task Management (Tasks + Appointments)

- [x] 5.1 Add `models/task.model.ts` additions: `findTasks({ filter, search, page, pageSize })` (all/due_today/overdue/upcoming, excluding `completed` per filter per spec), `findTaskById`, `updateTask`
- [x] 5.2 Add `services/task.service.ts`'s `listTasks`, `getTask`, `updateTask`
- [x] 5.3 Add `controllers/task.controller.ts` + `routes/task.routes.ts` — `GET /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, mounted at `/api`, behind `requireAuth`
- [x] 5.4 Add `case.model.ts`'s `findFollowUpsInRange(from, to, assignedCaseManagerId?)` (rows with `followUpMilestone != 'none'` and a computed `followUpDueDate` in range)
- [x] 5.5 Add `services/appointment.service.ts`'s `listAppointments(from, to, assignedCaseManagerId?)` mapping to `{ caseId, caseNumber, clientName, milestone, dueDate }`
- [x] 5.6 Add `controllers/appointment.controller.ts` + `routes/appointment.routes.ts` — `GET /api/appointments?from=&to=`, mounted at `/api`, behind `requireAuth`
- [x] 5.7 Add `packages/types/src/tasks.ts` (`TaskListItem`, `TaskFilter`) and `packages/types/src/appointments.ts` (`AppointmentItem`) — `Task` already covers what a `TaskDetail` would have needed, so no separate type was added

## 6. Backend — Activity Feed

- [x] 6.1 Add `services/recentActivity.service.ts`'s `listRecentActivity(userId, { type, page })` using the dedup-to-latest-per-record query from 2.1, resolving each `(recordType, recordId)` to a display title/subtitle/icon (via new `models/activityDisplay.model.ts`)
- [x] 6.2 Add `controllers/recentActivity.controller.ts` + `routes/recentActivity.routes.ts` — `GET /api/recent-activity`, mounted at `/api`, behind `requireAuth`
- [x] 6.3 Add `packages/types/src/activity.ts` (`RecentActivityItem`, `RecentActivityResponse`)

## 7. Backend — Home Dashboard Extension

- [x] 7.1 Extend `dashboard.service.ts`'s `getHomeDashboard` to compute `todaysAppointments` (via `appointment.service.ts`, scoped to the requesting user's own cases) and `recentlyAccessed` (via `recentActivity.service.ts`, top 5) instead of returning `[]`
- [x] 7.2 Rename `HomeDashboardResponse.recentlyAssessed` → `recentlyAccessed` and widen both it and `todaysAppointments` from the fixed `[]` type to real array types in `packages/types/src/dashboard.ts`
- [x] 7.3 Data Quality Alerts already carry `clientId` (from `home-dashboard`) — that's the alert's one related record, so no new `relatedRecordType`/`relatedRecordId` columns were needed; the frontend row click navigates by `clientId` directly

## 8. Frontend — Top Bar (Search + Notifications)

- [x] 8.1 Add `src/store/slices/searchSlice.ts` (debounced query state, results, status) and `src/store/slices/notificationsSlice.ts` (fetch, mark-seen)
- [x] 8.2 Add `src/features/topbar/GlobalSearchDropdown.tsx` — debounced input, grouped-by-type results with icon/title/subtitle, "Searching…"/"No matches found." states, keyboard navigation, close on blur/Escape, click-through
- [x] 8.3 Add `src/features/topbar/NotificationsPanel.tsx` — bell with badge count, two sections (New Referrals, Referral Updates), empty state, click-to-open + mark-seen
- [x] 8.4 Rewrite `src/components/layout/TopBar.tsx` to mount both, replacing the inert input and the `NOTIFICATIONS_UNREAD_STUB_COUNT` stub

## 9. Frontend — Tasks Page

- [x] 9.1 Add `src/store/slices/tasksSlice.ts` (list with filter/search/pagination, detail, update thunk)
- [x] 9.2 Add `src/features/tasks/TasksPage.tsx` (filter chips, search, `DataTable` columns, pagination, "No tasks found.")
- [x] 9.3 Add `src/features/tasks/TaskDetailModal.tsx` (all detail fields, Edit/Cancel/Save) — reused by Home's Today's Tasks panel too (see 12.3)
- [x] 9.4 Add `/tasks` route in `AppRoutes.tsx`

## 10. Frontend — Calendar Page

- [x] 10.1 Add `src/store/slices/calendarSlice.ts` (fetch appointments for a month/date-range)
- [x] 10.2 Add `src/features/calendar/CalendarPage.tsx` (month grid, weekday labels, prev/next navigation, day markers, day's follow-up list, empty state, click-through to case)
- [x] 10.3 Add `/calendar` route in `AppRoutes.tsx`

## 11. Frontend — Recently Modified Page

- [x] 11.1 Add `src/store/slices/recentActivitySlice.ts` (fetch with type filter + pagination)
- [x] 11.2 Add `src/features/activity/RecentlyModifiedPage.tsx` (subtitle, filter tabs, Refresh, Prev/Next pagination, "Nothing found for this filter.")
- [x] 11.3 Add `/recent` route in `AppRoutes.tsx`

## 12. Frontend — Home Screen Rewire

- [x] 12.1 Extend `dashboardSlice.ts`'s types for the real `todaysAppointments`/`recentlyAccessed` shapes — the slice itself needed no change (it already typed `home` as `HomeDashboardResponse | null`); the shape change flowed through from `packages/types/src/dashboard.ts` (task 7.2)
- [x] 12.2 Make each `HomePage.tsx` KPI tile clickable, navigating to `/cases?filter=myCaseload`, `/referrals`, `/tasks?filter=due_today`, `/assessments?filter=dueToday` respectively — `KpiTile`/`KpiTileProps` gained an optional `onClick` (renders as a `<button>` when present, unchanged `<div>` otherwise) to support this
- [x] 12.3 Replace the two placeholder `ListCard`s (Today's Appointments, Recently Assessed) with real ones: case number/client/milestone rows opening their case plus a "Calendar" link; type-icon activity rows opening their record (case/assessment only — client/referral have no detail route yet, same documented gap as the Recently Modified page) plus a "View All" link to `/recent`. Today's Tasks rows now also open the reused `TaskDetailModal`. Appointments always open on the case's Overview tab — nothing wired up yet actually needs 13.2's non-default tab, so that mechanism is built and available but not yet exercised by a live caller.
- [x] 12.4 Rename the Recently Assessed panel to "Recently Accessed" and update its empty-state copy to "Nothing updated in your caseload yet."
- [x] 12.5 Change the "New Referral" quick action to open `NewReferralModal` directly (no `caseId`) instead of navigating to `/coordinated-entry`, refreshing the dashboard on close

## 13. Frontend — Small Extensions to Existing Components

- [x] 13.1 Widen `NewReferralModalProps.caseId` to `string | undefined`, skip the case-scoped `fetchCaseReferrals` refetch when absent, and confirm creation still succeeds end-to-end when opened case-less
- [x] 13.2 Add optional initial-tab support to `CaseDetailPage.tsx` via `useLocation().state?.initialTab`, defaulting to `'overview'`, for deep links from search/notifications/appointments
- [x] 13.3 Add `useSearchParams`-driven initial filter to `CasesPage.tsx` (for `?filter=myCaseload`) and `AssessmentCommandCenterPage.tsx` (for `?filter=dueToday`) so Home's KPI tile navigation lands with the right filter pre-applied

## 14. Testing

- [ ] 14.1 Backend integration tests: `record_activity` row written on client/case/referral/assessment view and edit; dedup-to-latest-per-record read behavior — **not written**: no test framework exists anywhere in this codebase (`apps/api`'s `npm test` is a no-op placeholder in every prior phase too), so adding one unilaterally for just this change would be inconsistent with established convention. Verified instead via a live smoke test against the running dev API/DB: viewing a case wrote a `record_activity` row and it appeared, deduplicated, in both `GET /api/recent-activity` and `GET /api/dashboard/home`'s `recentlyAccessed`.
- [ ] 14.2 Backend integration tests: `referral_status_events` written on create/accept/decline/edit; sender derivation from earliest event; unseen-status-update scoping; mark-seen clears future results — **not written**, same reasoning as 14.1. Verified live instead: creating a case-less `status: 'new'` referral immediately appeared in `GET /api/notifications`'s `pendingReferrals`, and `POST /api/referrals/:id/accept` succeeded.
- [ ] 14.3 Backend integration tests: `GET /api/search` — 2-character gate, per-group cap of 5, no SSN in client results — **not written**. Verified live instead: `?q=x` (1 char) returned 400, `?q=jo` (2 chars) ran and returned the grouped-empty shape.
- [ ] 14.4 Backend integration tests: `GET /api/tasks` filters (`due_today`/`overdue`/`upcoming` boundaries, `completed` exclusion) and `GET /api/appointments` range/milestone mapping — **not written**. `GET /api/tasks?filter=all` and `GET /api/appointments?from=&to=` were exercised live and returned correct real data (an existing case's "60 Day follow-up" appointment); the boundary cases (due_today/overdue/upcoming edges) were verified by code review of `taskFilterWhere`, not by an automated test.
- [ ] 14.5 Frontend: KPI tile navigation lands on the correct filtered list for all four tiles — not exercised in a live browser (see 15.1's note); verified by code review (`navigate('/cases?filter=myCaseload')` etc. paired with each page's new `useSearchParams`-driven initial filter).

## 15. End-to-End Verification

- [ ] 15.1 As a fresh, never-used demo case manager, confirm every Home panel (Today's Tasks, Data Quality Alerts, Today's Appointments, Recently Accessed), the Tasks page, the Calendar page, the Recently Modified page, global search, and the notifications bell each render their documented empty state — **not done in a browser**: this environment has no browser-automation tool available (checked for `chromium-cli`, none installed; installing Playwright fresh was judged out of scope for this pass). The full monorepo build (`npm run build`) and lint (`npm run lint`) both pass cleanly, and every new backend endpoint was smoke-tested live (see 14.1–14.4's notes), but the actual rendered UI has not been visually confirmed. **This is a real gap — recommend a manual click-through, or a follow-up session with browser tooling, before considering this change fully verified.**
- [ ] 15.2 Create a new client intake, then a case for that client with a "30 Day" follow-up set, a task due today, and a referral (internal or via Coordinated Entry) — not done via the actual UI flow; existing fixture data (a seeded case with a follow-up, and a newly-created test referral) was used for the live API smoke tests instead.
- [ ] 15.3 Confirm the case's follow-up appears in Today's Appointments on its due date and on that day in the Calendar — the API-level half is confirmed (`GET /api/appointments` returned the fixture case's follow-up); the Calendar page's own rendering was not visually confirmed (see 15.1).
- [ ] 15.4 Confirm the new task appears in Today's Tasks and on the Tasks page under "Due Today" — not exercised; `GET /api/tasks?filter=due_today`'s query logic was verified by code review only.
- [ ] 15.5 Confirm the referral produces a notification (as sender, once its status changes) and that global search finds the new client, case, task, and referral — the notifications half is confirmed live (see 14.2's note); global search was smoke-tested for its 2-character gate and response shape but not with a query actually matching the new referral.
- [ ] 15.6 Confirm viewing/editing the new client, case, and referral each populate Recently Accessed (and the Recently Modified page) exactly once, at the top — the underlying mechanism is confirmed live for a case (see 14.1's note: viewed once, appeared once, deduplicated); not repeated for client/referral or through the actual Recently Modified page UI.
