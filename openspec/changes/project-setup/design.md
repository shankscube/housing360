## Context

`D:\Projects\Internal\housing360` is currently an empty, non-git working directory containing only `.env` (DB credentials, unread here beyond variable names) and `docs/` (`Housing360_Portal.html` — the approved design reference — and `prompts.md`). Nothing else exists yet: no package manager files, no source, no git history. This design covers standing up the entire monorepo from scratch.

The root `.env` currently defines only generic variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. There is no engine-identifying variable (no `DATABASE_URL` with a scheme, no `MONGODB_URI`, no `DB_ENGINE`), so per the proposal's instruction this is the "ambiguous" case and the ORM defaults to MySQL via Prisma.

Constraint: `docs/Housing360_Portal.html` and `docs/prompts.md` must not be moved or renamed.

## Goals / Non-Goals

**Goals:**
- A working Turborepo monorepo (`apps/web`, `apps/api`, `packages/types`, `packages/config`) that runs cleanly end-to-end via `turbo dev` from a fresh clone with only `.env` filled in.
- Backend layering (routes → controllers → services → models) enforced by tooling (lint rule), not just folder naming convention.
- One consistent success/error response shape used by every endpoint, one structured logger applied to every endpoint, one centralized error handler.
- Frontend conventions (slice-per-domain, single theme source, single API client module, routed page stubs) in place so future feature work has an obvious, consistent place to land.

**Non-Goals:**
- Building out real shared UI components — this phase creates an empty `apps/web/src/components/` scaffold only.
- Implementing actual business logic for clients/cases/assessments/coordinated entry/dashboard — only the empty slice files, route stubs, and layering scaffolding.
- Authentication/authorization — out of scope for this scaffold.
- Choosing/provisioning an actual MySQL server — `.env` is expected to point at a database the developer already has running; this change only wires the connection.

## Decisions

**Package manager & workspaces: npm workspaces (not pnpm/yarn).**
Turborepo is package-manager-agnostic. npm ships with Node and needs no extra global install, minimizing onboarding friction for a fresh clone — directly relevant to the "runs cleanly from a fresh clone" exit criterion. Trade-off: npm installs/caches less efficiently than pnpm at scale, acceptable for a 5-workspace monorepo.

**ORM: Prisma, engine MySQL.**
The proposal requires reading DB config from `.env` and detecting the engine from the variables present. The current `.env` has only generic `DB_*` variables with no scheme or engine hint, which is the defined "ambiguous" case, so `apps/api/prisma/schema.prisma` is generated with `provider = "mysql"`. The Prisma connection URL is assembled at runtime from `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` in `apps/api/src/config/env.ts` (never logged), rather than requiring a separate `DATABASE_URL`. Detection logic lives in `apps/api/src/config/database.ts`: it inspects which `.env` keys are present (e.g. a future `MONGODB_URI` or a `DATABASE_URL` prefixed `postgres://`/`mysql://`) and only falls back to the MySQL default when none of those signals are present. This keeps the door open for a future engine switch without a rewrite — swapping providers is a schema.prisma + config change, not an architectural one.
Alternative considered: fully dynamic multi-ORM abstraction (e.g. Knex with pluggable dialect) to avoid ever hardcoding a provider. Rejected as premature — Prisma's typed client is worth committing to now, and the detection module isolates the one place that would need to change.

**Repository-pattern enforcement: ESLint boundary rule, not just folder convention.**
`packages/config/eslint` ships a rule (via `eslint-plugin-boundaries` or an equivalent `no-restricted-imports` pattern) that fails lint if anything under `apps/api/src/controllers/**` imports from `apps/api/src/models/**` directly, and if anything outside `apps/api/src/services/**` imports from `models/**`. This is enforced in the `lint` turbo pipeline, which CI/`turbo build` depends on, so a layering violation fails fast rather than relying on code review to catch it — directly satisfying "enforced (not just documented)."
Alternative considered: a custom AST codemod/test that scans import graphs. Rejected as heavier than necessary; an ESLint rule is enforced automatically at the same point every other lint violation is, with editor-level feedback.

