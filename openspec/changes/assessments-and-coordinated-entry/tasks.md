## 1. Schema & Migration

- [x] 1.1 Add `type` (`String`), `dueDate` (`DateTime?`), `score` (`Int?`), `scoreLabel` (`String?`), `cycleNumber` (`Int @default(1)`) to `Assessment` in `apps/api/prisma/schema.prisma`.
- [x] 1.2 Change `Assessment`'s compound unique key from `@@unique([programEnrollmentId, dataCollectionStage])` to `@@unique([programEnrollmentId, dataCollectionStage, cycleNumber])`.
- [x] 1.3 Add the new `VulnerabilityAssessment` model (`clientId`, `answers Json`, `score`, `priorityTier`, `safetyAlert`, `assessedById`, `referralId? @unique`, timestamps) per design.md Decision 3.
- [x] 1.4 Run `prisma migrate dev` to generate the migration; confirm existing `Assessment` rows backfill `type = 'entry'`, `cycleNumber = 1`.
- [x] 1.5 Update `assessment.model.ts`'s `upsertAssessment`/`findAssessmentByEnrollmentAndStage` `where` clauses to use the renamed compound key (`programEnrollmentId_dataCollectionStage_cycleNumber`), defaulting `cycleNumber` to `1` at every existing call site so behavior is unchanged.

## 2. Scoring Service

- [x] 2.1 Create `apps/api/src/services/scoring.service.ts` exporting the `ScoringService` interface and a `scoringService` singleton, per design.md Decision 2 — file header comment marked PROVISIONAL.
- [x] 2.2 Implement `scoreAssessment` with a documented placeholder weighted-tally algorithm producing `{ score, label }`.
- [x] 2.3 Implement `scoreVulnerability` with a documented placeholder weighted-tally algorithm producing `{ score, priorityTier }`.
- [x] 2.4 Add a small mapping helper (`entry ↔ 1`, `annual ↔ 2`, `exit ↔ 3`) shared by the model/service layer so `type` and `dataCollectionStage` never drift apart.

## 3. Assessment Command Center — Backend

