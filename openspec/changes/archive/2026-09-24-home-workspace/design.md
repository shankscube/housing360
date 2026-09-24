## Context

`home-dashboard` (Phase 6) shipped `GET /api/dashboard/home` and the Home screen's layout, but two of its five panels (Today's Appointments, Recently Assessed) were always-empty by design, the top bar's search input and notifications bell were inert stubs, and the four KPI tiles weren't clickable. Every table and service this change reads from already exists: `Client` (3b), `Case`/`Task`/`Referral`/`Organization`/`CarePlan` (4b), `Assessment`/`CeAssessment` (5b). This change is additive glue across those modules plus two small, purely observational tables — it does not change how any existing module computes or stores its own domain data.

Two structural gaps surfaced during design that the proposal's data model doesn't cover, and both needed a decision rather than a new table (the proposal is explicit: "read from the existing tables; add only what is listed"):

1. **No user↔organization/program membership model exists.** `User` has only `role` (`case_manager`/`admin`); there is no field tying a case manager to the `Organization`/`Program` rows a referral might be "routed to." Every existing multi-case-manager KPI in this app (Cases' `activeCasesTrend`, `case-management`'s own KPI row, `assessment-tracking`'s KPI row) is already org-wide rather than per-organization for the same reason — there's no organizational boundary to scope by yet.
2. **`Referral` has no creator/sender column.** `referral_status_events.changed_by` records who made *a* change, but nothing records who originally sent a referral, which the notifications spec needs to answer "referrals the user sent."

## Goals / Non-Goals

**Goals:**
- Give Today's Appointments and Recently Assessed (renamed **Recently Accessed** — see Decision 6) real data, sourced entirely from existing tables plus the two new ones.
- Make the top bar's search and notifications real, and make all four Home KPI tiles clickable.
- Add the Tasks, Calendar, and Recently Modified screens the Home panels link out to.
- Keep every write path for the two new tables inside `services/`, never `controllers/` — per the standing layering rule, and per the proposal's explicit instruction ("write it from the services... so every module feeds it the same way").

**Non-Goals:**
- No user↔organization membership model, no per-organization referral routing, no role/permission expansion beyond the existing `ce:manage-rules` primitive.
- No changes to how `Case`, `Referral`, `Task`, or `Assessment` themselves are created, scored, or transitioned — this change only observes those transitions.
- No real appointment/scheduling system — "appointments" stays a read over `Case.followUpMilestone`/`followUpDueDate`, per the proposal.
- No dedicated Referral detail page/route — the Referrals module itself is still a future phase (`navConfig.ts`'s `referrals` entry stays `implemented: false`). Anything that needs to "open a referral" opens the owning case instead (Decision 5).

## Decisions

### Decision 1 — `record_activity` is an append-only log; reads deduplicate to one row per record

`record_activity(id, user_id, record_type, record_id, action, at)` gets one new row every time a service's own read-detail or write path runs — never an upsert. This keeps every service's instrumentation identical (`recordActivity(userId, 'case', caseId, 'viewed')`) and keeps `referral_status_events` and `record_activity` the same shape of thing: an event log, not a snapshot.

The **read** side (Home's "5 most recent" and the Recently Modified page) is where "adds it to Recently Accessed exactly once, at the top" (per the proposal's required scenario) is enforced: both queries group by `(record_type, record_id)`, keep only the row with the latest `at`, and order by that timestamp descending. Viewing a case three times and then editing it produces three rows in the table but one entry in the feed, at the top, with `action: 'modified'`.

Written by a new `models/recordActivity.model.ts` (`insertRecordActivity`, `findRecentActivityForUser`) plus a thin `services/recordActivity.service.ts` wrapper (`recordActivity(userId, recordType, recordId, action)`) that every domain service imports — `client.service.ts`, `case.service.ts`, `referral.service.ts`, `assessment.service.ts` each call it from their existing detail-read and create/update functions. This is a fire-and-forget call (`void recordActivity(...)`, errors logged not thrown) so a logging failure never breaks the underlying client/case/referral/assessment operation.

**Scope = the acting user**, not "their caseload": `record_activity.user_id` is the person who viewed or modified the record, and both `recentlyAccessed` (Home) and `GET /api/recent-activity` filter `WHERE user_id = requestingUserId`. This directly matches the column the proposal specifies (`user_id`, not e.g. `assigned_case_manager_id`) and is what makes "exactly once, at the top" well-defined per viewer.

**Alternative considered**: an upsert keyed on `(user_id, record_type, record_id)` that bumps `at` in place. Rejected — it would mean *deleting* history to answer "recently modified," and it complicates `action` (a row already `modified` shouldn't silently revert to `viewed` on a later read). An append-only log with a deduplicating read is one extra `GROUP BY`, not a second write path.

### Decision 2 — `referral_status_events`: creation is itself a status transition, and that's how "sent by" is derived

Every referral write path that changes `status` — `createInternalReferral`, `createExternalReferral`, `updateReferral` (when `status` is included), `acceptReferral`, `declineReferral`, and `coordinatedEntry.service.ts`'s referral creation — writes one `referral_status_events` row: `{ referralId, fromStatus, toStatus, changedBy: requestingUserId, changedAt: now() }`. **Creation writes a row too**, with `fromStatus: null` and `toStatus` = the referral's initial status (`pending`/`new`). This is what lets `GET /api/notifications` answer "referrals the user sent" without a new column on `Referral`: a referral's sender is the `changedBy` of its earliest `referral_status_events` row (`ORDER BY changed_at ASC LIMIT 1`).

`statusUpdates` in the notifications payload = status events where `seen_by_referrer_at IS NULL`, `changed_by != requestingUserId` (you don't need to be notified of your own action), and the referral's earliest event's `changed_by = requestingUserId` (you're the one who sent it). `POST /api/notifications/status-updates/seen` sets `seen_by_referrer_at = now()` on exactly that set for the requesting user.

**Alternative considered**: add `Referral.createdById`. Rejected — it's a new column on an existing table the proposal doesn't list, where the append-only event log already carries the same information as its first row; deriving it keeps the change to "two new tables, nothing else."

### Decision 3 — `pendingReferrals` scoping, given no user↔organization model

Per the Context section's gap #1, "referrals routed to the user's organization or programs" can't be resolved against an actual membership table. This change scopes `pendingReferrals` as: `Referral` rows with `status = 'new'` (Coordinated Entry's referral-creation status — see `referral.model.ts`'s existing `countOpenReferrals` open-status vocabulary) where either `caseId IS NULL` (not yet claimed onto any case manager's case) or `case.assignedCaseManagerId = requestingUserId`. In this single-organization app that is every case manager's own unclaimed or self-assigned inbound referral queue — functionally equivalent to "routed to me" until a real org-membership model exists. This is a documented, provisional scoping decision in the same spirit as `home-dashboard`'s own `DataQualityIssue` provisional model — flagged here rather than silently narrowed, and the natural place to revisit once a `case-management`-side organization-membership change lands.

### Decision 4 — `NewReferralModal` gains an optional `caseId`, reused as-is by Home's Quick Action

`Referral.caseId` is already nullable and `referral.service.ts`'s `createInternalReferral` already accepts `caseId: undefined`; `case.model.ts`'s `attachOrphanReferralsToCase` already exists specifically to backfill a case-less referral once a case opens for that client (the same mechanism Coordinated Entry's referral flow relies on). The only thing stopping reuse is the modal's own prop type (`caseId: string`, required) and its post-save `dispatch(fetchCaseReferrals(caseId))` call. This change widens the prop to `caseId?: string`, skips the case-scoped refetch when absent, and Home's "New Referral" quick action opens this modal directly instead of navigating to `/coordinated-entry` (which remains the CE-specific vulnerability-assessment-driven referral path, unchanged). No backend change needed for this decision — the API already supports it.

**Alternative considered**: keep Home's "New Referral" as a navigate-to-`/coordinated-entry` shortcut (`home-dashboard` design.md's original Decision 4). Superseded here because the proposal explicitly calls for "the shared New Referral modal from 4b," and the underlying data model already supports a case-less referral.

### Decision 5 — deep-linking into a case's tab

Search results, notification clicks, and Today's Appointments rows all need to open a specific case, sometimes on a specific tab (a referral notification should land on Referrals, not Overview). `CaseDetailPage.tsx` currently owns `activeTab` as local `useState('overview')`, with no URL or navigation-state input. This change adds an optional initial tab: `useLocation().state?.initialTab`, read once on mount, falling back to `'overview'` — no route path change (`/cases/:id` stays as-is), no new URL query-string contract to keep in sync with the tab strip. Every new link that needs a specific tab (`navigate(`/cases/${id}`, { state: { initialTab: 'referrals' } })`) sets it via router state; a plain link to `/cases/:id` behaves exactly as before.

A referral with `caseId: null` (Coordinated-Entry-originated, not yet attached to any case) has nowhere to open — search results and notifications for such a referral render as non-navigable (or, for the notifications panel, are simply excluded from `pendingReferrals`/`statusUpdates`, since neither scenario needs a null-case referral to be actionable there — `pendingReferrals` explicitly includes `caseId IS NULL` rows per Decision 3, but clicking one just marks it read; it does not attempt navigation).

### Decision 6 — rename `recentlyAssessed` to `recentlyAccessed` in `HomeDashboardResponse`

`home-dashboard`'s placeholder field was named `recentlyAssessed` (`always []`) — a guess at what a future assessment-focused panel might hold. The actual requirement (design reference + this proposal) is a generic "Recently Accessed" panel over `record_activity` covering clients, cases, referrals, *and* assessments, with a type icon per row. Keeping the old name would misdescribe the data. Since `HomeDashboardResponse` is already taking a breaking change this phase (the fixed-`[]` types are widening to real arrays regardless), this rename rides along in the same breaking change rather than shipping a second one later. `packages/types/src/dashboard.ts` renames the field and its item type (`HomeRecentActivityItem` replaces the unused literal `[]` type); nothing else referenced the old name outside `dashboard.service.ts`/`HomePage.tsx`, both touched by this change anyway.

### Decision 7 — `GET /api/search` reuses each module's existing masked/scoped read pattern per group, not one generic query

Each of the five groups queries through (or mirrors) the same model function its own screen already uses, so global search can never leak something its owning screen wouldn't show:
- **Clients** — `firstName`/`lastName` `contains` match only (never `ssn`/`ssnHash`/`ssnEncrypted` — enforced by simply never referencing those columns in the query, the same way `GET /api/clients/search` already omits them), reusing that endpoint's masked-SSN response convention (search results carry no SSN field at all, not even masked, since the result is `{type, id, title, subtitle, icon}` — `subtitle` is DOB or a program name, never SSN in any form).
- **Cases** — `caseNumber`/`subject`/client-name `contains`, same predicate `case.model.ts`'s `findCases` search branch already uses.
- **Referrals** — `title`/client-name `contains`.
- **Tasks** — `subject` `contains`.
- **Assessments** — client-name `contains` (an assessment has no free-text title of its own; `title` in the result is synthesized as `"<Type> Assessment — <Client Name>"`).

Each group runs `take: 5`, `orderBy` most-recently-updated, behind `requireAuth`; `q.length < 2` short-circuits to `AppError(400, ...)` before any query runs (belt-and-suspenders — the frontend's debounce is the primary guard per the proposal's "makes no request" scenario, but the endpoint doesn't trust that alone). "Only records the user can see" resolves to: everything, since this app has no row-level visibility restriction anywhere else either (Cases' own list shows every case org-wide unless the case manager explicitly picks the `myCaseload` filter) — the one hard restriction that *does* apply everywhere, SSN masking, is preserved by construction (never selected).

### Decision 8 — Calendar/Appointments has no new table

An "appointment" is `{ caseId, caseNumber, clientName, milestone, dueDate }` read directly from `Case` rows where `followUpDueDate` falls in the requested range and `followUpMilestone != 'none'`. `GET /api/appointments?from=&to=` and the Home dashboard's `todaysAppointments` (scoped to `Case.assignedCaseManagerId = requestingUserId`, per the proposal's "cases I manage") both call the same new `case.model.ts` function, `findFollowUpsInRange(from, to, assignedCaseManagerId?)` — Home passes the requesting user's id (personal scope, matching every other personal Home tile); the Calendar page passes none (the case manager needs to see the full month's follow-ups across their organization to plan around, mirroring `case-management`'s own list screen being org-wide by default).

## Risks / Trade-offs

- **[Risk] `record_activity` grows unbounded** — every detail-page view inserts a row, with no retention/archival policy. → **Mitigation**: acceptable at this app's demo/pilot scale (single seeded user, no production traffic yet); flagged here as a known follow-up rather than solved now, consistent with this codebase's existing pattern of documenting deliberately-deferred concerns (e.g. `DataQualityIssue`'s provisional status).
- **[Risk] Decision 3's referral-routing scoping is a stand-in, not a real permission boundary** — once a second case manager with a genuinely different organization exists, "unclaimed or self-assigned" will not match real routing intent. → **Mitigation**: documented explicitly as provisional (same treatment `ce:manage-rules` and `DataQualityIssue` got); the fix is a future organization-membership change, out of scope here.
- **[Risk] Fire-and-forget `recordActivity` calls could silently stop working (e.g. a swallowed exception) without any test noticing.** → **Mitigation**: cover it with an explicit integration test per touched service (view/edit → row appears) as part of this change's task list, not just an end-to-end manual pass.
- **[Trade-off] `CaseDetailPage`'s initial-tab mechanism uses router `state`, which is lost on a hard page refresh.** A refreshed case-detail deep link falls back to Overview instead of staying on the linked tab. → Accepted: consistent with this app not using query-string-driven tab state anywhere yet, and the alternative (a `?tab=` contract) is a larger, unrequested change to `CaseDetailPage`'s existing URL shape.

## Migration Plan

1. Prisma migration adding `record_activity` and `referral_status_events` only (both purely additive; `Referral`, `Case`, `Task`, `Assessment`, `Client` schemas are unchanged) — run via the existing `prisma migrate dev` flow, no data backfill needed since both tables start empty.
2. Ship backend additions (models/services/controllers/routes for search, notifications, tasks, appointments, recent-activity; the four services' `recordActivity` instrumentation; `dashboard.service.ts` extension) behind the existing `requireAuth` middleware — no feature flag, consistent with how every prior phase in this app has shipped.
3. Ship frontend additions (new pages/slices, `TopBar.tsx` rewrite, `HomePage.tsx` rewire, `NewReferralModal`/`CaseDetailPage` prop extensions) in the same change, since `HomeDashboardResponse`'s shape change is breaking and both sides must land together.
4. Rollback: both new tables can be dropped without touching any other table; the frontend/backend pieces are additive routes/components with no destructive migration to existing behavior, so reverting the commit(s) is sufficient — no special rollback sequencing required.

## Open Questions

- Should `record_activity` eventually gain a retention policy (e.g. keep only the last N per user, or last N days)? Not addressed here — flagged as a follow-up once real usage volume exists.
- If a genuine multi-organization case-manager model lands later, Decision 3's referral-routing scoping should be revisited — it's a placeholder, not a permanent design.
