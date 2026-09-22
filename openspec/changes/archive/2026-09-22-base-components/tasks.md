## 1. packages/ui Scaffold

- [x] 1.1 Create `packages/ui` workspace package (package.json, tsconfig extending `@housing360/config`, build/lint scripts consistent with other packages) and add it as a dependency of `apps/web`.
- [x] 1.2 Set up Storybook (or equivalent isolated component preview tool) inside `packages/ui`, wired to run via a package script.
- [x] 1.3 Define the shared status-to-color map (used by `StatusBadge`) as a single exported module in `packages/ui`.

## 2. Reusable Components (packages/ui)

- [x] 2.1 Implement `KpiTile` (large number, label, optional muted sub-line; typed props) in its own file; support any tile count in a row.
- [x] 2.2 Implement `StatusBadge` (colored pill) driven by the shared status-to-color map from 1.3.
- [x] 2.3 Implement `FilterChipRow` (horizontal single-select pill toggles; active chip filled, rest outlined; enforces exactly one active chip).
- [x] 2.4 Implement `DataTable` (generic, column-configurable; optional inline row-actions slot for icon buttons).
- [x] 2.5 Implement `PageHeader` (title + optional action-button row).
- [x] 2.6 Reserve `StatusStepper`: create its file with a typed props interface (named stages, current-stage highlighting, support for a stage with multiple terminal branches) and a clear, obvious location in the package structure for its future implementation — no implementation logic required.
- [x] 2.7 Add a Storybook story/preview for each of `KpiTile`, `StatusBadge`, `FilterChipRow`, `DataTable`, `PageHeader`, and `StatusStepper` (including a 4-tile and a 5-tile `KpiTile` row story, and a multi-chip `FilterChipRow` story demonstrating single-select).

## 3. apps/api Auth Domain

- [x] 3.1 Add a `User` model to `prisma/schema.prisma` (alongside the existing `AppMeta` placeholder) for the seeded case-manager user, and run a migration.
- [x] 3.2 Add a seed script that creates the single seeded case-manager user (hashed password), documented in a package script (e.g. `prisma db seed` or equivalent).
- [x] 3.3 Add `.env`/`.env.example` entries needed for auth (JWT secret, cookie settings) without hardcoding secrets.
- [x] 3.4 Implement the `auth` domain following the existing layering convention: `routes/auth.ts → controllers/authController.ts → services/authService.ts`, covering login (issues JWT in an httpOnly cookie) and logout (clears the cookie).
- [x] 3.5 Implement `middlewares/auth.ts` that verifies the JWT cookie on protected routes and rejects/401s when missing or invalid, respecting the "no raw res.json/send outside responder.ts" rule (uses `sendError`/`AppError` per existing convention).
- [x] 3.6 Add a `GET /api/auth/me` endpoint (or equivalent) returning the current authenticated user's first name for the "Welcome, [First Name]" value, protected by the auth middleware.
- [x] 3.7 Verify layering/lint boundaries pass for the new `auth` files (`npm run lint`).

## 4. apps/web Auth Integration

- [x] 4.1 Add an `auth` slice to `src/store/slices/` (current user, authenticated flag, login/logout thunks) wired through `src/api/client.ts`.
- [x] 4.2 Build a login page/route (`/login`) that submits credentials to the API and updates auth state on success.
- [x] 4.3 Add a route guard that checks auth state before rendering any screen route (real or stub) and redirects to `/login` when unauthenticated.
- [x] 4.4 Wire logout (e.g. from the top bar settings icon or a dedicated control) to call the API logout endpoint and clear local auth state.
- [x] 4.5 Expose the "Welcome, [First Name]" value (from `GET /api/auth/me`) to the app shell/screens via the auth slice.

## 5. App Shell (apps/web)

- [x] 5.1 Define the nav item config (order, grouping/nesting, route stub vs. real route) as a typed static structure.
- [x] 5.2 Build the left navigation rail component: renders nav items/groups in order, nested items for Referrals and Shelter Management, Insights and Tools groups, active-route highlighting.
- [x] 5.3 Add the Referrals unread/open count badge, sourced from a stub selector/hook returning 0.
- [x] 5.4 Implement the collapse/expand toggle for the nav rail (icon-only width when collapsed).
- [x] 5.5 Build the top bar component: global search input (placeholder "Search clients, cases, referrals..."), notifications bell with unread-count badge, settings icon — handlers stubbed.
- [x] 5.6 Build the shared content-area template (page-title band → optional KPI tile row → main content) as a reusable layout component consuming `packages/ui`'s `KpiTile`/`PageHeader`.
- [x] 5.7 Wire the app shell (nav rail + top bar + content-area template) as the layout wrapper for all authenticated routes.

## 6. Routing

- [x] 6.1 Confirm/update routes for Home, My Clients, Cases, Assessments, Coordinated Entry to render inside the app shell and content-area template.
- [x] 6.2 Add route stubs (placeholder pages) for Resource Directory, Referrals (parent + Internal + Outbound), Shelter Management (parent + Beds + Daily Log), Insights (Data Quality, Reports), Tools (Data Import, Training), each mounted inside the app shell.
- [x] 6.3 Confirm the auth guard from 4.3 applies to every route added/updated in 6.1–6.2.

## 7. Verification

- [x] 7.1 Manually verify: unauthenticated request to a screen route redirects to `/login`; login with the seeded user succeeds and lands on a screen with "Welcome, [First Name]" visible; logout redirects back to `/login`.
- [x] 7.2 Manually verify: nav rail collapse/expand toggles correctly; Referrals badge renders 0; only implemented screens route to real pages, rest render stubs.
- [x] 7.3 Manually verify in the isolated preview tool: `KpiTile` renders correctly with 4 and 5 tiles in a row; `FilterChipRow` never has more than one active chip.
- [x] 7.4 Run `npm run lint` and `npm run build` from the repo root; confirm no layering-boundary violations and both apps build.
- [x] 7.5 Update `CLAUDE.md` to reflect what was actually built (packages/ui conventions, auth flow, app shell structure) per this repo's standing rule.
