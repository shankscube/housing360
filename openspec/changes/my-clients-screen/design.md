## Context

`Client` is currently a 3-field stub (`packages/types/src/clients.ts`) and `apps/api/prisma/schema.prisma` has no domain models beyond the placeholder `AppMeta` and `User`. This is the first domain entity and first full-stack CRUD slice built on top of the `project-setup`/`base-components` scaffold (layered API, `responder.ts` response shape, Pino logging, RTK slices, the `apps/web/src/components/ui` library, route guarding). No `Program` or `Case` entity exists yet, which constrains what the "With Program"/"With Cases" filters can actually do today.

## Goals / Non-Goals

**Goals:**
- Define the `Client` data model (HUD Universal Data Elements, household grouping, disclosure fields) as a Prisma model + shared type, reusable by future domains.
- Establish the disclosure-field pattern (value ∪ `client_doesnt_know` / `prefers_not_to_answer` / `data_not_collected`) as a shared convention, not a one-off on SSN/DOB.
- Ship `GET/POST/PATCH /api/clients[...]` following the existing routes → controllers → services → models layering and `responder.ts` conventions.
- Ship the My Clients list screen (filters, search, column visibility, masked SSN) and the New Intake form (duplicate-check-then-confirm).
- Make sure SSN/DOB never appear in list payloads or in logs.

**Non-Goals:**
- Building `Program` or `Case` entities — "With Program"/"With Cases" filters are defined here as a contract but cannot reflect real data until those entities exist (see Risks).
- Cross-household duplicate-person alerting — explicitly deferred (see proposal's carried-forward gap).
- Encryption at rest for SSN — flagged as a follow-up, not solved here (see Risks).
- A separate `Household` table — `householdId` is a grouping key on `Client`, not a related entity, for now.

## Decisions

**Disclosure field = value column + status enum column, per field.** For each disclosure-capable field (starting with `ssn` and `dob`), the Prisma model gets two columns: `<field>` (nullable, holds the real value only when disclosed) and `<field>Disclosure` (enum `PROVIDED | CLIENT_DOESNT_KNOW | PREFERS_NOT_TO_ANSWER | DATA_NOT_COLLECTED`). A shared `DisclosureField<T>` TS type in `packages/types` represents this at the API boundary as `{ status: DisclosureStatus; value: T | null }`, with a small mapper in the model/service layer converting to/from the two flat columns. Alternative considered: a single JSON column per field — rejected because it's harder to index/query and MySQL JSON columns don't get the same type safety from Prisma as scalar columns. Alternative considered: one shared polymorphic `DisclosureValue` table — rejected as over-engineering for two fields today; revisit if disclosure fields proliferate enough that per-field columns get unwieldy.

**No separate duplicate-check endpoint.** The proposal's API list only defines four endpoints; `POST /api/clients` itself doubles as the duplicate check. The service always runs the name+DOB+SSN match first. If matches exist and the request body doesn't set `confirmDuplicate: true`, the endpoint returns `200` with `{ status: 'duplicates_found', candidates }` and creates nothing. If there are no matches, or `confirmDuplicate: true` is set, it creates and returns `201` with `{ status: 'created', client }`. The frontend's "duplicate-check endpoint" is this same call made twice (once implicit, once with confirmation) — not a fifth route.

**`householdId` is a generated grouping key, not a foreign key to a `Household` table.** Creating the first member of a household generates a new `householdId` (server-side, e.g. a UUID); adding subsequent members means the caller supplies that same id. Exactly one client per `householdId` may have `isHeadOfHousehold = true`; this is enforced in `client.service.ts` on create/update (reject with `AppError(409, ...)` if it would produce zero or two-plus heads for a household), not as a DB constraint — MySQL has no native "exactly one true per group" check.

**"With Program" / "With Cases" filters are contract-complete but currently trivial.** Since no `Program`/`Case` model exists, the service implements them as: `withProgram`/`withCases` → always zero rows; `withoutProgram`/`withoutCases` → all rows (every client currently has neither). `all`/`male`/`female` filter on `sex` normally. This keeps the filter API shape stable for when those entities land, rather than omitting the filter values now and adding them later.

**Search matches client name only.** SSN/DOB are disclosure fields and sensitive; matching search against them (especially SSN) would be both a leak risk and, if SSN is later encrypted, technically impossible without decrypting every row. Search is a case-insensitive `contains` on name, combined with the active filter chip (AND, not OR).

**SSN stored as plaintext for this phase**, consistent with there being no encryption-at-rest infrastructure anywhere else in the codebase yet (passwords use bcrypt hashing, which is one-way and doesn't apply here since SSN must be retrievable for the detail view). Mitigated by: never included in list responses, masked in the UI to last-4, and redacted from logs (see below). Flagged as a follow-up in Risks, not solved in this change.

**Redux slice keeps one file, three sub-reducers.** `clientsSlice`'s state becomes `{ list, detail, intakeForm }`. Each is updated by its own dedicated reducer/action set (e.g. `setListFilter`, `setListPage`, `setSearchTerm` for `list`; `clientDetailRequested`/`clientDetailLoaded`/`clearSelectedClient` for `detail`; `setIntakeField`, `setDuplicateCandidates`, `resetIntakeForm` for `intakeForm`), plus `extraReducers` for the three thunks (`fetchClients`, `fetchClientById`, `createClient`). This matches the "one slice per domain, not a god slice" convention already in place — it does not introduce `combineReducers` or split into multiple slice files.

**Column visibility is client-only, unpersisted.** The column-visibility control is local component state in `MyClientsPage`, reset on reload. No backend involvement, no localStorage persistence — nothing in the prompt requires it to survive a refresh, and adding persistence would be scope creep for a first cut.

**Logging safety**: `apps/api/src/utils/logger.ts`'s Pino instance gets a `redact` config for `req.body.ssn`, `req.body.dob`, and their nested paths under `*.ssn`/`*.dob` (covering both the flat intake payload and any future nested shapes), on top of the existing discipline of only ever logging client records by `id`, never as a full object, in `client.service.ts`/`client.controller.ts`.

## Risks / Trade-offs

- **SSN stored in plaintext** → mitigated by list/detail split, UI masking, and log redaction; real mitigation (encryption at rest) is a follow-up, not resolved here. Flag explicitly in the PR/change notes.
- **No DB-level single-head-of-household constraint** → enforced only in the service layer; a direct DB write (migration script, manual edit) could violate it silently. Accepted for this phase since there's no other write path into `Client` yet.
- **"With Program"/"With Cases" filters are semantically empty until `Program`/`Case` exist** → documented behavior, not a bug; revisit when those domains are built.
- **No cross-household duplicate-person alert** → explicitly carried forward per the proposal; a `// TODO(household-duplicate-alert)` marks the spot in `client.service.ts` where it would go.

## Migration Plan

Additive only: one Prisma migration adding the `Client` table (and enum types for `sex`, `disclosure status`). No existing table changes, no data backfill, no rollback complexity beyond `prisma migrate resolve`/dropping the new table if reverted.

## Open Questions

- When `Program`/`Case` entities land, do "With Program"/"With Cases" become simple joins, or does "has an active program/case" need its own denormalized flag for query performance? Deferred until those entities exist.
- Does SSN eventually need encryption at rest (e.g. via application-level encryption before the Prisma write) ahead of a compliance review, or is masking + log redaction sufficient for the demo phase? Deferred — flagged as a follow-up.
