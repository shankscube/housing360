## Context

`Client` today (from `my-clients-screen`) is a flat HUD-Universal-Elements-only record: `name` (single string), `sex`, `raceEthnicity` (single string), disclosure-paired `ssn`/`dob`, and a bare `householdId` string with an `isHeadOfHousehold` boolean — no `Household`, `Program`, `Case`, or assessment-shaped entity exists anywhere in `prisma/schema.prisma`. `NewIntakeForm.tsx` is a single inline form covering only those fields. This change is the first to give Housing360 a real HMIS-grade intake: household as a first-class entity, program enrollment, a minimal case, a full HUD Entry Assessment (living situation, income/benefits/insurance, health/DV), disabilities, and an interaction summary — all written from one multi-step wizard that matches `docs/Housing360 Portal.html`.

This lands on top of `client-management` (archived), which explicitly deferred a `Household` table, SSN encryption, and the Program-status column as follow-ups — this change is that follow-up, not a new direction.

## Goals / Non-Goals

**Goals:**
- Model `Household`, `Program`, `ProgramEnrollment`, `Case` (minimal), `Assessment` (Entry-stage), `Disability`, `InteractionSummary` so intake can write every row the wizard captures.
- Give `Client` the full set of HUD fields the wizard's step 1/2 need (name split, data-quality codes, veteran detail, multi-value race/ethnicity, contact fields) and move SSN to encrypted storage.
- Ship one reusable `IntakeWizard` (search → 8-step form → finished) as the single implementation other launch points (Home, Referrals) will reuse later — not three separate forms.
- Serve every HUD code list from one endpoint so the frontend never hardcodes an option list.
- Make `cases/ensure` and the Entry Assessment write idempotent per (client, enrollment) — re-entering the wizard for the same enrollment must not create duplicate rows.
- Wire My Clients' `withProgram`/`withoutProgram` filters and a Program-status column to the new, real enrollment data.

**Non-Goals:**
- A `Cases` or `Assessments` **screen** — this change writes those tables from intake only; browsing/editing them elsewhere is `cases-screen`/`assessments-and-coordinated-entry`'s job, and those phases must extend these tables, not redefine them.
- A general client-detail page. None exists yet; see the `onViewClient` decision below for how "Phase C" copes without one.
- SSN key rotation, HSM-backed key management, or field-level encryption for any field besides SSN.
- Coordinated Entry, Referrals, or Home quick-action wiring — this change builds `IntakeWizard` to be reusable by them, but does not wire those call sites in.
- Historical/administrative data-collection stages (update, exit, annual assessment) — intake only ever writes `data_collection_stage = 1` (Entry).

## Decisions

**`Household` becomes a real entity, created after its head client already exists, in one transaction.** `households` has `id` + `head_client_id` (FK → `clients.id`, NOT NULL). This creates a chicken-and-egg problem — a household needs a head client, but `clients.household_id` wants to point back at the household — solved by ordering: step 1 saves the `Client` row first (`household_id` nullable at that point); `POST /api/households { clientId }` then creates the household with `head_client_id = clientId` **and** sets that same client's `household_id` and `relationship_to_hoh = SELF` in the same DB transaction. There is no "change head of household" endpoint in this phase — the head is fixed at household-creation time, which sidesteps the old service-layer "exactly one head" race check entirely (structurally, a household can only ever have the one head it was created with). Alternative considered: keep `isHeadOfHousehold` as an independent boolean per client and re-validate it on every write, as `client-management` did — rejected because it re-introduces the exact race the original design flagged as a known gap; an FK is enforced by the schema, a boolean invariant isn't.

**SSN moves to encrypted-value + deterministic-hash + last4, three columns replacing the one plaintext column.** `ssnEncrypted` (AES-256-GCM ciphertext, IV+authTag included, key from a new `SSN_ENCRYPTION_KEY` env var) is for retrieval on the detail endpoint; `ssnHash` (HMAC-SHA256 keyed by a separate new `SSN_HASH_SECRET`, not `SSN_ENCRYPTION_KEY`) is for duplicate matching, since GCM's random IV makes the same SSN encrypt differently every time and thus unqueryable; `ssnLast4` is for display everywhere the UI needs a masked value. Both new env vars fail the app at startup if unset (same discipline as `DB_*`/`JWT_SECRET`), rather than silently encrypting with a default key. HMAC (not plain SHA-256) for the hash specifically because a 9-digit SSN has only ~1e9 possibilities — an unkeyed hash is brute-forceable offline from a DB dump; a keyed HMAC isn't, without the secret. The `ssnDisclosure` enum stays; when status isn't `PROVIDED`, all three SSN columns are null. Alternative considered: reversible encryption alone, deriving "is this a match" by decrypting every candidate row — rejected as unworkable at any real row count and a needless decrypt-everything exposure surface.

