# Housing360 — context for Claude

> Keep this file current. After every `/opsx:apply` run (or any OpenSpec change
> implementation), update this file to reflect what was actually built —
> architecture, conventions, commands. Don't let it go stale.

## Standing rules for this repo

- **Never run `git commit` (or push) — the user commits their own work.** Don't ask for permission either; just leave changes in the working tree and, if useful, mention they're ready to commit.
- **Dev server hygiene**: if a dev server (`apps/api` and/or `apps/web`, or `turbo dev`) is already running when testing is needed, test against that one — don't start a second instance. If you start a server yourself for verification, stop it before ending the turn.
- `.env` holds real DB credentials. Never print its raw values (not even via `cat`/`xxd`/similar) — check presence/shape only (e.g. "is X set", key names, port reachability).
- **All UI/frontend code lives in `apps/web` — never in a `packages/*` workspace package.** This was a deliberate call, made twice now (once during `project-setup`, reversed once during `base-components`, then corrected back): `apps/web` is the only consumer, so a separate `packages/ui` just adds workspace-package overhead (its own `package.json`, tsconfig, lint config, dependency wiring, Tailwind content-glob coordination) for zero actual sharing benefit. Reusable, screen-agnostic components (`KpiTile`, `StatusBadge`, etc.) belong in `apps/web/src/components/ui/`; the isolated component-preview tool belongs in `apps/web/ui-preview/`. Only pull UI code out into a `packages/` workspace if a second real consumer (another app, a design-system package published elsewhere, etc.) actually shows up — not preemptively "in case." If you're about to run `openspec new change` or otherwise plan work that touches shared components, route them through `apps/web`, not a new package.

## What this repo is

Turborepo monorepo for the Housing360 rebuild: `apps/api` (Node/Express/TypeScript) + `apps/web` (React/Vite/TypeScript), sharing common packages. Scaffolded by the OpenSpec change `openspec/changes/archive/2026-09-22-project-setup/` (specs synced to `openspec/specs/project-scaffold/`). The shared app shell, reusable UI components, and minimal auth were added by `openspec/changes/archive/2026-09-22-base-components/` (specs synced to `openspec/specs/shared-ui/` and `openspec/specs/auth/`) — see that change's `proposal.md`/`design.md`/`specs/` for full rationale. Note: that change's own `design.md` argued for a separate `packages/ui` component package; that call was overridden after archiving — see the standing rule above — so `packages/ui` no longer exists. Trust the current spec/CLAUDE.md over that historical design doc.

## Structure

