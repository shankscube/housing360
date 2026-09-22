## Context

`apps/web` and `apps/api` currently exist only as scaffolding from `project-setup`: route stubs for Home/My Clients/Cases/Assessments/Coordinated Entry render with no shell around them, and `apps/api` has one real endpoint (`GET /health`) and no auth. This change is cross-cutting (new `packages/ui` workspace package, `apps/web` routing/layout/state, `apps/api` auth domain + a real Prisma model) and introduces the first real data model and the first cross-app shared package beyond `types`/`config`, so it warrants a design doc ahead of `base-components-screens`-style work that will build on top of it.

## Goals / Non-Goals

**Goals:**
- A single app shell (nav rail + top bar + content-area template) that every routed screen mounts inside, built once in `apps/web`.
- A `packages/ui` component library with typed, screen-agnostic components, previewable in isolation (Storybook or equivalent), that later screen batches can consume without reinventing markup.
- A working, minimal login gate: one seeded user, session or JWT auth, unauthenticated requests to any screen route redirect to `/login`.
- An obvious, empty home for `StatusStepper` in `packages/ui`'s structure so the Referrals module doesn't have to restructure the package later.

**Non-Goals:**
- Registration, password reset, multi-user management, roles/permissions — explicitly deferred.
- Real data behind the nav badge (Referrals unread count), search, notifications, or settings — these render and are wired to stub values/handlers only.
- Building the actual Resource Directory / Referrals / Shelter Management / Insights / Tools screens — those are route stubs (placeholder content) in this change; only Home, My Clients, Cases, Assessments, Coordinated Entry get real pages, and even those pages' real content is out of scope here beyond mounting the shared content-area template (this change is shell + components + auth, not the screens' business content).
- `StatusStepper`'s implementation — interface/props typing only.

## Decisions

**`packages/ui` as a real workspace package, not in-app components.** `CLAUDE.md` notes `apps/web/src/components` was intentionally chosen over a `packages/ui` workspace package because `apps/web` was the only consumer. This change reverses that for the *shared shell primitives* specifically because the proposal explicitly asks for `packages/ui`, and because these components (per the proposal) must have "no screen-specific logic" — they're designed as the reusable base for future consumers (Storybook, and potentially other surfaces later). `apps/web/src/components` remains for screen-specific composition; `packages/ui` holds only the generic primitives built in this change. Alternative considered: keep building in `apps/web/src/components` and revisit later — rejected because the proposal is explicit about `packages/ui`, and doing it now avoids a later cross-package migration once screens already depend on the components.

**Auth: JWT in an httpOnly cookie, not a client-stored token.** Session-vs-JWT was left open by the proposal ("session- or JWT-based"). JWT-in-httpOnly-cookie is chosen over a client-visible token (localStorage/Authorization header) because it avoids XSS-exfiltration risk with minimal extra work, and over server-side sessions because it avoids introducing a session store (Redis, DB-backed sessions) for a single-seeded-user demo phase — the token itself carries the identity, verified statelessly by middleware. Alternative considered: a DB-backed session table — rejected as unnecessary infrastructure for one demo user; can be revisited if real multi-user session management is needed later.

**Auth guard placement: route-level in `apps/web`, verified server-side on every API call.** The web app checks auth state (from a `/api/auth/me`-style call on load) before rendering protected routes and redirects to `/login` if absent/invalid; `apps/api` independently enforces the same check via middleware on protected routes, since the client-side redirect is a UX convenience, not a security boundary. Follows the existing layering convention (`routes/ → controllers/ → services/ → models/`): an `auth` middleware sits in `apps/api/src/middlewares/`, an `auth` service/controller pair follows the standard folders.

**Seeded user via Prisma seed script, first real model.** Adds a `User` (or similarly named) Prisma model alongside the existing placeholder `AppMeta`, plus a seed script run manually (documented in tasks), rather than a hardcoded in-memory user — keeps auth wired through the real DB/Prisma path (consistent with `src/config/database.ts`) instead of a throwaway shortcut that would need rework later.

**Nav structure and badge as static config + one stub data hook.** The nav's item list (including nesting and the Referrals badge) is defined as a typed static config in `apps/web` (not `packages/ui`, since it's app/navigation-specific, not a generic component), with the Referrals count sourced from a small stub hook/selector returning `0` — isolating the one spot that later gets wired to real data.

**Storybook (or equivalent) scoped to `packages/ui` only.** Each component built in this change gets a story/preview; `StatusStepper` gets a story showing its reserved shape (e.g., a static/disabled preview) even without real implementation, satisfying "isolated preview for each shared component."

## Risks / Trade-offs

- [Introducing `packages/ui` as a build-order dependency for `apps/web`] → Mitigation: keep it a simple TS/React component package consumed via the existing workspace resolution (same pattern as `@housing360/types`); no separate build step beyond what Turborepo already orchestrates for workspace packages.
- [JWT httpOnly cookie requires CORS/cookie config care between `apps/web` (Vite dev server) and `apps/api` (Express) in local dev] → Mitigation: document required `.env` values (cookie domain/secure flag behavior in dev vs. prod) in `.env.example`; verify login round-trip manually during apply.
- [Seeding the first real Prisma model changes `schema.prisma` away from the placeholder-only state] → Mitigation: keep `AppMeta` as-is (still needed per its original constraint), add the new model alongside it; run `prisma migrate` as part of apply, documented in tasks.
- [Scope creep: reusable components could easily grow screen-specific props once screen work starts] → Mitigation: enforce "no screen-specific logic" at review time in this change; defer any screen-specific variant needs to the screen-batch changes that consume these components.

