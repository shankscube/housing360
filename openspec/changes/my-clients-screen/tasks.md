## 1. Shared Types

- [ ] 1.1 Add `DisclosureStatus` union (`'provided' | 'client_doesnt_know' | 'prefers_not_to_answer' | 'data_not_collected'`) and generic `DisclosureField<T>` type to `packages/types/src/clients.ts`
- [ ] 1.2 Replace the stub `Client` interface in `packages/types/src/clients.ts` with the full shape: HUD Universal Data Elements (name, sex, race and ethnicity as plain fields; SSN and DOB as `DisclosureField<string>`), `householdId`, `isHeadOfHousehold`, timestamps
- [ ] 1.3 Add a `ClientListItem` (or equivalent) type omitting SSN and DOB entirely, for list-endpoint responses
- [ ] 1.4 Add request/response types for create (including `confirmDuplicate` and the `duplicates_found`/`created` response variants), update, and the list filter/query params

## 2. Database Schema

- [ ] 2.1 Add `Sex` and `DisclosureStatus` enums and a `Client` model to `apps/api/prisma/schema.prisma` per design.md's two-column-per-disclosure-field pattern (`ssn`/`ssnDisclosure`, `dob`/`dobDisclosure`), plus `householdId`, `isHeadOfHousehold`, name, race and ethnicity
- [ ] 2.2 Run `prisma migrate dev` to generate and apply the migration; verify `prisma generate` produces a working client

## 3. API — Models Layer

- [ ] 3.1 Create `apps/api/src/models/client.model.ts` with Prisma query functions: paginated list with filter/search support, find by id, find-candidates-for-duplicate-check (name + DOB + SSN match), create, update, find-head-of-household-by-householdId
- [ ] 3.2 Add mapper helpers (in the model or a small adjacent module) converting between the flat Prisma row shape and the `DisclosureField<T>` shape used at the API boundary

## 4. API — Services Layer

- [ ] 4.1 Create `apps/api/src/services/client.service.ts`: `listClients(query)` applying filter (all/male/female/withProgram/withoutProgram/withCases/withoutCases per design.md's current-scope rules) + search + pagination, returning list-safe fields only
- [ ] 4.2 Add `getClientById(id)` returning full detail (including SSN/DOB), throwing `AppError(404, ...)` when not found
- [ ] 4.3 Add `createClient(input)`: run the name+DOB+SSN duplicate check; if candidates exist and `confirmDuplicate` is not `true`, return `{ status: 'duplicates_found', candidates }` without writing; otherwise create and return `{ status: 'created', client }`
- [ ] 4.4 Enforce exactly one head of household per `householdId` in `createClient`/`updateClient` (reject with `AppError(409, ...)` on conflict)
- [ ] 4.5 Add `// TODO(household-duplicate-alert)` comment at the point where a cross-household duplicate-person check would go, per the proposal's carried-forward gap
- [ ] 4.6 Add `updateClient(id, input)` supporting partial updates including disclosure fields

## 5. API — Controllers & Routes

- [ ] 5.1 Create `apps/api/src/controllers/client.controller.ts` with handlers for list/detail/create/update, each validating input and calling through to the service, using `sendSuccess`/`AppError` exclusively (no inline error construction)
- [ ] 5.2 Create `apps/api/src/routes/client.routes.ts` mounting `GET /`, `GET /:id`, `POST /`, `PATCH /:id`
- [ ] 5.3 Mount the client router at `/api/clients` in `apps/api/src/routes/index.ts` (first `/api`-prefixed route group in the app)
- [ ] 5.4 Verify the layering lint rule (`boundaries.js`) passes — controllers must not import `models/` directly, only `services/`

## 6. Logging Safety

- [ ] 6.1 Add `redact` paths to the Pino config in `apps/api/src/utils/logger.ts` covering `req.body.ssn`, `req.body.dob`, and equivalent nested paths, so intake/update request bodies never leak SSN/DOB into logs
- [ ] 6.2 Audit `client.service.ts`/`client.controller.ts` for any `logger.*` calls that pass a full client object, and change them to log by `id` only

## 7. Frontend — API Client & Redux Slice

- [ ] 7.1 Add `listClients`, `getClient`, `createClient`, `updateClient` calls to `apps/web/src/api/client.ts`
- [ ] 7.2 Rewrite `apps/web/src/store/slices/clientsSlice.ts` with `{ list, detail, intakeForm }` sub-state and dedicated reducers/thunks per design.md (list filter/page/search reducers, detail select/clear, intake field-set/duplicate-candidates/reset), replacing the current single-`items` stub
- [ ] 7.3 Wire the three thunks (`fetchClients`, `fetchClientById`, `createClient`) into the slice's `extraReducers`

## 8. Frontend — My Clients Screen

- [ ] 8.1 Build the My Clients page in `apps/web/src/routes/pages/MyClientsPage.tsx`: `PageHeader` with a "New Intake" action, `FilterChipRow` wired to the slice's list filter (All/Male/Female/With Program/Without Program/With Cases/Without Cases), a search input, and a `DataTable` (Name, SSN masked to last 4, DOB, Sex, Race and Ethnicity)
- [ ] 8.2 Add a column-visibility control (local component state only, per design.md) letting the user toggle which `DataTable` columns render — avoid the terms "Fields to Display" or any Salesforce reference in code/comments/UI copy
- [ ] 8.3 Match the visual styling of the My Clients screen in `docs/Housing360 Portal.html`

## 9. Frontend — New Intake Form

- [ ] 9.1 Build the New Intake form component (HUD Universal Data Elements, household assignment, disclosure-field inputs for SSN/DOB with the four-state control)
- [ ] 9.2 Wire submit to call `createClient` without `confirmDuplicate`; on a `duplicates_found` response, render the candidates and require explicit user confirmation before re-submitting with `confirmDuplicate: true`
- [ ] 9.3 On a `created` response, close the form and refresh/update the client list

## 10. Verification

- [ ] 10.1 `npm run lint` — confirm layering and no-raw-response-methods rules pass for the new API files
- [ ] 10.2 `npm run build` — confirm both apps and `packages/types` build with the updated `Client` type
- [ ] 10.3 Manually verify: list response omits SSN/DOB; detail response includes them; duplicate check blocks a silent double-create and confirms-through works; a disclosure field round-trips all four states; filters combine with search; SSN renders masked in the UI