**Race/ethnicity (HUD 3.04) is a JSON array column on `Client`, not a child table.** It's multi-select but never filtered/queried individually anywhere in this change (My Clients' filters don't slice by race), so a normalized child table would be pure ceremony. `raceEthnicity Json` stores an array of HUD code strings, including `"8"`/`"9"`/`"99"`. Revisit only if a future screen needs to query "clients with race code X" directly.

**`relationship_to_hoh` (HUD 3.15) is informational metadata on every client, not the source of truth for "is head."** The head's own row still carries a `relationship_to_hoh` value (HUD's own "Self" code), but whether a client *is* the head is answered by `household.headClientId === client.id`, never by comparing that code. This keeps exactly one place that can make someone "head" (household creation), while still letting the wizard render/edit the HUD code like any other field.

**`cases.ensure` is idempotent via a DB-level compound unique key, not just an app-layer check.** `@@unique([clientId, programEnrollmentId])` on `Case`; the service does a Prisma `upsert` keyed on that compound constraint (create-if-absent, otherwise return the existing row untouched). This is safe under concurrent double-clicks of "Save & Next" in a way an app-layer find-then-create isn't.

**Exactly one Entry Assessment per enrollment, enforced the same way.** `Assessment` gets `@@unique([programEnrollmentId, dataCollectionStage])`. Steps 4–6 of the wizard accumulate their fields in the `intake` slice's local state across three screens and issue a single POST-or-PATCH (upsert against that compound key) only when step 6's "Save & Next" fires — matching the prompt's "one Entry assessment record for steps 4–6" requirement exactly, and meaning steps 4–5 are client-side-validate-only with no network call, as specified.

**Income/Benefits gating is one declarative config array, not per-field conditionals.** A single `GatedField` config: `{ targetField, sourceField, enablingValue }[]`, consumed by a generic `<GatedField>` component (`apps/web/src/components/ui/`) that looks up its own entry, reads `sourceField`'s current value from the step's form state, and derives `disabled`/auto-clear itself. Every "Yes/No gates an Amount" and "No gates a reason" pair in step 5 is one entry in that array — adding a HUD income source later is a data change, not a new conditional branch.

**The wizard shell is step-config-driven, one array, not a hardcoded switch.** `{ key, label, icon, component, onNext }[]` in `features/intake/steps.ts`. The shell (left rail, header "Step N of 8" + progress bar, footer Back/Save&Next) is entirely generic over this array; it calls the active step's `onNext` (which validates and, per-step, may or may not hit the API — see step decisions above) before advancing `currentStep`/`furthestStep`/`completedSteps` in the `intake` Redux slice. Rail steps are clickable only at-or-before `furthestStep`, per spec.

**Duplicate-check response contract changes from 200/`confirmDuplicate` to 409/`allowDuplicate` — an intentional, documented break from `client-management`'s original contract.** The prompt specifies an inline warning banner ("Save Anyway" + dismiss), not the old toast-driven 200-status flow, and a 409 status is the more conventional signal for "conflict, did not write." Since this is still pre-production (no real data, no external API consumers), the break is taken now rather than carrying two conventions forward. `NewIntakeForm.tsx` (the only caller of the old contract) is deleted in this same change, so nothing is left calling the old shape.

**No client-detail screen exists yet, so `onViewClient` gets a pragmatic stand-in, not a stub route.** Phase C's "View client record" link fires `onViewClient(clientId)`; on My Clients, that closes the wizard, sets the search box to the new client's name, and refetches — surfacing the row rather than 404ing on a route that doesn't exist. This is a documented, deliberate gap: a real client-detail page is future work (likely arriving with `cases-screen`, which needs one anyway), not something this change should scope-creep into building.