**Structured logging: Pino + `pino-http`.**
Pino is low-overhead structured JSON logging, applied as Express middleware (`pino-http`) mounted once, before route registration, so every endpoint gets method, path, status, duration, and a per-request id (via `pino-http`'s `genReqId`, using `crypto.randomUUID()`) without each controller doing anything. `console.log` is disallowed via the shared ESLint config (`no-console` error in `apps/api`).
Alternative considered: Winston. Pino chosen for lower overhead and first-class request-id support via `pino-http`.

**Responder utility: single module, no per-controller shaping.**
`apps/api/src/utils/responder.ts` exports `sendSuccess(res, { code, message, data })` → `{ success: true, code, message, data }` and is the only place that shape is constructed. Centralized error middleware is the only place `{ success: false, code, message, errors }` is constructed, from a thrown `AppError` (or generic 500 fallback). Controllers only ever call `sendSuccess(...)` or `throw new AppError(...)`; they never call `res.json` directly. The ESLint config disallows raw `res.json`/`res.send` calls outside `utils/responder.ts` and the error middleware.

**Frontend state: one RTK slice file per domain, combined in one store index.**
`apps/web/src/store/slices/{clients,cases,assessments,coordinatedEntry,dashboard}Slice.ts`, each with its own initial state/reducers/thunks, combined in `apps/web/src/store/index.ts`. Thunks in every slice call into `apps/web/src/api/client.ts` (a thin fetch wrapper reading the API base URL from Vite env) rather than calling `fetch` directly — this is the "one API client layer" the proposal requires.

**Tailwind theme: single token file.**
`apps/web/src/theme/tokens.ts` defines colors/spacing/type scale and is imported into `tailwind.config.ts`'s `theme.extend`. Components reference Tailwind utility classes (which resolve to these tokens) rather than inline hex/pixel values; this is enforced by convention + code review here (no lint rule for "no inline hex in JSX" is introduced in this scaffold — flagged as a residual risk below).

**Shared config package (`packages/config`) over per-app duplication.**
ESLint config, Prettier config, and base `tsconfig.json` live once in `packages/config` and are extended by `apps/web`, `apps/api`, and other packages. Avoids drift between app-level lint/format rules, which is what makes the layering and no-raw-`res.json` rules above actually apply repo-wide instead of per-app.

**UI components: in-app (`apps/web/src/components/`), not a separate `packages/ui` workspace.**
Originally scaffolded as a standalone `packages/ui` workspace package for future framework-agnostic reuse. Revised: `apps/web` is the only consumer today, and nothing else in the monorepo needs a React component library, so a separate workspace package only added install/build/lint overhead (its own `package.json`, `tsconfig.json`, ESLint config, and a `turbo build`/`lint` node) with zero actual sharing happening. Moved in-app instead.
Alternative considered: keep `packages/ui` for anticipated future reuse (e.g. a second frontend, Storybook). Rejected for now — premature; pull components back out into a workspace package if and when a second real consumer appears, which is a low-cost move (the components themselves don't need to change, just their package boundary).

## Risks / Trade-offs

- **[Risk]** Defaulting to MySQL when `.env` is ambiguous could be wrong if the team actually intends Postgres or another engine. → **Mitigation**: the engine-detection module and its default are isolated in one file (`apps/api/src/config/database.ts`) plus `schema.prisma`'s `provider` field; README documents how to switch. Low-cost to change before real data exists.
- **[Risk]** ESLint-based layering enforcement only catches violations when lint runs (pre-commit hook or CI), not at runtime. → **Mitigation**: `lint` is a `turbo.json` pipeline task; task list requires `turbo lint` to pass as part of scaffold completion, and README instructs running it before every PR.
- **[Risk]** No lint rule enforces "no inline hex values" in frontend components, only the theme-token convention. → **Mitigation**: documented as a known gap in README/tasks; acceptable for an initial scaffold with only placeholder pages and no real UI yet.
- **[Risk]** `apps/web/src/components/` being an empty scaffold means nothing currently validates a real component being consumed end-to-end. → **Mitigation**: scaffold it with a minimal placeholder export so the location is provably wired into the app's build/lint even though empty.
- **[Risk]** Working directory is not yet a git repository, so there's no version-control safety net while scaffolding. → **Mitigation**: `git init` plus an initial commit is the first task, before any scaffolding files are generated, so all subsequent scaffold work is reversible.

## Migration Plan

Greenfield — no existing app to migrate. Rollout order (detailed in tasks.md):
1. `git init` + root workspace files (`package.json`, `turbo.json`, `.gitignore`).
2. `packages/config` (lint/prettier/tsconfig bases) — everything else depends on it.
3. `packages/types` (empty scaffold).
4. `apps/api` (layering, responder, logger, error handler, health check, Prisma+MySQL wiring).
5. `apps/web` (store/slices, theme, routes, API client, `src/components/` scaffold).
6. Root `.env.example` and `README.md`.
7. Validate `turbo dev` runs both apps cleanly from a fresh install with only `.env` filled in.

Rollback: since this is the first commit(s) in a new repo, rollback is `git reset`/deleting the branch — no production system is affected.

## Open Questions

- Should shared UI components move to a dedicated `packages/ui` workspace and/or ship Storybook once a second consumer exists? This design keeps them in-app (`apps/web/src/components/`, no Storybook) until that happens — revisit when component work starts or a second consumer appears.
- Is MySQL actually the intended production engine, or is `.env` just incomplete? This design proceeds with the documented default (MySQL + Prisma) per the proposal's explicit instruction; confirm with whoever owns the `.env` before real data/migrations are written.
