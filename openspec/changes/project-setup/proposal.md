## Why

The Housing360 rebuild needs a monorepo foundation before any feature work can start. Without an enforced layering pattern, a consistent API response shape, and shared config, the API and frontend will drift into inconsistent conventions as multiple contributors build out clients, cases, assessments, and coordinated-entry modules in parallel. Standing this scaffold up now — with the layering and conventions enforced by tooling rather than left to code review — prevents that drift from the first commit.

## What Changes

- Initialize a Turborepo monorepo with `apps/web`, `apps/api`, `packages/ui`, `packages/types`, `packages/config`, keeping the existing `docs/` (design file + prompt sequence) untouched.
- Scaffold `apps/api` (Node.js/Express/TypeScript) with enforced routes → controllers → services → models layering, a shared responder utility, structured request logging middleware, centralized error-handling middleware, and a `GET /health` endpoint that checks the DB connection.
- Wire the API's ORM to the root `.env` DB variables, auto-detecting the engine from the variables present, defaulting to MySQL + Prisma when ambiguous. No credentials hardcoded or logged.
- Scaffold `apps/web` (React 18/Vite/Tailwind/Redux Toolkit/TypeScript) with one Redux slice per domain module, a single Tailwind theme file, route stubs for Home/My Clients/Cases/Assessments/Coordinated Entry, and a single API client module that all thunks go through.
- Scaffold `packages/ui` (empty component library shell) and `packages/types` (shared TS types consumed by both apps).
- Scaffold `packages/config` with shared ESLint, Prettier, and base tsconfig, consumed by both apps instead of per-app duplicate config.
- Add root `.env.example`, root `README.md`, and a root `turbo.json` with `dev`, `build`, `lint`, `test` pipelines covering both apps.

## Capabilities

### New Capabilities
- `project-scaffold`: The monorepo structure, backend layering/response/logging/error-handling conventions, and frontend store/routing/API-client conventions that every future Housing360 feature is built on top of.

### Modified Capabilities
- None — this is a greenfield repository with no existing specs.

## Impact

- **New code**: entire repo structure (`apps/web`, `apps/api`, `packages/ui`, `packages/types`, `packages/config`, root config files). No existing code is modified.
- **Dependencies introduced**: Express, Prisma (default ORM), React 18, Vite, Tailwind CSS, Redux Toolkit, Turborepo, plus shared ESLint/Prettier/TypeScript tooling.
- **Environment**: root `.env` is read for DB connection details; `.env.example` documents required variables with no real values.
- **Systems**: establishes the layering and conventions (responder shape, logging, repository pattern, slice-per-module, single API client) that all subsequent Housing360 feature changes must follow.