**HUD option lists live in one server-side constants module, never duplicated on the frontend.** `apps/api/src/constants/hudOptions.ts` exports every code list this change needs (relationship-to-HoH, veteran status, race/ethnicity, living-situation categories/types, income sources, insurance types + reason codes, disability types) as `{ value, label }[]`, keyed by list name. `GET /api/reference/hud-options` returns the whole map in one payload (small, static, cacheable client-side for the wizard's lifetime) rather than one endpoint per list — simpler for the frontend to consume once at wizard-mount.

**Programs are seeded, not user-creatable in this change.** `prisma/seed.ts` gains 3–5 active `Program` rows; there's no "create a program" UI or endpoint — `GET /api/programs?active=true` is read-only here, matching the prompt's scope (enrollment picks a program, it doesn't manage the program list).

## Risks / Trade-offs

- **[Risk]** `SSN_ENCRYPTION_KEY`/`SSN_HASH_SECRET` loss is unrecoverable (encrypted SSNs become permanently unreadable; hashes become unmatched) → **Mitigation**: document both as required, non-rotatable-without-a-backfill env vars in `.env.example`, same tier as `DATABASE_URL`; no fallback/default key path.
- **[Risk]** Breaking the duplicate-check contract (200→409, `confirmDuplicate`→`allowDuplicate`) would strand any other caller → **Mitigation**: confirmed `NewIntakeForm.tsx` is the only caller and is deleted in this same change; no other code references the old field/status.
- **[Risk]** An 8-step wizard with cross-step state (switching enrollment resets section completion, resuming an in-progress Entry Assessment) is easy to get subtly wrong → **Mitigation**: `intake` slice keeps `completedSteps`/`furthestStep` as explicit, narrow state (not derived ad hoc per render), and "switch enrollment" has one reducer that resets exactly the section-step keys (4–7), not the whole slice.
- **[Risk]** Client-side-only "no client detail screen" stand-in for `onViewClient` may feel incomplete to a reviewer expecting a real link → **Mitigation**: called out explicitly as a Non-Goal and Open Question here, not silently shipped.
- **[Risk]** Dropping/renaming existing `Client` columns (`name`, `isHeadOfHousehold`, string `raceEthnicity`) has no production data to preserve, but does invalidate any manually-seeded local dev rows → **Mitigation**: none needed beyond a note in tasks.md to re-seed after migrating; not a rollback-sensitive change.

## Migration Plan

One Prisma migration, additive-and-destructive (dev-only data, no backfill needed):
1. Alter `Client`: drop `name`, `isHeadOfHousehold`; drop plaintext `ssn` column; add `firstName`, `lastName`, `title`, `nameDataQuality`, `ssnDataQuality`, `dobDataQuality`, `ssnEncrypted`, `ssnHash`, `ssnLast4`, `mobile`, `email`, `veteranStatus`, veteran-detail columns, `relationshipToHoh`; change `raceEthnicity` from `String` to `Json`; change `householdId` from a bare indexed string to a nullable FK column pointing at the new `Household` table.
2. Add `Household`, `Program`, `ProgramEnrollment`, `Case`, `Assessment`, `Disability`, `InteractionSummary` models plus their enums (relationship-to-HoH, veteran status, situation category, disability type, etc., mirrored from `hudOptions.ts`).
3. Extend `apps/api/src/utils/logger.ts` redact paths for every new sensitive/PII field on the same pass (mobile, email — not just SSN/DOB).
4. Extend `prisma/seed.ts` with 3–5 `Program` rows.
5. Re-run `npm run seed` after migrating (existing dev-seeded `Client` rows from `my-clients-screen` testing will not satisfy the new NOT NULL columns and should be cleared, since there's no real data to preserve).

Rollback: `prisma migrate resolve` back one step / drop the new tables and re-add the old `Client` columns — acceptable given no production data exists.

## Open Questions

- **Program-status label mapping** (Enrolled / Awaiting referral / Intake started) is explicitly called out in the prompt as unconfirmed. Proposed default, to confirm before/during implementation: enrollment `status = active` → "Enrolled" (`teal`); `status = pending` → "Awaiting referral" (`gold`); a `Case` exists but no completed Entry Assessment yet → "Intake started" (`blue`). Needs sign-off against the actual bundle screenshots in `docs/Housing360 Portal.html`.
- Is the `onViewClient` stand-in (search-and-surface on My Clients, no real navigation) acceptable for this change, or should a minimal read-only client-detail route be pulled forward from `cases-screen`?
- Confirm the full HUD 3.15 (relationship to HoH) and 4.05–4.10 (disability type) code lists against the current HMIS Data Standards revision before finalizing `hudOptions.ts` — the prompt names the categories but not every code/label pair.
