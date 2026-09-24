## Context

Two screens are still stubs: `AssessmentsPage` and `CoordinatedEntryPage` (`apps/web/src/routes/pages/`), each just rendering `ContentAreaTemplate` with placeholder copy. Their Redux slices (`assessmentsSlice.ts`, `coordinatedEntrySlice.ts`) are scaffold leftovers from `project-setup` that call endpoints/shapes that don't match anything real (`GET /assessments` returning the full HUD-content `Assessment[]`, `GET /coordinated-entry` which was never routed at all).

Two prior changes already shaped adjacent ground that this design has to reconcile rather than duplicate:

- **`client-intake-wizard`** introduced the `Assessment` Prisma model: one row per `(programEnrollmentId, dataCollectionStage)`, holding the full HUD Entry-assessment content (living situation / income-benefits-insurance / health-DV — ~70 columns). Its own spec requirement (`client-intake`, "Health & DV Step Completes One Entry Assessment Record") guarantees **exactly one** such row per enrollment at `dataCollectionStage = 1`, enforced by upserting on that compound unique key (`assessment.model.ts`'s `upsertAssessment`). This phase only ever writes stage 1.
- **`case-workspace`** added the Assessments tab (`AssessmentsPanel.tsx`) reading that same table via `AssessmentListItem` (`id, programEnrollmentId, dataCollectionStage, assessmentDate, status, score`), with `score` **hardcoded to `null`** and a code comment: "a placeholder... since no scoring engine exists yet." `case-management`'s spec already documents the requirement "list its assessments with stage, date, status, and score" — written anticipating this change.
- **`case-workspace`** also introduced `Organization`/`OrganizationServiceDomain` (partner agencies, already queryable via `GET /api/partner-agencies?domain=`) and the shared `Referral` table (client/case/program/providerOrg/referrerOrg, `isExternal` flag, nullable `caseId`) used by both the Referrals tab and the Plan tab's Refer-to-Partner flow.

This change's job is to (a) turn that `score` placeholder into a real (if provisional) number, (b) add the missing scheduling/tracking metadata (`type`, `dueDate`) so assessments can be browsed and triaged globally instead of only per-enrollment, and (c) build Coordinated Entry — a screening/triage flow that runs *before* a client necessarily has a case or enrollment — on top of the existing `Organization`/`Referral` machinery rather than beside it.

## Goals / Non-Goals

**Goals:**
- One `ScoringService` interface, with an explicitly provisional implementation, that both the Assessment Command Center and Coordinated Entry call for their numbers — no scoring logic duplicated or inlined in a controller.
- Extend the existing `Assessment` model rather than introduce a second, name-colliding one; prove the extension preserves `client-intake`'s existing guarantees byte-for-byte.
- A real Coordinated Entry data trail: a persisted `VulnerabilityAssessment` per screening, a Prioritization List that reads real rows (not a mock), and a referral hand-off that lands in the same `Referral` table the Referrals tab already reads.
- Ship both screens as fully wired, filterable, real-data pages replacing the two stubs.

**Non-Goals:**
- The real HUD housing-stability scoring algorithm and the real VI-SPDAT-style vulnerability instrument — both explicitly deferred to their own future design passes. `ScoringService`'s current bodies are throwaway placeholders, not tuned models.
- Annual/Exit assessment *content* forms (the wizard-style multi-section forms `Step4`-`Step6` use for Entry). This phase tracks annual/exit assessments as schedulable events with a due date/status/score — it does not build their data-collection UI. A "New Assessment" action in the Command Center creates a bare tracking row; filling in its HUD content is future work.
- A Referrals list/detail UI for the coordinated-entry hand-off — the existing Referrals tab (`case-workspace`) already reads the `Referral` table this change writes to; nothing new is built there.
- Any change to `case-workspace`'s `AssessmentsPanel.tsx` UI. It keeps reading `AssessmentListItem` exactly as before; it simply stops seeing a hardcoded `null` for `score` once real Entry assessments get scored. No requirement wording changes, so no spec delta against `case-management`.
- Coordinated-entry program *matching* logic beyond a simple tier→program-names lookup table (no eligibility rules engine).

## Decisions

### Decision 1 — Extend `Assessment` in place; do not create a second "Assessment" model or route family

The prompt asks for `GET/POST/PATCH /api/assessments` backing an entity with `type`/HUD stage/status/due date/score. The repo already has an `Assessment` model and `POST /api/assessments` / `PATCH /api/assessments/:id` / `DELETE /api/assessments/:id` routes (client-intake-wizard) — a literal, unavoidable path collision if a second model were introduced under the same name/routes (the exact failure mode `case-workspace`'s design.md already flagged once for `health.service.ts` vs `healthWellness.service.ts`).

Rather than rename around the collision, this design leans into it: the "Assessment Command Center" and the intake wizard's Entry Assessment are the *same underlying record* at different points in its lifecycle — a scheduled/tracked assessment event that, for the Entry type, happens to carry ~70 HUD content columns. Concretely:

- Add columns: `type` (`entry | annual | exit`, plain `String` — HUD-coded-scalar convention, kept for readability alongside the existing numeric `dataCollectionStage`), `dueDate` (`DateTime?`), `score` (`Int?`), `scoreLabel` (`String?`), `cycleNumber` (`Int @default(1)`).
- Change the compound unique key from `(programEnrollmentId, dataCollectionStage)` to `(programEnrollmentId, dataCollectionStage, cycleNumber)`. Every existing call site (`upsertAssessment`, intake wizard steps 4–6) never passes `cycleNumber`, so it defaults to `1` and the upsert resolves to the exact same row it always has — **the Entry-assessment "exactly one record" guarantee is unchanged**, just now expressed as "exactly one record per `(enrollment, stage 1, cycle 1)`," which is what already happens today. Annual/exit assessments recur across years by incrementing `cycleNumber` when the Command Center schedules the next cycle — this is the only reason the key needs the third column.
- `type` and `dataCollectionStage` are set together by a small helper (`entry` ↔ `1`, `annual` ↔ `2`, `exit` ↔ `3`) rather than independently, so they can never drift out of sync. `dataCollectionStage`'s exact numbers are a simplification, not the literal HUD 3.917 data-collection-stage codes — flagged as an open question below since nothing downstream reads those raw codes today.
- New routes added to the *same* `assessment.routes.ts`/router: `GET /api/assessments` (paginated list, global — filters below) and `GET /api/assessments/:id` (detail). Both are genuinely new paths (no existing handler), so there's no collision to resolve for them. The existing `POST`/`PATCH`/`DELETE` handlers are extended (not replaced) to accept the new optional fields.
- `score`/`scoreLabel` are never accepted as request-body input on create/patch — they're written server-side only, by calling `ScoringService.scoreAssessment(...)` whenever an assessment's status transitions to `completed` (checked in `assessment.service.ts`, not the controller).

**Alternative considered**: a parallel `AssessmentRecord`/`AssessmentTracker` model with its own `/api/assessment-records` routes, leaving `Assessment` untouched. Rejected — it would leave two "assessment" concepts in the domain long-term (one becomes stale the moment `case-workspace`'s `AssessmentsPanel` shows a real score from *this* change's data but a global tracker shows a different row for the same enrollment), and it does nothing to resolve the fact that `AssessmentListItem`'s `score` placeholder was explicitly written to be filled in by exactly this kind of follow-up change.

### Decision 2 — `ScoringService` interface and placeholder bodies

```ts
// apps/api/src/services/scoring.service.ts
export interface AssessmentScoringInput {
  type: 'entry' | 'annual' | 'exit';
  livingSituation?: { chronicHomelessness?: string | null; monthsHomelessPast3Years?: string | null; /* … */ };
  incomeFromAnySource?: string | null;
  disabilityCount?: number;
  domesticViolenceSurvivor?: string | null;
}
export interface AssessmentScoreResult { score: number; label: string }

export interface VulnerabilityScoringInput {
  chronicHomelessness?: boolean;
  monthsHomelessPast3Years?: number | null;
  disablingCondition?: boolean;
  domesticViolenceSurvivor?: boolean;
  veteranStatus?: boolean;
  unaccompaniedYouth?: boolean;
}
export interface VulnerabilityScoreResult { score: number; priorityTier: 'high' | 'medium' | 'low' }

export interface ScoringService {
  scoreAssessment(input: AssessmentScoringInput): AssessmentScoreResult;
  scoreVulnerability(input: VulnerabilityScoringInput): VulnerabilityScoreResult;
}
```

The exported `scoringService` singleton implements both methods with a **provisional, clearly-commented placeholder**: a small fixed-weight tally over whichever risk factors are present (chronic homelessness, months homeless, disabling condition, DV, income absence) mapped to a 0–100 `score` and a banded `label`/`priorityTier` (`≥67 → high/"At Risk"`, `34–66 → medium/"Needs Support"`, `<34 → low/"Strong"` — exact bands are a placeholder, not a clinical cutoff). Every export and the file's own header comment says "PROVISIONAL — replace when the real HUD/VI-SPDAT scoring design lands" so it can't be mistaken for a tuned model later.

**Alternative considered**: return a random or constant score. Rejected — the prompt asks for numbers that respond to real input so the UI's "prominent score display" and Prioritization List sort/rank aren't visibly fake; a deterministic weighted tally is cheap and still honestly a placeholder.

### Decision 3 — Coordinated Entry gets its own `VulnerabilityAssessment` model, not a reuse of `Assessment`

Unlike the Assessment Command Center, coordinated-entry screening is a different shape of data entirely (a short VI-SPDAT-style question set, not the HUD Entry-assessment content form) and, critically, **can run before a client has any `ProgramEnrollment`** — `Assessment.programEnrollmentId` is a required FK, so it structurally cannot host a pre-enrollment screening. New model:

```prisma
model VulnerabilityAssessment {
  id            String   @id @default(uuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  answers       Json     // placeholder VI-SPDAT-style intake input (design.md Decision 2's VulnerabilityScoringInput shape)
  score         Int
  priorityTier  String   // 'high' | 'medium' | 'low' — HUD-coded-scalar convention
  safetyAlert   Boolean  @default(false)
  assessedById  Int
  assessedBy    User     @relation(fields: [assessedById], references: [id])
  referralId    String?  @unique
  referral      Referral? @relation(fields: [referralId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clientId])
}
```

`safetyAlert` is captured directly on the screening (a placeholder screening question, since the real instrument isn't designed yet) rather than inferred from the intake wizard's `Assessment.domesticViolenceSurvivor`/`dvCurrentlyFleeing` fields — coordinated entry must work for people who haven't been through full intake yet, so it can't depend on that table having a row.

`referralId` links back to whichever `Referral` step 4 ("Send Referral") creates for this screening, once created — nullable because a screening can exist without ever reaching step 4 (stepper abandoned after step 1–3).

**Alternative considered**: store answers as named columns like `Assessment` does. Rejected for this phase — the real instrument isn't designed yet (explicit non-goal), so a `Json` bag keeps the placeholder from calcifying a schema for questions that will be replaced; `VulnerabilityScoringInput`'s TS shape is still the typed contract everything in this phase reads/writes against.

### Decision 4 — Coordinated Entry's referral hand-off reuses the existing `Referral` table

`POST /api/coordinated-entry/referrals` creates a row in the same `Referral` model the Referrals tab and the Plan tab's Refer-to-Partner flow already use, with `isExternal: true`, `clientId`, `programId` (from the chosen recommended program), `providerOrgId` (from the chosen partner agency), `status: 'new'`, and `caseId: null` (no case exists yet at this point in the flow — `Referral.caseId` is already nullable). This is exactly the "one Referral table serves every hand-off path" pattern `case-workspace`'s design.md already established for the internal/external split; coordinated entry is simply a third path in, distinguished the same way (`isExternal` + which contact fields are populated) rather than a fourth referral concept.

**Alternative considered**: a `status: 'new'` value conflicts with the model's existing `@default("pending")` — not a real conflict since `status` is a free-form String (HUD-coded-scalar convention); `'new'` is simply an additional value this flow writes explicitly, `'pending'` stays the default for rows created without an explicit status elsewhere.

### Decision 5 — Prioritization List quick filters are composable (AND), not mutually exclusive

Top 5 High Priority / Veterans / Unaccompanied Youth / Safety Alerts / Awaiting Referral can all be active at once, ANDed together (same "filter-combines-with-search, never filter-combines-with-filter" contract the rest of the app uses for *single-select* filter rows would suggest exclusivity — but this list explicitly asks for 5 *quick-filter chips*, which the bundle's own vocabulary treats as toggles, not a `FilterChipRow` single-select group). Rationale: "Top 5 High Priority" is a *sort truncation*, not a category — it only makes sense composed with the others (e.g. "Top 5 High Priority" + "Veterans" = the 5 highest-priority veterans), so mutual exclusivity would make that combination inexpressible. Implemented as independent boolean toggles (not `FilterChipRow`, which is single-select-only) rendered as the same chip visual. `GET /api/coordinated-entry/prioritization-list` takes `topFive|veteran|unaccompaniedYouth|safetyAlert|awaitingReferral` as independent boolean query params, applies every active one as an AND, then truncates to 5 last if `topFive` is set (so it composes with the others' filtering rather than short-circuiting it).

Filter definitions, all computed at request time (no stored flags):
- **Veterans**: `Client.veteranStatus === 'yes'`.
- **Unaccompanied Youth**: `Client.dob` (when disclosed) implies age < 25 **and** the client has no `Household` or is the sole member of one — same "computed, not stored" convention as `Case.tabsWithContent`.
- **Safety Alerts**: `VulnerabilityAssessment.safetyAlert === true` for that client's latest screening.
- **Awaiting Referral**: client has a `Referral` with `status` in `('new', 'pending')` and no active `ProgramEnrollment` yet.
- **Top 5 High Priority**: `priorityTier === 'high'`, ordered by `score` descending, limited to 5 — applied last, after the other filters.

### Decision 6 — Coordinated Entry wizard shell follows the `IntakeWizard`/`CarePlanWizard` precedent; `StatusStepper` stays display-only

`StatusStepper` (reserved in Phase 1) only renders reached/unreached nodes for a `currentStageKey` — it has no concept of step content, validation, or navigation (confirmed by reading its source: pure props in, pure render out). The prompt's "4-step linear stepper... reuse or extend the `StatusStepper` interface" is satisfied by using it purely as the visual indicator, exactly as `CaseDetailHeader`/other places already do, while a new `CoordinatedEntryWizard.tsx` shell (mirroring `IntakeWizard.tsx`'s search-phase/step-phase pattern, minus the search phase — coordinated entry always starts from a client already selected via `ClientSearchField`, the same shared component `case-workspace` built) owns the actual step components, current-step state, and per-step `save(): Promise<boolean>` contract via `StepHandle` — the same pattern `IntakeWizard`/`CarePlanWizard` already use, so a third near-identical wizard shell doesn't invent a fourth shape.

**Alternative considered**: extend `StatusStepper` itself to also host step content (render-prop children per stage). Rejected — every other multi-step flow in the app (`IntakeWizard`, `CarePlanWizard`) already separates "visual stepper" from "step content owner," and `StatusStepper` is used in several other display-only contexts (`CaseDetailHeader`'s metadata, referral stage display) that must not gain wizard-shell responsibilities.

### Decision 7 — Recommended Programs is a static tier→program-name lookup, not a scoring model

`GET /api/coordinated-entry/recommended-programs?priorityTier=high` returns the seeded `Program` rows (there are only 5, not user-creatable) ranked by a fixed config table in `constants/coordinatedEntryOptions.ts` (same "served from one config, never hardcoded on the frontend" convention as `hudOptions.ts`/`caseWorkspaceOptions.ts`), e.g. `high → [Permanent Supportive Housing, Rapid Re-Housing, Emergency Shelter, …]`. `Program` has no `type`/category column to match against — adding one is out of scope (no consumer needs it yet beyond this static list) and would require a migration+seed change for a mapping that's already explicitly a placeholder pending the real scoring design.

### Decision 8 (found during apply) — Orphan referrals attach to a case the moment one opens

Decision 4 creates a coordinated-entry referral with `caseId: null` since no case exists yet. Live end-to-end testing during apply (`POST` the referral, then `POST /api/cases/ensure` for that same client, then `GET /api/cases/:id/referrals`) showed the referral never surfaced anywhere afterward — nothing previously set `Referral.caseId` after the fact, which contradicts the `coordinated-entry` spec's own "visible to existing referral listings" requirement and the proposal's claim that the future Referrals module will read it. Fixed with a small, targeted addition: `referral.model.ts`'s `attachOrphanReferralsToCase(clientId, caseId)` (`UPDATE Referral SET caseId = ? WHERE clientId = ? AND caseId IS NULL`), called from `case.service.ts`'s `ensureCase` and `createCase` — the two places a case comes into existence for a client. Verified live: a referral created pre-case shows `caseId: null` immediately, then the correct `caseId` once a case is opened for that client.

## Risks / Trade-offs

- **[Risk]** Changing `Assessment`'s unique constraint touches a table three prior changes depend on. → **Mitigation**: the new key is a strict superset (`cycleNumber` defaults to `1` everywhere existing code touches it); tasks.md includes an explicit regression check that re-runs the intake wizard's steps 4–6 twice against the same enrollment and confirms exactly one row still results, plus running the full existing test suite for `client-intake`/`case-management` before merging.
- **[Risk]** `dataCollectionStage` numbers (1/2/3 for entry/annual/exit) are a simplification of the real HUD 3.917 codes (which are 1/2/5/3, with "Update" as a distinct code from "Annual"). → **Mitigation**: flagged as an Open Question below; nothing outside this change reads the raw numeric code today, so the simplification is contained and correctable later without another migration if it's just the mapping helper that changes.
- **[Risk]** The placeholder `ScoringService` numbers could be mistaken for real HUD/VI-SPDAT output by a caseworker. → **Mitigation**: `scoreLabel`/`priorityTier` values and the Assessment/Coordinated-Entry detail UI both render a small "provisional scoring" note (same treatment `HUD_WORKSPACE_DISCLOSURE_TEXT` already uses for placeholder disclosure copy); the service file's own header comment and this design doc both say PROVISIONAL in caps.
- **[Trade-off]** Annual/Exit assessments only get a bare tracking row in this phase, not a content form — the Command Center can show "Annual assessment due 3/1" but not let anyone fill it out yet. Accepted as an explicit Non-Goal; the due-date/status/score seam is what the follow-up content-form change will plug into.

## Migration Plan

1. Prisma migration: add `type`/`dueDate`/`score`/`scoreLabel`/`cycleNumber` to `Assessment` (all nullable or defaulted — no backfill needed since existing rows are all Entry/cycle 1); change the unique index; add `VulnerabilityAssessment`. Existing rows get `type = 'entry'` via a migration-time default expression (`dataCollectionStage = 1` already implies entry for every current row).
2. Backend: extend `assessment.model/service/controller.ts` in place per Decision 1; add `scoring.service.ts`; add `coordinatedEntry.model/service/controller/routes.ts`; add `constants/coordinatedEntryOptions.ts`; mount the new router in `routes/index.ts`.
3. Frontend: replace `assessmentsSlice.ts`/`coordinatedEntrySlice.ts` bodies and the `CoordinatedEntryEntry`/stale `Assessment`-list-shaped types; build `AssessmentCommandCenterPage` and `CoordinatedEntryPage` (+ `features/assessments/`, `features/coordinatedEntry/`); wire into the existing stub routes (no route path changes).
4. No rollback complexity beyond a standard down-migration — no data migration touches existing Client/Case/Referral rows, and the Entry-assessment upsert path is provably unchanged (Decision 1).

## Open Questions

- Should `dataCollectionStage`'s numeric mapping (1/2/3) be corrected to HUD's real codes (1/2/5/3) now, or left as this phase's simplification until something actually consumes the raw HUD code? This design assumes the latter (nothing does yet) but flags it for the real-scoring follow-up change to revisit.
- Where should "New Assessment" (scheduling an annual/exit cycle from the Command Center) live — a modal on this new page, or a future addition to the Cases workspace's Assessments tab? This change adds the API and a minimal modal on the Command Center only; case-workspace's own "New" assessment action (currently a toast stub per its design.md) is left as-is.