- `apps/web` — React 18, Vite, Tailwind, Redux Toolkit, TypeScript. Owns **all** UI/frontend code, including the shared component library (`src/components/ui/`) — see the standing rule above.
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
- `prisma/schema.prisma` has two models: the placeholder `AppMeta` (kept purely because Prisma refuses to generate a client with zero models) and `User` — the single seeded case-manager demo user (`id`, `email`, `passwordHash`, `firstName`, `lastName`; no roles/permissions field — out of scope for this phase). Real domain models (clients, cases, assessments, ...) still don't exist — that's future work.
- Endpoints so far: `GET /health` (live DB check via `SELECT 1`, success/`503`), and the `auth` domain mounted at `/auth` (not `/api/auth` — this app has no `/api` prefix, matching the `/health` precedent): `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (protected).
- **Auth**: JWT in an httpOnly, `SameSite=Lax` cookie (name from `COOKIE_NAME` env var), not a client-visible token or server-side session store — see `openspec/changes/archive/2026-09-22-base-components/design.md` for why. `src/services/auth.service.ts` issues/verifies the JWT (bcrypt via `bcryptjs`, not native `bcrypt`, to avoid a node-gyp build step); `src/middlewares/auth.ts` (`requireAuth`) verifies the cookie on protected routes and populates `req.user`, 401-ing via `AppError`/`sendError` like any other layer — it does **not** bypass the responder convention. `apps/api/prisma/seed.ts` (`npm run seed` in `apps/api`, or `prisma db seed`) creates the one demo user from `SEED_USER_EMAIL`/`SEED_USER_PASSWORD`/`SEED_USER_FIRST_NAME`/`SEED_USER_LAST_NAME` env vars — never hardcoded. `cors` is configured with `credentials: true` and `origin` locked to `WEB_ORIGIN` (the Vite dev origin) so the cookie can flow cross-port in dev.
- The `AuthenticatedUser` shape is defined once in `packages/types/src/auth.ts` and imported by both apps — don't redefine it locally on either side.

## Frontend conventions (apps/web)

- **One Redux Toolkit slice per domain** in `src/store/slices/` (auth, clients, cases, assessments, coordinatedEntry, dashboard) — no god slice. Combined in `src/store/index.ts`.
- **Single API client module**: `src/api/client.ts`. All thunks call through it — never `fetch` directly in a slice. It sends `credentials: 'include'` on every request so the auth cookie flows to `apps/api`.
- **Theme is single-sourced**: `src/theme/tokens.ts` (colors/spacing/type scale) feeds `tailwind.config.ts`. Don't scatter inline hex/px values in components. `tailwind.config.ts`'s `content` glob only needs `./src/**/*.{ts,tsx}` — since all UI code (including the shared component library) lives under `apps/web/src`, there's no cross-package glob to keep in sync.
- **Vite reads the root `.env`** (not `apps/web/.env`) via `envDir: '../../'` in `vite.config.ts`. Frontend env vars must be prefixed `VITE_`.
- **App shell** (`src/components/layout/`): `AppShell.tsx` (nav rail + top bar + `<Outlet/>`, holds the collapse/expand state), `NavRail.tsx` (reads the static `navConfig.ts` item list; collapses to icon-only width), `TopBar.tsx` (search/notifications/settings stubs + "Welcome, [First Name]" + logout), `ContentAreaTemplate.tsx` (page-title band → optional KPI row → content; every routed screen renders through this, built from `../ui`'s `PageHeader`/`KpiTile`). `useReferralsBadgeCount.ts` is a stub hook returning `0` until the Referrals module wires up real data.
- **Auth-gated routing**: `src/routes/RouteGuard.tsx` wraps every screen route (real or stub) in `AppRoutes.tsx`; it dispatches `fetchCurrentUser` once on mount and redirects to `/login` (`src/routes/pages/LoginPage.tsx`) when unauthenticated. `/login` itself is the only route outside the guard.
- Real screens: Home, My Clients, Cases, Assessments, Coordinated Entry (`src/routes/pages/`) — each just mounts `ContentAreaTemplate`; business content is still future work. Everything else in the nav (Resource Directory, Referrals + Internal/Outbound, Shelter Management + Beds/Daily Log, Insights, Tools) is a `PlaceholderPage` route stub, wired in `AppRoutes.tsx`.
- **`src/components/ui/` is the home for generic, screen-agnostic components** (`KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, reserved `StatusStepper`) — each in its own file, re-exported from `src/components/ui/index.ts` (and from `src/components/index.ts`). `src/components/layout/` stays for the app-specific shell (not generic/reusable elsewhere). Only add something to `src/components/ui/` if it has no screen-specific logic and a typed props interface — per the standing rule above, this directory is **not** a candidate for extraction into a `packages/*` workspace unless a genuine second consumer shows up.
- **`StatusBadge` colors come from one map** (`src/components/ui/status/statusColors.ts`, `STATUS_COLOR_MAP`) keyed by semantic tone (`urgent`/`warning`/`success`/`neutral`) — never hardcode a badge color at the call site.
- **Component preview tool**: `npm run ui-preview` in `apps/web` (Vite + Tailwind, port 6006) — a lightweight Storybook-equivalent gallery (`apps/web/ui-preview/`), a separate Vite root/build from the main app but still inside `apps/web`, not actual Storybook (kept intentionally light). Every component has a story under `ui-preview/stories/`. Its `tailwind.config.ts` imports the real `../src/theme/tokens` directly (no duplicated palette — safe now that it's all one package). Two gotchas if you touch this: (1) Tailwind resolves relative `content` globs against `process.cwd()`, not the config file's own directory, and the npm script's cwd is `apps/web` not `ui-preview/` — that's why the globs are built from `__dirname` and `ui-preview/postcss.config.js` passes an explicit absolute `config` path to the `tailwindcss` plugin; (2) `apps/web/package.json` has `"type": "module"`, so any nested `.js` config file (like `ui-preview/postcss.config.js`) must use `export default`/`import`, not `module.exports`/`require` — apps/web's own root `postcss.config.js` already does this, follow that pattern.

## Commands (from repo root)

```
npm install     # also runs apps/api's postinstall (prisma generate)
npm run dev       # turbo dev — both apps
npm run build      # turbo build
npm run lint        # turbo lint — includes the layering-boundary rule
npm run test          # turbo test
```

From `apps/api`: `npm run seed` seeds the one demo case-manager user (needs `SEED_USER_*` env vars set). From `apps/web`: `npm run ui-preview` serves the component preview gallery at `http://localhost:6006` (distinct from `npm run preview`, which is Vite's standard production-build preview).

## Environment

Copy `.env.example` → `.env` at the repo root and fill in real values. Never commit `.env` (it's gitignored). See `.env.example` for the full documented variable list — now includes `JWT_SECRET`/`JWT_EXPIRES_IN`/`COOKIE_NAME`/`WEB_ORIGIN` (auth) and `SEED_USER_*` (seed script only, not used by the running app).
