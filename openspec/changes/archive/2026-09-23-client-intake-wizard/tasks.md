## 1. Environment and Shared Constants

- [x] 1.1 Add `SSN_ENCRYPTION_KEY` and `SSN_HASH_SECRET` to `.env.example` (documented, no defaults) and to the local `.env`; fail app startup in `src/config/loadEnv.ts` (or equivalent) if either is unset.
- [x] 1.2 Create `apps/api/src/utils/ssn.ts`: `encryptSsn`/`decryptSsn` (AES-256-GCM, IV+authTag packed with ciphertext) and `hashSsn` (HMAC-SHA256 keyed by `SSN_HASH_SECRET`) and `lastFour`.
- [x] 1.3 Create `apps/api/src/constants/hudOptions.ts`: one exported map covering relationship-to-HoH (3.15), name/SSN/DOB data quality (3.01–3.03), veteran status (3.07) and detail codes, race/ethnicity (3.04, incl. 8/9/99), living-situation categories/types (3.917) grouped by category, income sources, non-cash benefit sources, health insurance types + reason codes (1/2/3/4/8/9/99), disability types (4.05–4.10). Each entry is `{ value, label }[]`.
- [x] 1.4 Extend `apps/api/src/utils/logger.ts` redact paths for every new PII field (mobile, email, and the new SSN column names), on top of the existing ssn/dob paths.

## 2. Schema and Migration

- [x] 2.1 Update `prisma/schema.prisma`: alter `Client` (drop `name`, `isHeadOfHousehold`, plaintext `ssn`; add `firstName`, `lastName`, `title`, `nameDataQuality`, `ssnDataQuality`, `dobDataQuality`, `ssnEncrypted`, `ssnHash`, `ssnLast4`, `mobile`, `email`, `veteranStatus`, veteran detail columns, `relationshipToHoh`; change `raceEthnicity` to `Json`; change `householdId` to a nullable FK to `Household`).
- [x] 2.2 Add `Household` (`id`, `headClientId` FK, timestamps) with a unique constraint so a household has exactly one head row.
- [x] 2.3 Add `Program` (`id`, `name`, `isActive`).
- [x] 2.4 Add `ProgramEnrollment` (`clientId`, `householdId`, `programId`, `name`, `startDate`, `status`, `relationshipToHoh`, `disablingCondition`, `enrollmentCoc`, `programCaseManagerId`, `isPrimary`).
- [x] 2.5 Add `Case` (`clientId`, `programEnrollmentId`, `status`) with `@@unique([clientId, programEnrollmentId])`.
- [x] 2.6 Add `Assessment` (`clientId`, `programEnrollmentId`, `caseId`, `dataCollectionStage`, `assessmentDate`, `status`, plus every living-situation, income/benefits/insurance, and health/DV field from the proposal) with `@@unique([programEnrollmentId, dataCollectionStage])`.
- [x] 2.7 Add `Disability` (`assessmentId` FK, `disabilityType`, `response`, `indefiniteAndImpairs`, plus the HIV-only fields).
- [x] 2.8 Add `InteractionSummary` (`clientId`, `caseId`, `title`, `status`, `meetingNotes`, `nextSteps`).
- [x] 2.9 ~~Add every new enum...~~ **Deviation**: every new HUD-coded field is a plain `String` column validated against `hudOptions.ts` at the service layer, not a Prisma enum — avoids a second source of truth for code/label pairs that would need a migration every time a code changes. `Sex`/`DisclosureStatus` stay real Prisma enums (unchanged, small, fixed).
- [x] 2.10 Run `prisma migrate dev` to generate and apply the migration; confirm `prisma generate` produces a working client.
- [x] 2.11 Extend `apps/api/prisma/seed.ts` with 3–5 active `Program` rows; clear any pre-existing dev `Client` rows that predate the new required columns, then re-seed the demo user.

## 3. Shared Types (`packages/types`)

