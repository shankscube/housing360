## 1. Data model migration

- [x] 1.1 Add `Assessment.assessorId` (FK `User`, nullable), `legacySyncStatus` (`String @default("not_synced")`), `legacySyncDate` (`DateTime?`) — do not touch `status`/`type`/`dueDate`/`score`/`scoreLabel`/`cycleNumber`, which already exist.
- [x] 1.2 Add `ProgramEnrollment.endDate` (`DateTime?`).
- [x] 1.3 Add `Program.projectTypeCode` (`String?`) and `Program.operatingOrganizationId` (`String?`, FK `Organization`).
- [x] 1.4 Add `User.role` (`String @default("case_manager")`).
- [x] 1.5 Create `program_exits` (`programEnrollmentId`, `assessmentId`, `exitDate`, `destinationType`, `destination`, `caseManagerExitReason`, timestamps).
- [x] 1.6 Create `assessment_score_contributions` (`assessmentId`, `field`, `value`, `contribution`, timestamps).
- [x] 1.7 Create `scoring_rules` (`field`, `matchValue`, `rangeMin`, `rangeMax`, `contribution`, `isActive`).
- [x] 1.8 Create `care_plan_template_rules` (`templateId`, `scoreBandMin`, `scoreBandMax`, `fieldCondition`, `priority`).
- [x] 1.9 Create `ce_questions` (`text`, `clientFacingPrompt`, `sequence`, `isActive`, `weightNote`) and `ce_answer_options` (`questionId`, `text`, `score`).
- [x] 1.10 Create `ce_score_bands` (`name`, `minScore`, `maxScore`, `description`, `badgeColor`, `recommendedProjectTypeCodes`).
- [x] 1.11 Create `ce_flag_overrides` (`flag`, `triggerQuestionId`, `triggerMinScore`, `behavior`, `externalReferralMessage`).
- [x] 1.12 Create `ce_rule_changes` (`ruleTable`, `ruleId`, `actorId`, `before`, `after`, `changedAt`).
- [x] 1.13 Create `ce_assessments` (`clientId`, `assessorId`, `assessedAt`, `totalScore`, `bandId`, `flags`, `referralId` unique nullable FK) and `ce_responses` (`ceAssessmentId`, `questionId`, `answerOptionId`, `score`).
- [x] 1.14 Drop `VulnerabilityAssessment`; repoint `Referral`'s reverse relation to `ce_assessments`.
- [x] 1.15 Add `destinationType`/`destination` HUD option keys to `apps/api/src/constants/hudOptions.ts`, seeded with the standard HUD 3.12 Destination taxonomy (mark as an open item pending source-org confirmation).
- [x] 1.16 Run `prisma migrate dev` and confirm `apps/api` builds against the new schema.

## 2. Seed data

