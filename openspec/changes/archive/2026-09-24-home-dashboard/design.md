## Context

`client-management`, `case-management`, `assessment-tracking`, and `coordinated-entry` are all archived and each already computes the counts Home needs to roll up: `case.model.ts`'s `countCaseKpis`/`filterWhere('myCaseload', ...)`, `assessment.model.ts`'s `dueTodayWhere`/`overdueWhere`, and `referral.service.ts`/`coordinatedEntry.service.ts`'s `status: 'pending' | 'new'` convention for an open referral. The Home screen is purely a read-only rollup over these — it must reuse their existing query logic rather than re-derive it, both to satisfy the "KPI numbers match what those modules actually report" requirement and to avoid two sources of truth for the same count drifting apart.

The frontend already has dead scaffolding pointed at this screen: `dashboardSlice.ts` fetches `/dashboard/summary` (a route that has never existed on the backend — confirmed, no `dashboard` router is mounted anywhere in `apps/api/src`), and `HomePage.tsx` is the literal "Home screen content coming soon" stub. Nothing currently imports or renders real dashboard data, so replacing both outright is a clean, low-risk swap.

## Goals / Non-Goals

**Goals:**
- One aggregate `GET /api/dashboard/home` request populates the whole screen — no client-side fan-out.
- Every number on the screen is traceable to (and reuses the query logic of) the module that owns it.
- `ListCard` becomes the one shared shell for "titled card containing rows," so `TasksCard`/`InteractionSummariesCard`-style duplication doesn't grow a third and fourth time on this screen.
- The two panels with no real data source yet (Today's Appointments, Recently Assessed) are visually present (matching the design reference's layout) but unambiguously marked as not-yet-built, never populated with invented data.

**Non-Goals:**
- No real Data Quality rule engine — `DataQualityIssue` is a read model with a handful of demo rows, explicitly a stand-in.
- No full Referrals module (list/detail/accept/decline UI) — Open Referrals only needs a count + a "pending review" sub-line, both already answerable from the existing `Referral` table.
- No full task-management module — Today's Tasks reads the existing shared `Task` table as-is; no new task types, assignment UI, or completion workflow beyond what already exists.
- No calendar/appointments integration, no assessment-completion activity feed — those are the two explicitly-deferred panels.
- No change to any existing module's own endpoints, filters, or stored data.

## Decisions

### 1. Reuse existing query helpers instead of re-deriving counts

`dashboard.service.ts` calls into `case.model.ts`, `assessment.model.ts`, `referral.model.ts`, and `task.model.ts` directly (new thin read functions added to each where one doesn't already exist, e.g. `countOpenReferrals()` in `referral.model.ts` reusing the same `status: { in: ['pending', 'new'] }` predicate `referral.service.ts` and `coordinatedEntry.service.ts` already write) rather than writing fresh Prisma queries in a new `dashboardQuality`-style god-query. This is the direct mechanism behind the "four KPI tiles match what client-management/assessment-tracking/coordinated-entry actually report" spec scenario — same WHERE clause, same result, by construction rather than by coincidence.

**Alternative considered**: a single raw SQL aggregate query for all four tiles. Rejected — it would duplicate each module's status vocabulary (`'pending'`/`'new'` for referrals, `overdueWhere`'s date-boundary logic for assessments) in a second place that silently drifts if either module's convention changes.

### 2. Personal vs. org-wide scoping, per tile

- **Active Caseload** and **Today's Tasks** are personal to the requesting case manager: `Client` count via `Case.assignedCaseManagerId = req.user.id AND Case.status = 'open'` (the exact `myCaseload` predicate from `case.model.ts`'s `filterWhere`, deduplicated to distinct `clientId`), and `Task` rows via `Task.ownerId = req.user.id`. "Caseload" and "my tasks" are inherently personal concepts, and `assignedCaseManagerId`/`ownerId` are the two fields in the schema that already express personal ownership.
- **Open Referrals** and **Assessments Due** are org-wide counts, matching the precedent already set by `case-management`'s own KPI row (`getCaseKpiCounts()` has no `requestingUserId` filter) and `assessment-tracking`'s Command Center KPIs (`countAssessmentKpis()`, also unfiltered). Neither `Referral` nor `Assessment` carries an "assigned case manager" field to scope by (only `Assessment.assessorId`, set at completion time, not at creation — scoping open work by who eventually assesses it doesn't make sense).

Sub-lines: Active Caseload's `+N created this month` counts, of that same personal caseload, the clients whose `Client.createdAt` falls in the current calendar month. Open Referrals' `N pending review` is the same count as the tile value, phrased as a sub-line (mirrors the "24 pending review" example in the source prompt). Assessments Due's sub-line is `"Requires immediate completion"` (static) when the overdue subset (via `assessment.model.ts`'s existing `overdueWhere()`) is non-empty, else `"None overdue"`.

