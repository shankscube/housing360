## Why

Housing360 has no case-management screen today: `Case` exists only as a minimal row (`clientId` + `programEnrollmentId` + `status`) created behind the scenes by the intake wizard's `cases/ensure` call, with no UI a case manager can open to see or work a caseload. This change adds the Case Operations Center list and a case detail record so case managers have a real, navigable home for the cases the intake flow already creates — the next screen in the nav rail's progression after My Clients.

## What Changes

- Extend the existing `Case` model (do not replace it) with case-manager-facing fields: a generated unique case number, subject, priority, last-contact date, and an assigned case manager reference. `clientId`, `programEnrollmentId`, and `status` are unchanged; `cases/ensure`'s idempotency contract (`@@unique([clientId, programEnrollmentId])`) is untouched.
- Add foreign-key attachment points (`caseId`) for the 6 not-yet-built detail tabs (Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness) so future changes have somewhere to attach real data without another migration to the `Case` row itself. This change does not populate them with real records except HUD Data's read-only checklist (derived, not stored per-case).
- Add `GET /api/cases` (paginated, filtered list), `GET /api/cases/:id` (detail, including per-tab "has real content" flags), `POST /api/cases`, `PATCH /api/cases/:id`, and `GET /api/cases/:id/hud-data`.
- Add the Case Operations Center page: KPI row (Active Cases, High Risk, Due Today, Closed Cases), a filter chip row (All Cases / My Caseload / High Risk / Due Today / Overdue / Recently Updated), and a `DataTable` of cases.
- Add the case detail page: a 7-tab layout (Overview, Plan, Services, Assessments, Referrals, HUD Data, Health and Wellness). Overview renders real fields; the other 6 render a clearly labeled "not yet built" empty state.
- Add a shared `Tabs` component to `apps/web/src/components/ui/` (none exists yet) for the 7-tab layout, reusable by future tabbed screens (e.g. Assessments).
- Add a `cases` Redux slice (`list`, `detail`) mirroring the `clients` slice's shape.
- HUD Data tab: a checklist of HUD-required data points per case (pass/fail), with a show/hide-satisfied toggle, and a slot for a fixed disclosure line sourced from one config constant. The exact wording of that disclosure line is an explicit open item for this change (see design.md) — a compliance decision, not an engineering one.

## Capabilities

### New Capabilities
- `case-management`: the Case Operations Center list, the case detail record and its 7-tab layout, the HUD Data readiness checklist, and the API endpoints backing them.

### Modified Capabilities
- `shared-ui`: adds the `Tabs` component requirement (new shared component, same pattern as `Button`/`DataTable`/`KpiTile` already documented there). No existing `shared-ui` requirement changes behavior.

(The `Case` model gains fields but no existing requirement in `client-intake` or `client-management` changes behavior; `cases/ensure`'s one-case-per-client-and-enrollment guarantee is preserved unchanged, so neither of those specs needs a delta.)

## Impact

- **Database**: `apps/api/prisma/schema.prisma` — new columns on `Case` (`caseNumber`, `subject`, `priority`, `lastContactDate`, `assignedCaseManagerId`) plus a migration; no changes to existing `Case` columns or its unique constraint.
- **API**: new `src/routes/case.routes.ts` (or extension of an existing cases router if one already exists for `cases/ensure`), `src/controllers/case.controller.ts`, `src/services/case.service.ts`, and `src/constants/hudDataChecklist.ts` (or similar) for the HUD Data tab's checklist definitions and the disclosure-line config value.
- **Frontend**: new `src/routes/pages/CasesPage.tsx` (replacing the current stub) and `src/routes/pages/CaseDetailPage.tsx`, a new route for case detail, a new `src/components/ui/Tabs/` component, a new `src/store/slices/casesSlice.ts`, and `src/features/cases/` for tab-panel components if they outgrow a single file.
- **Nav/routing**: `AppRoutes.tsx` gains a case-detail route; `DataTable`'s row click (or a dedicated action) needs a way to navigate there, which My Clients does not currently have a precedent for (its own `onViewClient` is a documented stand-in with no real destination) — this change is the first to actually wire a detail route.