- [x] 3.1 Add `type`/`dueDate` to `AssessmentInput`/`AssessmentUpdateInput`/`Assessment` in `packages/types/src/assessments.ts`; extend `AssessmentListItem` with `clientName`, `programEnrollmentName`, `type`, `dueDate` (score already present).
- [x] 3.2 Add `AssessmentFilter` (`all|overdue|dueToday|inProgress|completed`), `AssessmentTypeFilter` (`entry|annual|exit|all`), `AssessmentListQuery`, `AssessmentListResult` (items/total/page/pageSize/kpis), `AssessmentKpiCounts` types.
- [x] 3.3 Extend `assessment.model.ts` with a global paginated `findAssessments` query supporting status + type filters (AND'd) and a `countAssessmentKpis` helper (Due Today / In Progress / Completed / Total).
- [x] 3.4 Extend `assessment.service.ts`: `listAssessments(query)` (global list + kpis), `getAssessmentDetail(id)` (includes score/scoreLabel), and update `createOrUpsertAssessment`/`patchAssessment` to accept `type`/`dueDate`, reject client-supplied `score`/`scoreLabel`, and call `scoringService.scoreAssessment` when status transitions to `completed`.
- [x] 3.5 Add `getAssessmentDetailHandler` and `listAssessmentsHandler` to `assessment.controller.ts`.
- [x] 3.6 Add `GET /assessments` and `GET /assessments/:id` to `assessment.routes.ts` (new paths; existing `POST`/`PATCH`/`DELETE` stay mounted as-is).
- [x] 3.7 Verify `GET /enrollments/:id/assessments` / `/assessments/list` (case-workspace's Assessments tab) still returns correctly for an enrollment with an Entry assessment plus a scheduled annual assessment (two rows, no key collision). Verified live: the same enrollment now has both an Entry (cycle 1) and an Annual (cycle 2) row, `/assessments/list` returns both with correct `type`/`score` per row, no unique-key collision.

## 4. Coordinated Entry — Backend

- [x] 4.1 Add `VulnerabilityAssessment`, `RecommendedProgram`, `PartnerAgency`, `CoordinatedEntryReferralInput`, `PrioritizationListItem`, `PrioritizationListQuery` types to `packages/types/src/coordinatedEntry.ts`, replacing the placeholder `CoordinatedEntryEntry` type. (`PartnerAgency`/`Program` reused as-is from `organizations.ts`/`program.ts` rather than redefined.)
- [x] 4.2 Add `constants/coordinatedEntryOptions.ts`: tier → recommended program names mapping, quick-filter definitions — served from one config per repo convention.
- [x] 4.3 Create `coordinatedEntry.model.ts`: `createVulnerabilityAssessment`, `findLatestVulnerabilityAssessmentByClient`, `findPrioritizationList` (join `VulnerabilityAssessment` + `Client` + `Referral`, apply composable quick filters per design.md Decision 5).
- [x] 4.4 Create `coordinatedEntry.service.ts`: `submitVulnerabilityAssessment` (calls `scoringService.scoreVulnerability`, persists), `getRecommendedPrograms(priorityTier)`, `listPartnerAgencies(domain)` (reuses existing `Organization`/`OrganizationServiceDomain` model functions), `createCoordinatedEntryReferral` (writes to the shared `Referral` model per design.md Decision 4, `isExternal: true`, `status: 'new'`, `caseId: null`), `getPrioritizationList(query)`.
- [x] 4.5 Create `coordinatedEntry.controller.ts` + `coordinatedEntry.routes.ts`: `POST /coordinated-entry/vulnerability-assessment`, `GET /coordinated-entry/recommended-programs`, `GET /coordinated-entry/partner-agencies`, `POST /coordinated-entry/referrals`, `GET /coordinated-entry/prioritization-list`.
- [x] 4.6 Mount `coordinatedEntryRouter` at `/api` in `routes/index.ts`.
- [x] 4.7 Verify a coordinated-entry-created referral is returned by the existing `GET /api/cases/:id/referrals` once that client's case is opened (confirms Decision 4's "same Referral table" claim end-to-end). **Implementation note**: this required adding a small backfill — `referral.model.ts`'s new `attachOrphanReferralsToCase`, called from `case.service.ts`'s `ensureCase`/`createCase` — since a coordinated-entry referral is created with `caseId: null` and nothing else would ever set it once a case opens. Verified live against the running dev server: a referral created before a case existed correctly shows `caseId: null` on creation, then appears with the right `caseId` once `POST /api/cases/ensure` runs for that client. Documented in design.md's addendum.

## 5. Assessment Command Center — Frontend

- [x] 5.1 Replace `assessmentsSlice.ts`: `{ list: { items, total, page, pageSize, kpis, filter, typeFilter, status }, detail }` shape; thunks `fetchAssessments`, `fetchAssessmentDetail`, `createAssessment`, `updateAssessment` calling `apiClient` directly (no dedicated wrapper, per repo convention for non-`client-intake` domains).
- [x] 5.2 Build `apps/web/src/features/assessments/AssessmentCommandCenterPage.tsx`: KPI row (`KpiTile` × 4), two `FilterChipRow`s (status group, type group) composed side by side per design.md Decision 6's `FilterChipRow` reuse (no new shared component), `DataTable` (Assessment, Client, Program Enrollment, HUD Stage, Status, Due Date, Actions).
- [x] 5.3 Build the assessment detail view: score/scoreLabel rendered via a prominent tile-style element (reused `KpiTile`, not a numeric `<input>`), "not yet scored" state when `score` is `null`. Added as a new `/assessments/:id` route (`AssessmentDetailPage.tsx`) — not explicitly in the original task list but needed for the row action to link somewhere.
- [x] 5.4 Wire `apps/web/src/routes/pages/AssessmentsPage.tsx` to render `AssessmentCommandCenterPage` instead of the placeholder copy.

## 6. Coordinated Entry — Frontend

- [x] 6.1 Replace `coordinatedEntrySlice.ts`: sub-state per step (`vulnerabilityAssessment`, `recommendedPrograms`, `partnerAgencies`, `referral`) plus `prioritizationList` (items + active quick-filter toggles), thunks for each of the 5 endpoints.
- [x] 6.2 Build `apps/web/src/features/coordinatedEntry/CoordinatedEntryWizard.tsx` shell following `IntakeWizard`'s shell/step separation (design.md Decision 6): `ClientSearchField` (reused) → 4 step components. **Deviation from the original task wording**: steps use a plain `onComplete` callback prop instead of `IntakeWizard`'s `StepHandle`/ref/`useImperativeHandle` indirection — that pattern exists for validation-heavy multi-field forms; these 4 steps (a screening form, two pick-one lists, a review-and-send) don't need it. Functionally equivalent, documented per the repo's own precedent for this kind of sketch-vs-build deviation.
- [x] 6.3 Build `steps/Step1VulnerabilityAssessment.tsx` (placeholder screening question set + safety-alert toggle), `steps/Step2RecommendedPrograms.tsx`, `steps/Step3PartnerAgencies.tsx`, `steps/Step4SendReferral.tsx`.
- [x] 6.4 Wire `StatusStepper` above the step content, driven by the wizard's current-step state (display-only per design.md Decision 6).
- [x] 6.5 Build `PrioritizationList.tsx`: `DataTable` + 5 independently-toggleable quick-filter chips (not `FilterChipRow`, which is single-select) composing as AND per design.md Decision 5.
- [x] 6.6 Wire `apps/web/src/routes/pages/CoordinatedEntryPage.tsx` to render the wizard + `PrioritizationList` instead of the placeholder copy.

## 7. Verification

- [x] 7.1 Run `npm run lint` (layering-boundary rule) and `npx tsc -b tsconfig.json` in `apps/web`, `tsc -p tsconfig.json --noEmit` in `apps/api`. All clean; also ran `packages/types`' own `tsc --noEmit` and the full `npm run lint` (turborepo, all 4 packages) from repo root.
- [x] 7.2 Regression: submit the intake wizard's Health & DV step twice for the same enrollment; confirm exactly one `Assessment` row (type `entry`, cycle `1`) results. Verified live against the running dev server. **Caught and fixed a real bug in the process**: `type` was only ever set from an explicit request field, so the intake wizard's own calls (which never pass `type`) left every Entry Assessment's `type` column `null` — meaning the Command Center's `typeFilter=entry` would never have matched a single real intake-created assessment. Fixed by deriving `type` from `dataCollectionStage` via `constants/assessmentTypes.ts`'s `stageToAssessmentType` whenever the caller doesn't supply one (mirrors how `cycleNumber` already defaults to `1`).
- [x] 7.3 Manually verified via direct API calls against the running dev server (see design.md's Decision 8 addendum for the referral/case-backfill finding): status+type filters combine correctly on `GET /api/assessments`; submitting a vulnerability assessment returns a real score/tier; a second quick filter composes with the first on the prioritization list (AND, not OR); a coordinated-entry referral now shows up on that client's case's Referrals tab once a case exists. **Also caught and fixed a real scoring bug**: `POST /api/assessments` let a client-supplied `score`/`scoreLabel` silently override the server-computed value (via an unguarded object-spread ordering bug) — fixed by stripping those fields from the request body and reordering the write-data spread so computed values always win. **Not done**: no visual/browser check of the two new screens' actual rendering — this session has no browser automation tool available, so the frontend was verified by type-check + lint + close reading against the exact component APIs (`FilterChipRow`, `DataTable`, `KpiTile`, `StatusStepper`, etc.) only, not by looking at the rendered page. Flagged to the user as an open item.
- [x] 7.4 Updated root `CLAUDE.md` per the standing rule: new models/endpoints, the `Assessment` extension and its unique-key change, the `ScoringService` seam, and the two new screens.
