## 1. Schema & Migration

- [x] 1.1 Add `DataQualityIssue` model to `apps/api/prisma/schema.prisma`: `id`, `title` (String), `clientId` (FK `Client`), `openedAt` (DateTime), `createdAt`/`updatedAt`; index on `clientId`. `daysOpen` is computed at read time, not a column (design.md Decision 3).
- [x] 1.2 Run `prisma migrate dev` to generate and apply the migration; confirm `prisma generate` output includes the new model. (Non-interactive shell doesn't support `migrate dev`; used `migrate diff --from-url --to-schema-datamodel` + a hand-placed migration folder + `migrate deploy`, same net result.)

## 2. Types (`packages/types`)

- [x] 2.1 Remove `packages/types/src/dashboard.ts`'s `DashboardSummary` and replace with `HomeDashboardResponse`, `HomeKpiTile`, `HomeTaskItem`, `HomeDataQualityAlertItem` per design.md's response shape.
- [x] 2.2 Confirm no other file imports `DashboardSummary` before removing it (expected: only the old `dashboardSlice.ts`, rewritten in section 4).

## 3. Backend

- [x] 3.1 Add `apps/api/src/models/dataQualityIssue.model.ts`: `countDataQualityIssues()`, `createDataQualityIssues(rows)`, `findDataQualityAlertsForHome()` (join client name, compute `daysOpen` at read time).
- [x] 3.2 Add `apps/api/src/services/dataQualityIssue.service.ts` with `ensureDemoDataQualityIssues()` (design.md Decision 3: guarded by a count check, picks up to 4 existing clients oldest-first, fixed demo title list, random `openedAt` 1-30 days back) — header comment marking this provisional demo data, not a rule engine.
- [x] 3.3 Add read helpers reused from existing modules, adding one only where missing:
  - `apps/api/src/models/case.model.ts`: `findActiveCaseloadClientIds(userId)` (reuses the `myCaseload` predicate) + `client.model.ts`'s `countClientsCreatedSince(clientIds, since)` for the "created this month" sub-line.
  - `apps/api/src/models/referral.model.ts`: added `countOpenReferrals()` reusing the `status: { in: ['pending', 'new'] }` predicate.
  - `apps/api/src/models/assessment.model.ts`: added `countAssessmentsDueOrOverdue()` reusing the existing private `dueTodayWhere()`/`overdueWhere()`.
  - `apps/api/src/models/task.model.ts`: added `findTasksDueOrOverdueForOwner(userId)` and `countTasksDueTodayForOwner(userId)`.
  - `apps/api/src/models/client.model.ts`: added `findOldestClientIds(limit)` for the data-quality demo seeding.
- [x] 3.4 Add `apps/api/src/services/dashboard.service.ts`: `getHomeDashboard(requestingUserId, requestingUserFirstName)` composing all of the above into the `HomeDashboardResponse` shape (KPI values + subLines per design.md Decision 2, `todaysTasks`, calls `ensureDemoDataQualityIssues()` then `dataQualityAlerts`, `todaysAppointments: []`, `recentlyAssessed: []`).
- [x] 3.5 Add `apps/api/src/controllers/dashboard.controller.ts` and `apps/api/src/routes/dashboard.routes.ts` (`GET /home`, mounted at `/api/dashboard`), behind `requireAuth`, using `sendSuccess`/`AppError` per the responder convention.
- [x] 3.6 Mount the new router in `apps/api/src/routes/index.ts` (the actual orchestrator for `/api/*` routers — `app.ts` just mounts `apiRouter` itself) alongside the other routers.
- [x] 3.7 Add `title`/`description`-equivalent redact check: confirmed no new PII-bearing free-text field was introduced (`DataQualityIssue.title` is a fixed demo string, not user input) — `src/utils/logger.ts`'s redact list needs no changes.

## 4. Frontend — types, slice, ListCard

- [x] 4.1 Rewrite `apps/web/src/store/slices/dashboardSlice.ts`: remove `fetchDashboardSummary`/`DashboardSummary` usage, add `fetchHomeDashboard` thunk hitting `GET /api/dashboard/home`, state shaped around `HomeDashboardResponse`.
- [x] 4.2 Add `apps/web/src/components/ui/ListCard/ListCard.tsx` per design.md Decision 5's props shape (`title`, `headerAction?`, `items`, `renderItem`, `isLoading?`, `emptyMessage`); export from `components/ui/index.ts` and `components/index.ts`. (Generic constrained to `T extends { id: string }` for a real React key instead of an index key — both real consumers already have one.)
- [x] 4.3 Add a `ui-preview` story for `ListCard` under `apps/web/ui-preview/stories/`, referencing the Home screen section of `docs/Housing360 Portal.html` it mirrors.

## 5. Frontend — Home screen composition

- [x] 5.1 Create `apps/web/src/features/dashboard/` for Home-specific panel pieces (`homeDashboardHelpers.ts`: `formatWelcomeDate`, `formatTaskDueDate`) — kept thin, `ListCard` owns the shell.
- [x] 5.2 Rewrite `apps/web/src/routes/pages/HomePage.tsx`: `ContentAreaTemplate` with `title="Welcome, {firstName}"` (read from `state.auth.currentUser`, independent of the dashboard fetch so it renders immediately), `subtitle={formatted current date}`, `actions` = New Intake / New Referral / New Case (design.md Decision 4), `kpiTiles` = the 4 KPI tiles from `dashboardSlice` state.
- [x] 5.3 Wire "New Intake" (local `showWizard` state + conditional `IntakeWizard`, mirroring `MyClientsPage`) and "New Case" (`NewCaseModal` with `isOpen`/`onClose`, wrap `HomePage` in `ToastProvider`) exactly per design.md Decision 4.
- [x] 5.4 Wire "New Referral" to `useNavigate()('/coordinated-entry')`.
- [x] 5.5 Render the two-column row: `ListCard` for Today's Tasks (title/context-line/due-date/overdue flag per row) and `ListCard` for Data Quality Alerts (issue title/client name/days-open per row).
- [x] 5.6 Render the second two-column row: `ListCard` for Today's Appointments and `ListCard` for Recently Assessed, both `items={[]}` with the not-yet-specified `emptyMessage` copy from design.md Decision 5.
- [x] 5.7 Dispatch `fetchHomeDashboard` on mount; loading handled via `ListCard`'s own `isLoading` prop, zero counts render normally (no fetch-time errors surfaced for empty-but-valid data, per spec's empty-state requirement).

