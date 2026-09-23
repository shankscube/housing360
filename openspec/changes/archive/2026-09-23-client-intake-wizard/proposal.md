## Why

The `my-clients-screen` New Intake form only captures the bare HUD Universal Data Elements as a single flat form — it has no household/family capture, no program enrollment, no HUD-required Entry Assessment (living situation, income/benefits/insurance, health/DV), no disabilities, and no case linkage. A real HMIS-grade intake needs all of that, and the approved design (`docs/Housing360 Portal.html`) shows it as a multi-step wizard, not a single form. This change replaces the single-form intake with that full wizard and builds the domain tables (household, program, enrollment, case, assessment, disability, interaction summary) intake needs to write to.

## What Changes

- **BREAKING**: `Client` schema restructured — `name` splits into `firstName`/`lastName`; `raceEthnicity` becomes multi-value; adds `title`, `nameDataQuality`/`ssnDataQuality`/`dobDataQuality` (HUD 3.01–3.03), `mobile`, `email`, `veteranStatus` (HUD 3.07) plus veteran detail fields; SSN storage moves from a plain nullable column to encrypted-value + hash (duplicate matching) + last4 (display).
- **BREAKING**: `householdId` (a bare generated grouping string) is replaced by a real `Household` entity (`head_client_id`) that `Client.householdId` references as a foreign key; `isHeadOfHousehold` is replaced by `relationshipToHoh` (HUD 3.15 codes), derived/validated against the household's `headClientId` rather than stored as an independent boolean.
- **BREAKING**: `POST /api/clients` / `PATCH /api/clients` duplicate-check response changes from `200 { status: 'duplicates_found' }` / `confirmDuplicate` to `409` with candidates / `allowDuplicate`, matching the wizard's inline-banner (not toast) treatment.
- New tables: `programs`, `program_enrollments`, `cases` (minimal), `assessments` (Entry-stage HUD fields for living situation, income/benefits/insurance, health/DV), `disabilities`, `interaction_summaries`. These are intake-scoped now; later phases (`cases-screen`, `assessments-and-coordinated-entry`) MUST extend these tables rather than recreate them (see Impact).
- One shared HUD code-list module (labels/values, including 8/9/99 codes) served via `GET /api/reference/hud-options` — the frontend never hardcodes an option list.
- New endpoints: client search, intake snapshot, households + bulk member create, programs, enrollments, `cases/ensure` (idempotent), assessments, disabilities, interaction summaries — see `design.md` for the full list.
- New `apps/web/src/features/intake/` — a single reusable `IntakeWizard` modal (search → 8-step form → finished) driven by one step-config array and a new `intake` Redux slice, replacing `NewIntakeForm.tsx` entirely. Opens from My Clients now; Home quick action and Referrals are future callers of the same component.
- My Clients: `withProgram`/`withoutProgram` filters become real (backed by `program_enrollments`) instead of the documented always-empty/always-full placeholders; adds a Program status `StatusBadge` column driven by the primary enrollment.
- Shared, screen-agnostic pieces this change adds (dual listbox, gated-field, step rail, etc.) go in `apps/web/src/components/ui/` per the repo's standing rule — not a new package.

## Capabilities

### New Capabilities
- `client-intake`: the multi-step HUD intake wizard — client-search-or-create, family members, program enrollment, Entry Assessment (living situation, income/benefits/insurance, health/DV), disabilities, interaction summary — plus the domain writes (household, enrollment, case, assessment, disability, interaction summary) and reference HUD option lists it depends on.

### Modified Capabilities
- `client-management`: `Client` entity requirements change (name split, multi-value race/ethnicity, new HUD data-quality/veteran/contact fields, SSN storage as encrypted+hash+last4, household as a real FK'd entity with `relationshipToHoh` replacing the bare `isHeadOfHousehold` boolean); the duplicate-check requirement's response contract changes (409 + `allowDuplicate` instead of 200 + `confirmDuplicate`); the My Clients list requirement gains real (non-placeholder) `withProgram`/`withoutProgram` filtering and a program-status column.

## Impact

- **`apps/api`**: `prisma/schema.prisma` (Household, Program, ProgramEnrollment, Case, Assessment, Disability, InteractionSummary models; Client column changes — needs a migration, no production data to preserve yet); new `models/`, `services/`, `controllers/`, `routes/` per domain, following the existing layering boundary; a new SSN encryption/hash utility; a shared HUD constants module; `utils/logger.ts` redact paths extended for every new sensitive field.
- **`apps/web`**: new `src/features/intake/` (wizard shell, 8 step components, `GatedField`, dual listbox, `intake` slice); `src/routes/pages/MyClientsPage.tsx` wired to open `IntakeWizard` instead of the inline `NewIntakeForm`; `NewIntakeForm.tsx` deleted; `src/components/ui/` gains the new screen-agnostic controls; `src/api/client.ts` gains the new endpoint calls.
- **`packages/types`**: `clients.ts` overhauled for the new `Client` shape; new shared types for household, program, enrollment, case, assessment, disability, interaction summary, and HUD option lists.
- **Later phases** (`cases-screen`, `assessments-and-coordinated-entry`, per the project's phase plan) depend on the `cases`/`assessments`/`disabilities` tables and endpoints this change introduces, and must extend rather than redefine them.
