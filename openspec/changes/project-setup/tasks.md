## 1. Repo & workspace root

- [x] 1.1 `git init` the repository and create a root `.gitignore` (node_modules, dist/build output, `.env`, turbo cache)
- [x] 1.2 Create root `package.json` with npm workspaces (`apps/*`, `packages/*`) and Turborepo as a dev dependency
- [x] 1.3 Create root `turbo.json` with `dev`, `build`, `lint`, `test` pipeline tasks wired for both `apps/web` and `apps/api`
- [x] 1.4 Commit the empty workspace skeleton before scaffolding packages

## 2. packages/config (shared tooling)

- [x] 2.1 Scaffold `packages/config` package.json
- [x] 2.2 Add shared base ESLint config, including the layering-boundary rule (controllers cannot import `models/**`; only `services/**` may import `models/**`) and a `no-console` rule
- [x] 2.3 Add shared Prettier config
- [x] 2.4 Add shared base `tsconfig.json` plus node and react variants for apps to extend

## 3. packages/types

- [x] 3.1 Scaffold `packages/types` package.json and tsconfig extending `packages/config`
- [x] 3.2 Add initial shared type placeholders for the domain modules (clients, cases, assessments, coordinatedEntry, dashboard) that both apps can import

## 4. packages/ui (empty scaffold)

- [x] 4.1 Scaffold `packages/ui` package.json (React peer dependency) and tsconfig extending `packages/config`
- [x] 4.2 Add a minimal placeholder export and confirm the package builds via `turbo build` with no components implemented yet

## 5. apps/api — foundation

- [x] 5.1 Scaffold `apps/api` package.json, tsconfig (extending `packages/config`), and Express + TypeScript entrypoint
- [x] 5.2 Create `routes/ → controllers/ → services/ → models/` folder structure and confirm the ESLint layering rule fails on a deliberate controller→model import, then remove the deliberate violation
- [x] 5.3 Add `src/config/env.ts` to read and validate required env vars (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) without ever logging their raw values

## 6. apps/api — database wiring

- [x] 6.1 Add `src/config/database.ts` implementing engine detection from `.env` variables present, defaulting to MySQL when ambiguous
- [x] 6.2 Install Prisma, initialize `prisma/schema.prisma` with `provider = "mysql"`, and generate the client
- [x] 6.3 Wire the Prisma datasource URL from the validated env config (no hardcoded credentials)

## 7. apps/api — cross-cutting middleware

- [x] 7.1 Add `src/utils/responder.ts` with `sendSuccess`/`sendError` producing the `{ success, code, message, data }` / `{ success, code, message, errors }` shapes
- [x] 7.2 Add Pino + `pino-http` structured logging middleware (method, path, status, duration, request id) mounted before route registration
- [x] 7.3 Add `AppError` class and centralized error-handling middleware mounted last; confirm controllers only throw, never format error responses inline
- [x] 7.4 Wire the ESLint config to flag any direct `res.json`/`res.send` call outside `utils/responder.ts` and the error middleware

## 8. apps/api — health check & smoke test

- [x] 8.1 Add `GET /health` route → controller → service that runs a DB connectivity check (e.g. `SELECT 1`) and returns success/failure via the responder
- [x] 8.2 Start the API standalone and verify `/health` returns a successful response shape with the DB reachable, and a failure response shape when the DB is unreachable

## 9. apps/web — foundation

- [x] 9.1 Scaffold `apps/web` with Vite + React 18 + TypeScript, tsconfig extending `packages/config`
- [x] 9.2 Install and configure Tailwind CSS; create `src/theme/tokens.ts` (colors, spacing, type scale) and wire it into `tailwind.config.ts`
- [x] 9.3 Install Redux Toolkit and React Router

## 10. apps/web — store

- [x] 10.1 Create `src/store/slices/{clients,cases,assessments,coordinatedEntry,dashboard}Slice.ts`, one domain per file
- [x] 10.2 Create `src/store/index.ts` combining all slices into the store
- [x] 10.3 Create `src/api/client.ts` as the single API client module; wire each slice's thunks to call through it (no direct `fetch` calls in thunks)

## 11. apps/web — routing

- [x] 11.1 Create placeholder page components for Home, My Clients, Cases, Assessments, Coordinated Entry
- [x] 11.2 Wire React Router with routes for all five pages
- [x] 11.3 Run the dev server, navigate to each route, and confirm no browser console errors

## 12. Root environment & docs

- [x] 12.1 Create root `.env.example` documenting every variable `apps/api` and `apps/web` expect, with no real values
- [x] 12.2 Write root `README.md`: how to install, how to configure `.env`, how to run both apps, and where `docs/Housing360_Portal.html` and `docs/prompts.md` live
- [x] 12.3 Confirm `docs/Housing360_Portal.html` and `docs/prompts.md` were not moved or renamed during scaffolding

## 13. End-to-end validation

- [x] 13.1 Run `turbo lint` across the workspace and confirm it passes, including the layering-boundary and no-console/no-raw-response rules
- [x] 13.2 Run `turbo build` across the workspace and confirm every app/package builds, including empty `packages/ui`
- [x] 13.3 From a fresh clone (or a clean simulated checkout) with only `.env` filled in from `.env.example`, run install and then `turbo dev`, and confirm both `apps/web` and `apps/api` start cleanly with no manual steps beyond install and `.env` setup