## 6. Verification

- [x] 6.1 `npm run lint` (layering boundary + `no-console`/redact rules) and `npx tsc -b tsconfig.json` in `apps/web` (real type-check, not the solution-style no-op) plus `apps/api`'s `tsc -p tsconfig.json --noEmit`. All four clean.
- [x] 6.2 Manually verified against the running dev server (`curl` with the seeded demo user's session cookie): `tasksDueToday`/`assessmentsDue` both legitimately `0` with correct zero-state sub-lines ("Nothing due today"/"None overdue"), `todaysTasks: []`, all in a 200 response — confirmed the empty-state path, not an error path. Unauthenticated request confirmed 401.
- [x] 6.3 Manually verified: on first request, one demo `DataQualityIssue` row was created referencing the one real seeded client ("Testy Fixture615779"), with a computed `daysOpen`; a second request returned the same single row (idempotent, no duplicate creation).
- [x] 6.4 Manually verified in a real browser (Playwright, logged in as the seeded demo user): "New Intake" opens `IntakeWizard`'s search phase, "New Case" opens `NewCaseModal`'s form, "New Referral" navigates to `/coordinated-entry` — all three screenshotted, zero browser console errors across the whole flow (login → Home → both modals → referral navigation).
- [x] 6.5 Updated the root `CLAUDE.md` per the standing rule (see below).
