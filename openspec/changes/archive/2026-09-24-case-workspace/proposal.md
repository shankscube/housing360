## Why

`cases-screen` gave the Cases module a real list, KPI row, and a 7-tab detail shell, but 6 of those tabs are still labeled "not yet built" placeholders, there is no way to create a case from the UI, and the detail header has no Edit. Case managers cannot actually run a case — no interaction-summary follow-up, no care plan, no service/benefit tracking, no bed assignment, no referral workflow, no release-of-information consent, and no clinical read model — so the module is browsable but not usable. This change completes it end to end, tab by tab, on top of the data `client-intake`/`case-management` already created.

## What Changes

- Add a "New Case" modal to the Case Operations Center (Subject required, Description, Client search, Case Manager, Referral, Opened Date, Status, Priority, Origin, Escalated, Contact) and wire the Active Cases KPI tile's month-over-month trend line.
- **BREAKING**: `POST /api/cases` now rejects a request with no `subject` (previously optional/nullable); the case-create contract requires it.
- Extend `Case` in place with `caseNumber`(already present)/`description`/`stage`/`origin`/`escalated`/`contact`/`referralId`/`openedDate`/`closedAt`/`nextHmisReviewDue`/`hmisDataQualityStatus`/`followUpMilestone`/`followUpDueDate`. `status`/`priority`/`assignedCaseManagerId`/`programEnrollmentId` are unchanged from `case-management`.
- Add a full case detail header (title, case number, client link, status/referral/priority/stage/origin) and an Edit form (Subject, Status, Priority, Stage, Origin, HMIS Data Quality Status, Next HMIS Review Due, Case Manager, Description). Back preserves list filters.
- Replace the Overview tab's minimal read-only panel with Interaction Summaries (list/search/new/edit/detail, "Don't forget!" nudge), a Follow-Up Reminder control, a Tasks card, and System Information — backed by a new shared `tasks` table.
- Build the Plan tab: care plan list with expandable goals/tasks, a 3-step Care Plan wizard (from scratch or from a template), service-gap detection, and a Refer to Partner Agency flow gated on Release of Information consent.
- Build the Services tab: program-enrollment-scoped benefit assignment, service disbursements, bed assignment, and a per-bed-assignment daily log (present/absent night tracking).
- Build the Assessments tab's enrollment picker and assessment list (Resume Draft/Discard on drafts, a Recommended Care Plans strip) — the assessment form/scoring itself stays a documented placeholder route, deferred to a later phase.
- Build the Referrals tab: list, New Referral, Edit, Accept, Decline-with-reason — reusing the same `Referral` entity the Plan tab's partner-referral flow writes to.
- Finish the HUD Data tab's remaining states ("All clear", empty-filter message, no-rules state) — the checklist mechanism itself (`case-management`) is unchanged.
- Build the Health & Wellness tab: Clinical Summary, ROI status with a "Create Release of Information" action, and Recent Visits, sourced through a no-op `EhrAdapter` interface (no vendor named in UI copy).
- Add a shared Release of Information form component (signature pads, 42 CFR Part 2 notice, config-driven legal text) used by both the Plan tab's partner-referral flow and the Health & Wellness tab.
- Add `apps/web/src/store/slices/carePlansSlice.ts`, `servicesSlice.ts`, `referralsSlice.ts`, and a `caseDetail` sub-state on the existing `cases` slice.

## Capabilities

### New Capabilities
- `care-planning`: care plan templates, care plans, goals and goal tasks, the Care Plan wizard's validation rules, service-gap detection against in-house benefits, and the refer-to-partner-agency flow (partner agency selection, ROI-gated referral, initials-only fallback without consent).
- `case-services`: program-enrollment service assignment against configured benefits, service disbursements (vouchers, bed-identifier/shift fields), and the minimal bed model (beds, bed assignments, nightly present/absent logging) that a future Shelter Management module will extend.
- `release-of-information`: the ROI record (recipient, info types released, signatures, expiry, revocation), the "active consent" rule (unrevoked and unexpired), and the shared ROI form component's behavior.

### Modified Capabilities
- `case-management`: New Case creation gains required-subject validation, a case manager/referral/opened-date/escalated/contact field set, and a case-edit endpoint; the case detail response's `tabsWithContent` flags become real for Plan/Services/Referrals/Health and Wellness (previously always `false`); the case detail header, Edit form, and the Overview/Assessments/HUD Data/Referrals/Health and Wellness tab panels gain real content; a new shared `Task` entity backs the Overview tab's Tasks card and every care-plan-goal task; `InteractionSummary` gains `interactionPurpose`/`confidentialityType`/`partnerAccount`/`offering`/a polymorphic `relatedRecord`, and creating one can optionally create a linked `Task` in the same request; a `Referral`/`Organization` (partner agency) pair of entities is introduced for the Referrals tab and the Plan tab's partner-referral flow.

## Impact

- **Schema** (`apps/api/prisma/schema.prisma`): extends `Case` and `InteractionSummary` in place; adds `Task`, `CarePlanTemplate` (+ template goal/task rows), `CarePlan`, `GoalDefinition`, `GoalAssignment`, `Benefit`, `BenefitAssignment`, `ServiceDisbursement`, `Bed`, `BedAssignment`, `BedNight`, `Referral`, `Organization`, `OrganizationServiceDomain`, `ReleaseOfInformation`, `ClinicalSummary`, `ClinicalEncounter`. New migration(s); no existing table is recreated or dropped.
- **API**: new routers `task.routes.ts`, `carePlan.routes.ts`, `service.routes.ts`, `bed.routes.ts`, `referral.routes.ts`, `releaseOfInformation.routes.ts`, `healthWellness.routes.ts` (or additions to `health.routes.ts`), all mounted at `/api`, behind `requireAuth`, through the existing `models/ → services/ → controllers/ → routes/` layering and `sendSuccess`/`sendError` responder convention. `case.routes.ts`/`case.service.ts`/`case.controller.ts`/`case.model.ts` are extended, not replaced.
- **Frontend**: new `apps/web/src/features/cases/` panels (`PlanPanel`, `ServicesPanel`, `ReferralsPanel`, `HealthWellnessPanel` replace `NotYetBuiltPanel` usage for those 4 tabs) and modals/wizards under `apps/web/src/features/cases/{carePlan,services,referrals,roi}/`; new shared components in `apps/web/src/components/ui/` (a `Modal`/dialog primitive if one doesn't already exist, a `SignaturePad`, an `Accordion`/expandable-row pattern for care plans and enrollments — exact list finalized in design.md) per the standing rule that all UI lives in `apps/web`, never a `packages/*` workspace. New Redux slices `carePlansSlice`, `servicesSlice`, `referralsSlice`; `casesSlice` gains `caseDetail`.
- **Config**: `apps/api/src/constants/` gains the ROI legal-text config file and any new HUD-adjacent constant maps this change needs (e.g. task subtypes, if HUD-coded).
- **Dependencies**: no new external package is required for the signature pad (implemented as a canvas-based component) unless design.md finds a compelling reason otherwise.