**Alternative considered**: making every tile org-wide for consistency. Rejected — "Active Caseload" and "Tasks Due Today" read as first-person to a case manager looking at their own Home screen; making them global counts would be actively misleading (a case manager would see every case manager's tasks as "due today" for them).

### 3. `DataQualityIssue` demo data is seeded lazily by the dashboard service, not `prisma/seed.ts`

`DataQualityIssue.clientId` is a required FK to `Client` (matching every other "client reference" field in the schema) so a row can render "Client: Jane D." the way the design reference shows. But `apps/api/prisma/seed.ts` runs at install time, before any `Client` row exists — clients are only ever created through the intake flow at runtime, never seeded (see `client-management`/`client-intake`'s specs). Attaching seed-time `DataQualityIssue` rows to a client is therefore structurally impossible at `prisma db seed` time.

Resolution: `dataQualityIssue.service.ts` exposes `ensureDemoDataQualityIssues()`, called once per `GET /api/dashboard/home` request before reading the panel (a single cheap `count()` query guards it — if `DataQualityIssue` count is already `> 0`, or zero `Client` rows exist yet, it's a no-op). The first time the endpoint is hit after at least one real client exists, it creates up to 4 rows from a fixed title list (`"Prior Living Situation Required"`, `"Duplicate Person Account Suspected"`, `"Missing SSN Documentation"`, `"Disability Verification Needed"`), each attached to a distinct existing client (oldest-first) with a random-but-plausible `openedAt` (1-30 days back) so `daysOpen` looks realistic. This directly exercises the "zero of something" empty-state scenario the spec must cover: before any client exists, the panel legitimately returns an empty list, not an error.

`daysOpen` itself is computed at read time from `openedAt` (`Math.floor((now - openedAt) / 1 day)`), following the same "computed at read time, never a stored duplicate" convention `case-management`'s `tabsWithContent` and `release-of-information`'s active-consent check already use.

**Alternative considered**: seed `DataQualityIssue` with `clientId: null` (nullable FK) and render a generic label when absent. Rejected — the prompt's own example rows ("Prior Living Situation Required," "Duplicate Person Account Suspected") are inherently per-client issues; a null-client demo row would misrepresent the eventual real shape more than a lazy-seed does.

**This entire mechanism is provisional**, called out in a header comment on `dataQualityIssue.service.ts` and in the panel's API response (see specs) — it is replaced wholesale, not extended, when the real Data Quality rule engine change lands.

### 4. Quick Actions reuse existing flows as-is; "New Referral" is a navigation, not a new shortcut

- **New Intake** → identical to `MyClientsPage`'s pattern: local `showWizard` boolean, `<IntakeWizard onClose={...} onViewClient={...} />` conditionally rendered. `onViewClient`/`onClose` both just close the wizard on Home (no client-detail route exists to jump to yet, same documented gap `MyClientsPage.onViewClient` already has).
- **New Case** → identical to `CasesPage`'s pattern: `<NewCaseModal isOpen={...} onClose={...} />`, wrapped in `ToastProvider` (required — `NewCaseModal` calls `useToast()` internally).
- **New Referral** → `navigate('/coordinated-entry')`. `CoordinatedEntryWizard` has no prop, route param, or Redux action to start anywhere but step 1 (`Step1VulnerabilityAssessment`) — reaching "Send Referral" always requires completing a CE assessment for a selected client first, and the internal-referral path (`NewReferralModal`) requires an existing `caseId`, which Home has no reason to already have. Building a shortcut into either flow is out of scope (the proposal says "reuse the referral creation from `coordinated-entry`," not "build a new entry point into it") — this is a straight navigation, same as clicking the Coordinated Entry nav-rail item.

**Alternative considered**: a Home-local mini "start CE assessment" modal that pre-selects a client and jumps straight to step 4. Rejected as new scope beyond "reuse" — `coordinated-entry`'s own spec would need a requirement change to expose a step-4-only entry point, which the proposal's Capabilities section deliberately doesn't include.

### 5. `ListCard` — generic props, four consumers on this screen

```ts
interface ListCardProps<T> {
  title: string;
  headerAction?: { label: string; onClick: () => void };
  items: T[];
  renderItem: (item: T) => ReactNode;
  isLoading?: boolean;
  emptyMessage: string;
}
```

Modeled directly on `TasksCard`/`InteractionSummariesCard`'s shared shell (`rounded-2xl bg-surface p-8 shadow-card` header row + `<ul>` of bordered `<li>` rows + loading/empty states) — those two are not refactored to use it in this change (out of scope, no behavior change needed there), but any future refactor should converge on this component rather than adding a fifth hand-rolled copy.

Home mounts it four times: **Today's Tasks** (rows = title/context-line/due-date/overdue flag, `renderItem` supplies a coral-toned overdue indicator), **Data Quality Alerts** (rows = issue title/client name/days-open), **Today's Appointments** and **Recently Assessed** (both mounted with `items: []` and an explicit `emptyMessage` — `"Appointments aren't tracked yet — this panel is reserved for a future change."` / `"Recently assessed clients aren't tracked yet — this panel is reserved for a future change."` — no `notYetSpecified` special-case prop; an empty list with a purpose-written message is sufficient and keeps `ListCard` itself fully generic).

### 6. Home page composition via `ContentAreaTemplate`, no new layout component

`ContentAreaTemplate`'s existing `title`/`subtitle`/`actions`/`kpiTiles` props already cover three of the four layout requirements with zero new component:
- `title="Welcome, {firstName}"`, `subtitle="{formatted current date}"` → the welcome band.
- `actions` → the three quick-action buttons (`PageHeaderAction[]`, `onClick` handlers per Decision 4) — `PageHeader` already renders these as a `Button` row beside the title, matching the design reference's single welcome-band-plus-buttons row.
- `kpiTiles` → the 4 `KpiTile`s, same pattern as `CasesPage`'s KPI row.
- `children` → the two two-column rows (`grid grid-cols-2 gap-7`, matching no existing precedent exactly but consistent with the token system — no new grid token needed, `gap-7` is already used for row spacing elsewhere).

### 7. Response shape

```ts
interface HomeDashboardResponse {
  caseManagerFirstName: string;
  kpis: {
    activeCaseload: { value: number; subLine: string };
    openReferrals: { value: number; subLine: string };
    tasksDueToday: { value: number; subLine: string };
    assessmentsDue: { value: number; subLine: string };
  };
  todaysTasks: HomeTaskItem[];
  dataQualityAlerts: HomeDataQualityAlertItem[]; // provisional — see Decision 3
  todaysAppointments: []; // always empty — not yet specified
  recentlyAssessed: []; // always empty — not yet specified
}
```

One request, matching the "one fetch, not five" convention `cases`/`assessments`' own list endpoints already establish for KPI-row-plus-table screens.

## Risks / Trade-offs

- **[Risk]** Mixing personal (Active Caseload, Tasks Due Today) and org-wide (Open Referrals, Assessments Due) scoping on the same KPI row could read as inconsistent. → Mitigation: each tile's `subLine` copy makes the scope legible ("your caseload" framing is implicit in "Active Caseload," while "24 pending review" doesn't imply personal ownership); documented explicitly here so a future change doesn't "fix" it into false consistency.
- **[Risk]** Lazy-seeding `DataQualityIssue` on a GET request is an unusual side effect for a read endpoint. → Mitigation: guarded by a single indexed `count()` check, effectively free after the first successful seed; the whole mechanism is deleted, not extended, when the real rule engine change lands, so it's not meant to accumulate more logic.
- **[Risk]** Demo `DataQualityIssue` rows are static/fake, not derived from real HUD data gaps — could be mistaken for real findings. → Mitigation: response carries the panel data under a shape whose backing service file has a header comment marking it provisional (per the proposal's explicit requirement), and the proposal itself documents this; a future change is expected to replace the mechanism outright.
- **[Risk]** "New Referral" navigating away from Home (rather than opening a modal like the other two quick actions) is a slightly inconsistent interaction. → Mitigation: acceptable given the alternative is out-of-scope new CE surface area; documented in Decision 4 so it isn't "fixed" as a bug later without re-litigating the scope call.

## Migration Plan

1. Prisma migration adding `DataQualityIssue` (no backfill — lazily populated per Decision 3).
2. Mount the new `dashboard` router in `apps/api/src/app.ts` alongside the existing routers.
3. Frontend: replace `dashboardSlice.ts` and `HomePage.tsx` wholesale; no route changes needed since `/` already resolves to `HomePage`.
4. Rollback: drop the `DataQualityIssue` table/migration and unmount the router; `HomePage`/`dashboardSlice` revert to the prior stub via normal git revert (nothing else depends on the new types).

## Open Questions

- Whether "Recently Assessed" should eventually be trivially derivable from existing `Assessment.updatedAt`/`status = 'completed'` data (it plausibly could be, unlike "Today's Appointments," which has no backing concept anywhere in the schema) is left for whoever picks up that panel next — this change intentionally treats both the same way per the proposal's explicit instruction not to invent content for either.
- Exact demo `DataQualityIssue` title list (4 chosen here) and `openedAt` randomization range are cosmetic and can be adjusted freely during implementation without a spec change.