- [x] 3.1 Rewrite `packages/types/src/clients.ts`: split `name` into `firstName`/`lastName`, multi-value `raceEthnicity`, add data-quality/veteran/contact/relationship-to-HoH fields, change `ClientIntakeInput`/`ClientUpdateInput`'s duplicate-confirmation field from `confirmDuplicate` to `allowDuplicate`. `CreateClientResult` is dropped in favor of a plain `Client` success return + `DuplicateClientCandidates` as the 409 error body's `data` (see 4.2's `AppError.data` extension).
- [x] 3.2 Add `packages/types/src/household.ts`, `program.ts`, `enrollment.ts`, `disability.ts`, `interactionSummary.ts`, `hudOptions.ts` for the new domain shapes (existing `cases.ts`/`assessments.ts` extended in place rather than duplicated as singular files).
- [x] 3.3 Add `ClientSearchResultItem` (in `clients.ts`) and `ClientIntakeSnapshot` (new `intake.ts`) types matching the `/api/clients/search` and `/api/clients/:id/intake-snapshot` response shapes.

## 4. Backend: Client Changes (household FK, duplicate-check contract, SSN encryption)

- [x] 4.1 Update `models/client.mapper.ts`/`client.model.ts` for the new columns (encrypt on write, decrypt on detail read, never decrypt for list/search).
- [x] 4.2 Update `services/client.service.ts`: duplicate matching uses `ssnHash`; duplicate-found path throws/returns HTTP 409 (not 200); accept `allowDuplicate` instead of `confirmDuplicate`; remove the old `isHeadOfHousehold`/`assertSingleHeadOfHousehold` logic (superseded by `Household.headClientId`).
- [x] 4.3 Update `controllers/client.controller.ts` and `routes/client.routes.ts` for the new request/response shapes.
- [x] 4.4 Add `GET /api/clients/search?name=` (name, email, DOB, masked SSN, relationship to HoH, sex, veteran — list-safe fields only). Search/duplicate matching is now `OR` on `firstName`/`lastName` (the `name` column no longer exists).
- [x] 4.5 Add `GET /api/clients/:id/intake-snapshot` (household id, per-enrollment case id, enrollments with primary flagged, per-enrollment Entry Assessment status + which sections have values, existing disabilities). Implemented by the orchestrator directly in `client.service.ts` once sections 5/6 landed, reusing `enrollment.model.ts`/`case.model.ts` (added `findCaseByClientAndEnrollment`)/`assessment.model.ts`/`disability.model.ts` (added `findDisabilitiesByAssessmentId`).

## 5. Backend: Household, Programs, Enrollments, Cases

- [x] 5.1 Add `models/`, `services/`, `controllers/`, `routes/` for households: `POST /api/households` (creates household + sets client's `householdId`/`relationshipToHoh` in one transaction), `POST /api/households/:id/members` (bulk-create family members in one transaction).
- [x] 5.2 Add the same layers for programs: `GET /api/programs?active=true`.
- [x] 5.3 Add the same layers for enrollments: `GET /api/clients/:id/enrollments`, `POST /api/enrollments`, `PATCH /api/enrollments/:id`.
- [x] 5.4 Add the same layers for cases: `POST /api/cases/ensure` using the `@@unique([clientId, programEnrollmentId])` upsert (Prisma compound key `clientId_programEnrollmentId`).
- [x] 5.5 Add `GET /api/reference/hud-options` serving `hudOptions.ts` verbatim.

## 6. Backend: Assessments, Disabilities, Interaction Summaries

- [x] 6.1 Add `models/`, `services/`, `controllers/`, `routes/` for assessments: `GET /api/enrollments/:id/assessments?stage=entry`, `POST /api/assessments`, `PATCH /api/assessments/:id` (upsert against `@@unique([programEnrollmentId, dataCollectionStage])`, Prisma compound key `programEnrollmentId_dataCollectionStage`).
- [x] 6.2 Add the same layers for disabilities: `POST /api/assessments/:id/disabilities`, `DELETE /api/disabilities/:id`.
- [x] 6.3 Add the same layers for interaction summaries: `POST /api/interaction-summaries`. Also extended `logger.ts` redact paths for `meetingNotes`/`nextSteps`.
- [x] 6.4 Verified existing `boundaries.js` glob already covers the new `models/services/controllers/routes` files — no eslint config change needed.

## 7. Frontend: Shared Screen-Agnostic Components

- [x] 7.1 Add `GatedField` to `apps/web/src/components/ui/` consuming one declarative `{ targetField, sourceField, enablingValue }[]` config (plus `onGateClose` for auto-clear wiring — see component's own doc comment).
- [x] 7.2 Add a dual-listbox multi-select component to `apps/web/src/components/ui/` for Race and Ethnicity.
- [x] 7.3 Add a step-rail component (upcoming/active/complete, click-gated to furthest step) to `apps/web/src/components/ui/`.
- [x] 7.4 Add any new icons the wizard needs to `src/components/ui/icons/iconPaths.ts` (`chevronsRight`/`chevronsLeft` for DualListbox's move-all buttons). **Follow-up needed**: register the 3 new ui-preview stories in `ui-preview/App.tsx`'s `PREVIEWS` array (out of the component-agent's file scope).

## 8. Frontend: `intake` Redux Slice and API Client

- [x] 8.1 Add `src/store/slices/intakeSlice.ts`: `phase` (search | form | finished), `currentStep` (1-8, matching "Step N of 8"), `furthestStep`, `completedSteps`, and ids for client/household/case/enrollment/assessment/interactionSummary; `resetSectionSteps` (steps 4-7) + new `setActiveEnrollment` reducer (pre-fills case/assessment/disabilities for the newly-active enrollment from the loaded snapshot) implement "switching enrollment resets section completion."
- [x] 8.2 Add thunks for search, intake-snapshot, household create/bulk-members, programs, enrollments, cases/ensure, assessments, disabilities, interaction-summaries, hud-options — all through `src/api/client.ts` (new typed wrapper per endpoint + `extractErrorData` helper for reading a 409's `data`), none via direct `fetch`. `saveClientBasicInfo` rejects with a `{kind:'duplicate', candidates} | {kind:'error', message}` discriminated union so step 1 can distinguish the inline duplicate banner from a normal error toast.
- [x] 8.3 Wire the slice into `src/store/index.ts`.

## 9. Frontend: `IntakeWizard` Shell and Steps

- [x] 9.1 Create `apps/web/src/features/intake/steps.ts`: the `{ key, label, icon, component }[]` step config for the 8 steps. **Deviation**: no separate `onNext` field — each step component implements `StepHandle.save()` (`types.ts`) via `useImperativeHandle`, which the shell calls directly by ref instead of a config-array callback; functionally equivalent, keeps a step's fields/validation/save logic in one file.
- [x] 9.2 Create `apps/web/src/features/intake/IntakeWizard.tsx`: modal with `onClose`/`onViewClient` props, search phase, step rail + "Step N of 8" + progress bar, footer Back/Save & Next (Save & Finish on step 8). Missing-required-fields toast lives per-step (each step owns its own validation), not in the shell. Loads HUD options once on mount; full `resetIntake()` on unmount.
- [x] 9.3 Build the search phase: name input + Search (disabled while empty, Enter submits), results table, no-results messaging, "Continue as New Client".
- [x] 9.4 Build Step 1 (Client Basic Information): all listed fields, veteran-details reveal + scroll, 409 inline duplicate banner with Save Anyway/dismiss, household auto-create on first save. **Gap found and fixed by the orchestrator**: `ClientIntakeSnapshot` didn't originally carry the client's own fields, so an existing client couldn't pre-fill — added `client: Client` to the snapshot type/endpoint and a seed-once-per-clientId effect in this step.
- [x] 9.5 Build Step 2 (Family Members): inline editable table, add/cancel rows, first+last name validation toast, read-only masked rows for existing members, bulk-create call.
- [x] 9.6 Build Step 3 (Program & Enrollment): existing-enrollment picker (primary marked) vs. new-enrollment form, `cases/ensure` call, Entry Assessment status messaging, enrollment-switch reset. Enrollment `name` default falls back to `"<Program name> - Enrollment"` (client name not available at this step — see task 9.1's shell assembly for whether this gets threaded through).
- [x] 9.7 Build Step 4 (Living Situation): category-driven Situation select, clear-on-category-change, Rental Subsidy Type gating, validate-only. Fields share a module-level draft store (`steps/assessmentDraft.ts`, `useSyncExternalStore`) with steps 5-6 so one `saveEntryAssessment` call at step 6 covers all three — no shell provider wiring needed.
- [x] 9.8 Build Step 5 (Income & Benefits/Insurance): `GatedField`-driven income/benefit/insurance sections, validate-only. **Known gap**: no generic Yes/No HUD option key exists server-side for fields without a dedicated one (e.g. per-income-source Yes/No) — temporarily reuses `hudOptions.disablingCondition`'s Yes/No pair; a real `yesNoDisclosure` HUD key is a follow-up.
- [x] 9.9 Build Step 6 (Health & DV): health/pregnancy/DV fields; Save & Next persists the full Entry Assessment (steps 4–6) in one call.
- [x] 9.10 Build Step 7 (Disabilities): add-one-at-a-time list with Remove, HIV-conditional fields, "no known disabilities" checkbox gating Next.
- [x] 9.11 Build Step 8 (Interaction Summary): Yes/No gate, defaulted Title, Save & Finish.
- [x] 9.12 Build the Finished phase: Intake Complete panel, "View client record" (fires `onViewClient`, closes), Back/Done.

## 10. My Clients Integration

- [x] 10.1 Replace `NewIntakeForm` usage in `MyClientsPage.tsx` with `IntakeWizard`; delete `apps/web/src/routes/pages/clients/NewIntakeForm.tsx`. `IntakeWizard` renders as its own fixed-overlay modal (built into the component), not the old inline expand/collapse panel.
- [x] 10.2 Wire `onViewClient` — **simplified from the literal task text**: rather than a fuzzy name-match into the search box, it clears any active filter/search and jumps to page 1, which surfaces the new/edited client at the top of the (newest-first) list without needing the client's name threaded through at all. Still a documented stand-in for a real client-detail route.
- [x] 10.3 Wire wizard close to refetch the client list regardless of how it was closed.
- [x] 10.4 Update the My Clients table: added the Program-status `StatusBadge` column driven by `ClientListItem.primaryEnrollmentStatus` (`active`→"Enrolled"/teal, `pending`→"Awaiting referral"/gold, matching the pre-registered `statusToneByLabel.ts` vocabulary; other/no-enrollment falls back to the raw status or a dash — see the code comment for why the third bundle word, "Intake started", isn't reachable from list-level data yet). `withProgram`/`withoutProgram` filters already reflect real data (section 4's work).

## 11. Verification

- [x] 11.1 `npm run lint` — confirm the layering boundary rule passes for all new API files, and no inline hex/arbitrary Tailwind values were introduced in new frontend components. `apps/api`/`apps/web` both pass `eslint --max-warnings 0` clean.
- [x] 11.2 `npm run build` and `npm run test` pass across all workspaces. **Note**: `apps/api`'s `build` script (`prisma generate && tsc`) fails locally only when the live `tsx watch` dev server holds the Windows Prisma-engine DLL locked (a pre-existing Windows-only artifact of this stack, not a code defect — see the schema-migration step earlier in this session for the same issue); `tsc -p tsconfig.json` (the actual compile/emit) verified clean standalone. `apps/web`'s build and both `test` scripts (placeholder "no tests yet", pre-existing) pass.
- [x] 11.3 Verified SSN never appears unmasked in search, list, or duplicate-candidate payloads (scripted assertions against the live API), and confirmed the logger's redact config actually redacts a request body shaped exactly like the wizard's (including the `members[]` array) — every `ssn.value`/`dob.value`/`mobile`/`email`/`meetingNotes`/`nextSteps` field came back `[REDACTED]`.
- [x] 11.4 End-to-end run completed **against the live API directly** (see note below), not by driving the React UI in a browser: created a new client, a household, 2 family members, a program enrollment, ran `cases/ensure` twice (confirmed idempotent), saved the Entry Assessment twice (confirmed exactly one row, upserted), added 2 disabilities (including HIV-conditional fields), an interaction summary, and exercised the duplicate-check 409→`allowDuplicate` flow — then independently queried Prisma directly and confirmed every row exists with correct data (Client, Household, 2 member Clients, ProgramEnrollment, Case, 1 Assessment row, 2 Disability rows, InteractionSummary). Test rows were then deleted. **Caveat, stated plainly**: no headless-browser tool (`chromium-cli`, Playwright) was available in this environment to visually drive the actual `IntakeWizard` React UI end-to-end — the frontend was verified structurally (clean `tsc`/`eslint` across the whole contract between the 8 step components and this exact API surface) but not visually exercised in a browser. Recommend a manual click-through in a real browser before treating this as fully done, or running `/run-skill-generator` to capture a repeatable browser-driven check for this repo.
