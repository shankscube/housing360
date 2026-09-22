# Housing360 — context for Claude

> Keep this file current. After every `/opsx:apply` run (or any OpenSpec change
> implementation), update this file to reflect what was actually built —
> architecture, conventions, commands. Don't let it go stale.

## Standing rules for this repo

- **Never run `git commit` (or push) — the user commits their own work.** Don't ask for permission either; just leave changes in the working tree and, if useful, mention they're ready to commit.
- **Dev server hygiene**: if a dev server (`apps/api` and/or `apps/web`, or `turbo dev`) is already running when testing is needed, test against that one — don't start a second instance. If you start a server yourself for verification, stop it before ending the turn.
- `.env` holds real DB credentials. Never print its raw values (not even via `cat`/`xxd`/similar) — check presence/shape only (e.g. "is X set", key names, port reachability).

## What this repo is

Turborepo monorepo for the Housing360 rebuild: `apps/api` (Node/Express/TypeScript) + `apps/web` (React/Vite/TypeScript), sharing common packages. Built from the OpenSpec change `openspec/changes/project-setup/` (see `proposal.md`, `design.md`, `specs/project-scaffold/spec.md`, `tasks.md` there for full rationale).

## Structure

- `apps/web` — React 18, Vite, Tailwind, Redux Toolkit, TypeScript.
- `apps/api` — Node.js, Express, TypeScript, Prisma.
- `packages/types` — shared TS types/interfaces (`@housing360/types`), consumed by both apps.
- `packages/config` — shared ESLint (flat config), Prettier, and base `tsconfig` (`@housing360/config`).
- `docs/` — `Housing360_Portal.html` (approved design reference) and `prompts.md` (planning prompt sequence). Do not move/rename these.

## Backend conventions (apps/api)

- **Layering is enforced by lint, not just convention**: `routes/ → controllers/ → services/ → models/`. Only `services/` (and `models/` itself) may import from `models/`; this is a real ESLint rule (`packages/config/eslint/boundaries.js`, applied in `apps/api/eslint.config.js`), not just a folder-naming convention. Verified by deliberately breaking it during the original scaffold — it correctly failed lint.
- **No raw `res.json`/`res.send`/`res.end` outside `utils/responder.ts` and `middlewares/errorHandler.ts`** — also lint-enforced (same `boundaries.js`).
- **Response shape**: every endpoint goes through `src/utils/responder.ts` (`sendSuccess`/`sendError`) → `{ success, code, message, data }` or `{ success, code, message, errors }`. Controllers call `sendSuccess(...)` or `throw new AppError(...)` — they never build error responses inline. The centralized `src/middlewares/errorHandler.ts` is the only place failure responses get constructed.
- **Logging**: Pino + `pino-http` (`src/middlewares/requestLogger.ts`), structured, mounted before routes. Logs method/path/status/duration/request-id on every request. `no-console` is a lint error in this app.
- **Database**: MySQL via Prisma (default — see `src/config/database.ts` for the engine-detection logic that picks the engine from which `.env` vars are present; only MySQL is actually wired right now). Connection URL is assembled from `DB_HOST/PORT/USER/PASSWORD/NAME` in `.env`, never hardcoded, never logged. `src/config/loadEnv.ts` loads the **root** `.env` (not an `apps/api/.env`) via `dotenv`.
- **`prisma generate` runs via a `postinstall` script** in `apps/api/package.json` — required so a fresh `npm install` produces a working Prisma client before `dev`/`build` run. Don't remove this; without it, `turbo dev` crashes on first run after a fresh clone.
- `prisma/schema.prisma` currently has one placeholder model (`AppMeta`) purely because Prisma refuses to generate a client with zero models. Real domain models (clients, cases, assessments, ...) don't exist yet — that's future work.
- Only one real endpoint exists so far: `GET /health`, which does a live DB check (`SELECT 1`) and returns success/`503` accordingly.

## Frontend conventions (apps/web)

- **One Redux Toolkit slice per domain** in `src/store/slices/` (clients, cases, assessments, coordinatedEntry, dashboard) — no god slice. Combined in `src/store/index.ts`.
- **Single API client module**: `src/api/client.ts`. All thunks call through it — never `fetch` directly in a slice.
- **Theme is single-sourced**: `src/theme/tokens.ts` (colors/spacing/type scale) feeds `tailwind.config.ts`. Don't scatter inline hex/px values in components.
- **Vite reads the root `.env`** (not `apps/web/.env`) via `envDir: '../../'` in `vite.config.ts`. Frontend env vars must be prefixed `VITE_`.
- Route stubs exist for Home, My Clients, Cases, Assessments, Coordinated Entry (`src/routes/`) — all placeholders, verified to render with zero browser console errors.
- **UI components live in `src/components/`** (currently an empty scaffold). This used to be a separate `packages/ui` workspace package, but since `apps/web` is the only consumer, it was moved in-app to cut the unnecessary workspace-package overhead. Only pull it back out into a `packages/` workspace if a second consumer (another app, Storybook, etc.) actually shows up.

## Commands (from repo root)

```
npm install     # also runs apps/api's postinstall (prisma generate)
npm run dev       # turbo dev — both apps
npm run build      # turbo build
npm run lint        # turbo lint — includes the layering-boundary rule
npm run test          # turbo test
```

## Environment

Copy `.env.example` → `.env` at the repo root and fill in real values. Never commit `.env` (it's gitignored). See `.env.example` for the full documented variable list.