- [x] 2.1 Seed the provisional `scoring_rules` set (chronic homelessness, months homeless, income presence, DV survivor — mirroring the old placeholder tally's factors), clearly commented as provisional. **Gap**: disability-count scoring can't be expressed as a single-field `scoring_rules` row (it's a count of child `Disability` rows, not a scalar on `Assessment`); left for `HousingStabilityScoringService` to special-case via a computed pseudo-field.
- [x] 2.2 Seed `care_plan_template_rules` mapping each existing published `CarePlanTemplate` to a score band (2 published templates exist today, not 3 as originally assumed — split 0-49/50-100).
- [x] 2.3 Seed 5 active `ce_questions` with answer options (20 total), 3 `ce_score_bands`, and one `ce_flag_overrides` row per flag (`veteran`/`unaccompanied_youth`/`safety_alert` — exact strings the CE engine must match), all commented as demo configuration. **Gap**: `CeFlagOverride` has no column for which project types an `add`/`replace` override contributes — the engine needs to hardcode per-flag types or a future migration should add a `recommendedProjectTypeCodes`-style column here.
- [x] 2.4 Backfill `projectTypeCode`/`operatingOrganizationId` for the 5 seeded `Program` rows (organization pairing is an arbitrary placeholder — none of the 4 seeded orgs are actual housing-program operators; open item per design.md).
- [x] 2.5 Honor an optional `SEED_USER_ROLE` env var (default `case_manager`) when seeding the demo user; documented in `.env.example`.

## 3. Backend: assessment eligibility, scoring, and exits

- [x] 3.1 Implement `AssessmentEligibilityService` (Entry/Update/Annual/Exit rules per design.md Decision 2), returning `{ stage, allowed, reason, draftAssessmentId? }[]` for an enrollment. **Open item**: `update` has no reserved `dataCollectionStage` code in this repo (only 1/2/3 for entry/annual/exit exist) — eligibility reports it correctly but there's no schema-valid way to persist a distinct "Update Assessment" record yet; flagged for whoever builds the Launch Assessment modal (8.2) or a future schema change.
- [x] 3.2 Implement `HousingStabilityScoringService.score(assessment)` reading `scoring_rules`, writing `assessment_score_contributions`, returning `{ score, label, contributions[] }`. Fully generic — any `Assessment` field (or synthetic `disabilityCount`) can be a rule target, not limited to the old placeholder's 5 hardcoded factors.
- [x] 3.3 Delete `apps/api/src/services/scoring.service.ts`; repoint `assessment.service.ts`'s `scoreIfCompleted()` to the new service.
- [x] 3.4 Wire Exit-assessment completion to create a `program_exits` row and close the `ProgramEnrollment` (set `endDate`/status) in the same transaction as scoring.
- [x] 3.5 Update `carePlan.service.ts`'s `getRecommendedCarePlanTemplates` to evaluate `care_plan_template_rules` against the enrollment's latest completed assessment, falling back to all published templates when none is scored yet.

## 4. Backend: assessment API

- [x] 4.1 KPI tiles + paginated/filterable list — extended the existing `GET /api/assessments` response's `kpis` with `completedThisMonth` rather than adding a duplicate `/dashboard` route (one-fetch convention already used elsewhere).
- [x] 4.2 `GET /api/enrollments/:id/assessment-eligibility`, `GET /api/enrollments/:id/assessments/list` (pre-existing, confirmed sufficient), `GET /api/enrollments/:id/latest-assessment-values`, `GET /api/enrollments/:id/summary`.
- [x] 4.3 `POST /api/assessments` (Draft or Complete), `PATCH /api/assessments/:id`, `GET /api/assessments/:id` (score, contributions, disabilities). `assessorId` set from `req.user.id` on every save, never from the request body.
- [x] 4.4 `DELETE /api/assessments/:id` — 409 when status is `completed`, otherwise deletes.
- [x] 4.5 `PUT /api/assessments/:id/disabilities` — replace the full disability set in one call. **Follow-up**: does not retrigger scoring, so a completed assessment's score can go stale if disabilities change afterward.
- [x] 4.6 `POST /api/enrollments/:id/exit` and `GET /api/enrollments/:id/recommended-care-plan-templates`.

## 5. Backend: Coordinated Entry rule model and engine

- [x] 5.1 Implement `CoordinatedEntryService.score(responses[])` — sum answer scores, resolve the inclusive-range score band, evaluate flag overrides in fixed order (Safety Alert → Veteran → Unaccompanied Youth) per design.md Decision 6, return `{ score, band, recommendedProjectTypes, appliedOverrides[], referralSuppressed, externalReferralMessage? }`. **Open gap** (needs a follow-up schema decision): `CeFlagOverride` has no column for an override's own recommended project types — `add` currently appends nothing extra, `replace` clears the list to `[]`; `appliedOverrides` still records that the override fired. **Fixed during integration**: seed data originally used snake_case flag strings (`unaccompanied_youth`/`safety_alert`); corrected to camelCase (`unaccompaniedYouth`/`safetyAlert`) to match `CeFlag`/`CeAssessmentFlags` in `packages/types`.
- [x] 5.2 `GET /api/ce/questions` (active, ordered), `POST /api/ce/assessments`, `GET /api/ce/assessments/:id` (details, flags, responses, previous assessments for the client).
- [x] 5.3 `GET /api/ce/priority-queue?filter=TOP5|VETERAN|YOUTH|SAFETY_ALERT|AWAITING_REFERRAL&search=&page=` — single active filter, combined with search.
- [x] 5.4 `GET /api/ce/clients/:id/recommendation` and `GET /api/ce/recommended-programs?projectType=` (join operating organization address + live bed count via a new `countAvailableBeds` helper).
- [x] 5.5 `POST /api/ce/referrals` — referrer's default org = earliest-created partner `Organization` (or null); provider case manager = free-text `providerContact` (no FK concept exists elsewhere in the schema for this either).

## 6. Backend: rule administration and permissions

- [x] 6.1 Add `ROLE_PERMISSIONS` map (`apps/api/src/constants/permissions.ts`) and a `requirePermission(permission)` middleware.
- [x] 6.2 CRUD endpoints for `ce_questions`/`ce_answer_options`/`ce_score_bands`/`ce_flag_overrides`, each gated by `requirePermission('ce:manage-rules')` and writing a `ce_rule_changes` row on every successful write (same transaction).
- [x] 6.3 `GET /api/ce/rule-changes`.

## 7. Frontend: reusable section components

- [x] 7.1 Extract `LivingSituationSection`, `IncomeBenefitsSection`, `HealthDvSection` from `Step4LivingSituation.tsx`/`Step5IncomeBenefits.tsx`/`Step6HealthDv.tsx` into props-driven components under `apps/web/src/components/ui/`; update the wizard steps to be thin wrappers with no behavior change. Verified byte-identical wizard behavior via diff.
- [x] 7.2 Extract `DisabilitiesEditor` from `Step7Disabilities.tsx` into `apps/web/src/components/ui/DisabilitiesEditor/` as pure add/remove list state; keep the wizard step's existing per-row persistence thunks unchanged. Minor accepted UX deviation: a failed add-row save no longer preserves the just-typed values for retry (component clears optimistically since it can't await Redux).
- [x] 7.3 Build `ConfirmDialog` in `apps/web/src/components/ui/ConfirmDialog/` on top of the existing `Modal` primitive. Required adding a 4th `danger` Button variant (none existed) — flagged deviation from CLAUDE.md's "three variants" description, accepted as the safer single-source-of-truth choice.
- [x] 7.4 Build `useAssessmentFormDraft` — a local (non-singleton) draft-state hook for the new Assessment form modal, distinct from the wizard's `assessmentDraft.ts`.

## 8. Frontend: Assessment Command Center

- [x] 8.1 Add "Launch Assessment" button, KPI sub-lines, and Resume/Discard actions (Discard routed through `ConfirmDialog`) to `AssessmentCommandCenterPage.tsx`.
- [x] 8.2 Build the Launch Assessment modal (Client → Program Enrollment → Assessment Type), following the `CarePlanWizard.tsx` Modal + local-step pattern, showing disabled-stage reasons and "Resume Draft ›" when a draft exists. `update` stage always renders informational-only (no schema-valid way to persist it yet).
- [x] 8.3 Build the Assessment form modal: stage, Assessment Date (display-only — not settable through the API contract), "Carry forward previous answers", the reused section components, `DisabilitiesEditor`, and an Exit Details section (Destination Type → Destination dependent select + case manager exit reason) shown only for Exit.
- [x] 8.4 Wire the form's footer (Discard Draft, Back, Cancel, Save Draft, Complete) to the eligibility/scoring/exit endpoints.
- [x] 8.5 Rebuild `AssessmentDetailPage.tsx`: Assessment Overview, Client & Enrollment, score with an expandable Field | Value | Contribution table, disabilities (with HIV fields when present), System Information, Resume/Discard for drafts. Required a small additive backend fix: `GET /api/assessments/:id` didn't return section field values or assessor name — `AssessmentDetail` now extends `Assessment` (was `AssessmentListItem`) + adds `assessorName`.

## 9. Frontend: Case Assessments tab

- [x] 9.1 Replace `AssessmentsPanel.tsx`'s placeholder toast with the same Launch/Assessment form/detail components from section 8. Also removed a stale `hasContent`-gated `NotYetBuiltPanel` fallback left over from the placeholder era, which would have made "New Assessment" permanently unreachable on any fresh case (every other completed tab had already dropped this gate; this one was missed).
- [x] 9.2 Route Discard through `ConfirmDialog` instead of deleting immediately.
- [x] 9.3 Wire "Create from Template" on the Recommended Care Plans strip to the rule-driven recommendation endpoint. Verified already correct — both the case-scoped and enrollment-scoped recommended-templates routes call the same rule-driven `getRecommendedCarePlanTemplates`.

## 10. Frontend: Coordinated Entry

- [x] 10.1 Replace `Step1VulnerabilityAssessment.tsx`'s fixed form with a renderer over `GET /api/ce/questions`, keeping the three fixed intake-flag checkboxes (Veteran, Unaccompanied Youth, Safety Alert) and the existing `onComplete` contract.
- [x] 10.2 Add the Coordinated Entry Recommendation card (band badge, override markers, suppression banner with the external message) to the workflow, reusing `StatusStepper` unchanged. **Deviation**: badge color is inferred from the band name text (high/medium/low → coral/gold/teal) since no client-facing endpoint actually returns `CeScoreBand.badgeColor`.
- [x] 10.3 Update Recommended Program Types / Partner Agencies steps to use live project-type + bed-availability data; show "No project types currently have eligible programs." when empty.
- [x] 10.4 Update the Send Referral review panel. **Deviation**: `POST /api/ce/referrals` (`CeReferralInput`) only accepts `ceAssessmentId`/`programId`/`providerOrgId`/`providerContact` — no Description/Comments/priority/category field exists on this endpoint (those belong to the unrelated general `ReferralInput`). Priority/Referral Date/Status/Referral Type/Category/Referrer Case Manager are shown as read-only derived values; Provider Case Manager (`providerContact`) is the one real input. Toasts "Referral sent" on success.
- [x] 10.5 Convert `PrioritizationList.tsx`'s five independent toggle buttons to a single-select `FilterChipRow`, per design.md Decision 13.

## 11. End-to-end verification

- [x] 11.1 Launch an Annual assessment inside its eligibility window, use "Carry forward previous answers", complete it, and confirm the score's contribution breakdown lists every contributing field. Verified live against a running dev server via the real API: eligibility correctly reported Annual as allowed ("Within the annual reassessment window"), carry-forward correctly pulled the completed Entry assessment's values, and the completed Annual assessment scored 75 ("At Risk") with all 4 contributing fields listed, summing exactly to the score. **Found and fixed a real bug in the process**: `createOrUpsertAssessment` defaulted `dataCollectionStage` to `ENTRY_STAGE` whenever a caller passed `type` without an explicit `dataCollectionStage` (exactly what the new Launch Assessment modal does) — this silently clobbered the existing Entry assessment in place instead of creating a new Annual row. Fixed in `apps/api/src/services/assessment.service.ts` to derive the stage from `type` via `assessmentTypeToStage` when no explicit stage is given; re-verified clean after the fix.
- [x] 11.2 Run a vulnerability assessment for a veteran, follow the recommendation to a program with an open bed, send the referral, and confirm it appears in the priority queue as sent. Verified live: submitted 5 responses (score 10) for a veteran client, landed in the "Medium Priority" band with `appliedOverrides: [{flag: veteran, behavior: add}]`, recommended project types `[TH, PSH]`; found "Homelessness Prevention" (TH) with 3 available beds via `/api/ce/recommended-programs`; sent the referral via `/api/ce/referrals` (status `new`, `isExternal: true`); confirmed the priority queue (`filter=VETERAN`) shows the client with `isAwaitingReferral: false` after the referral. Test data cleaned up afterward; both dev server processes I started were stopped.
