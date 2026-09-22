# Housing360

Turborepo monorepo for the Housing360 rebuild: a Node.js/Express API (`apps/api`) and a React frontend (`apps/web`), sharing common packages.

## Structure

- `apps/web` — React 18, Vite, Tailwind CSS, Redux Toolkit, TypeScript.
- `apps/api` — Node.js, Express, TypeScript, Prisma (MySQL by default).
- `packages/ui` — shared, framework-agnostic React components (empty scaffold; built out in a later phase).
- `packages/types` — shared TypeScript types/interfaces used by both apps.
- `packages/config` — shared ESLint, Prettier, and base `tsconfig` configs.
- `docs/` — `Housing360_Portal.html` (the approved design reference) and `prompts.md` (the prompt sequence used to plan this rebuild).

## Prerequisites

- Node.js >= 20
- npm (this repo uses npm workspaces)
- A reachable MySQL database

## Environment setup

1. Copy `.env.example` to `.env` at the repo root and fill in real values:
   ```
   cp .env.example .env
   ```
2. `apps/api` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from this file to connect via Prisma. If those variables are the only database-related variables present, the engine defaults to MySQL — see `apps/api/src/config/database.ts`.
3. `apps/web` reads `VITE_API_BASE_URL` from the same root `.env` (Vite is configured with `envDir` pointing at the repo root) to know where the API is running.
4. Never commit `.env` — it's gitignored. `.env.example` documents every variable with no real values.

## Install

From the repo root:

```
npm install
```

## Run both apps

```
npm run dev
```

This runs Turborepo's `dev` pipeline, starting `apps/api` (default `http://localhost:4000`) and `apps/web` (default `http://localhost:5173`) together.

## Other commands

```
npm run build   # turbo build — builds every app/package
npm run lint     # turbo lint — includes the API's layering-boundary rules
npm run test      # turbo test
```

## Design reference & planning docs

- `docs/Housing360_Portal.html` — the approved design for the rebuild.
- `docs/prompts.md` — the prompt sequence used to plan and scope this rebuild.
- `openspec/changes/project-setup/` — the OpenSpec change (proposal, design, specs, tasks) that this scaffold was built from.
