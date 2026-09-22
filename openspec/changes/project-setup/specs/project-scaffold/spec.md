## ADDED Requirements

### Requirement: Monorepo structure
The system SHALL provide a Turborepo monorepo containing `apps/web`, `apps/api`, `packages/ui`, `packages/types`, `packages/config`, and the existing `docs/` directory untouched, with a root `turbo.json` defining `dev`, `build`, `lint`, and `test` pipelines that cover both `apps/web` and `apps/api`.

#### Scenario: Fresh clone boots both apps
- **WHEN** a developer clones the repo, fills in only the root `.env` from `.env.example`, installs dependencies, and runs `turbo dev`
- **THEN** both `apps/web` and `apps/api` start successfully with no manual steps beyond dependency install and `.env` population

#### Scenario: docs directory is preserved
- **WHEN** the monorepo is scaffolded
- **THEN** `docs/Housing360_Portal.html` and `docs/prompts.md` remain at their original paths, unmoved and unrenamed

### Requirement: Repository-pattern layering is enforced
The API SHALL structure request handling as routes → controllers → services → models, and this layering SHALL be enforced by lint tooling such that a controller importing from a model module directly fails lint, not merely violates a documented convention.

#### Scenario: Controller imports a model directly
- **WHEN** a controller file under `apps/api/src/controllers/` contains an import from a path under `apps/api/src/models/`
- **THEN** running the lint pipeline (`turbo lint`) fails with a layering-boundary violation on that file

#### Scenario: Controller goes through a service
- **WHEN** a controller calls a function exported from `apps/api/src/services/`, and that service is the only layer importing from `apps/api/src/models/`
- **THEN** the lint pipeline passes with no layering-boundary violation

### Requirement: Consistent API response shape
Every API endpoint SHALL return responses built exclusively through a shared responder utility: `{ success: true, code, message, data }` on success, and `{ success: false, code, message, errors }` on failure, with no endpoint constructing its own response object.

#### Scenario: Successful request
- **WHEN** any endpoint completes successfully and calls the shared responder's success function
- **THEN** the HTTP response body is exactly `{ success: true, code, message, data }` with no additional top-level keys

#### Scenario: Failed request
- **WHEN** a controller throws an error and it reaches the centralized error-handling middleware
- **THEN** the HTTP response body is exactly `{ success: false, code, message, errors }`, where `errors` is an array

#### Scenario: Controller bypasses the responder
- **WHEN** a controller calls `res.json` or `res.send` directly instead of the shared responder utility
- **THEN** running the lint pipeline fails on that file

### Requirement: Structured request logging on every endpoint
The API SHALL apply a structured (non-`console.log`) logging middleware to every endpoint, recording at minimum the HTTP method, path, response status, request duration, and a per-request request id.

#### Scenario: Request is logged
- **WHEN** any request reaches any registered route
- **THEN** a structured log entry is emitted containing method, path, status code, duration, and a request id unique to that request

#### Scenario: console.log used instead of the logger
- **WHEN** application code under `apps/api/src` calls `console.log`
- **THEN** running the lint pipeline fails on that file

### Requirement: Centralized error handling
The API SHALL handle all errors through one centralized error-handling middleware; controllers SHALL throw errors rather than construct error responses inline.

#### Scenario: Controller throws an application error
- **WHEN** a controller throws an `AppError` (or subclass) with a status code and message
- **THEN** the centralized error middleware catches it and produces the standard failure response shape with that status code

#### Scenario: Unexpected error is thrown
- **WHEN** a controller or downstream service throws an error that is not an `AppError`
- **THEN** the centralized error middleware catches it and produces a 500 failure response in the standard failure response shape, without leaking a raw stack trace in the response body

### Requirement: Health check confirms database connectivity
The API SHALL expose `GET /health` which reports service health and actively confirms the configured database connection is reachable.

#### Scenario: Database is reachable
- **WHEN** a client sends `GET /health` and the configured database responds to a connectivity check
- **THEN** the endpoint returns a success response (standard response shape) indicating the database is connected

#### Scenario: Database is unreachable
- **WHEN** a client sends `GET /health` and the configured database does not respond to a connectivity check
- **THEN** the endpoint returns a failure response (standard response shape) with a non-2xx status indicating the database is unreachable

### Requirement: Database configuration from environment, no hardcoded credentials
The API SHALL read all database connection details from the root `.env` file, SHALL NOT hardcode credentials anywhere in source, and SHALL NOT print or log raw credential values. The ORM engine SHALL be selected by detecting which database-related variables are present in `.env`, defaulting to MySQL with Prisma when the variables present are ambiguous as to engine.

#### Scenario: Ambiguous .env defaults to MySQL
- **WHEN** `.env` defines only generic `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` with no engine-identifying variable
- **THEN** the API configures Prisma with the MySQL provider using those variables

#### Scenario: Credentials are never logged
- **WHEN** the API starts up, connects to the database, or logs any request
- **THEN** no log line contains the raw value of `DB_PASSWORD` or any other credential from `.env`

### Requirement: Frontend Redux store is one slice per domain module
The frontend SHALL define a Redux Toolkit slice per domain module (clients, cases, assessments, coordinatedEntry, dashboard), each in its own file, combined into a single store — with no single slice handling more than one domain's state.

#### Scenario: Adding a domain does not touch other slices
- **WHEN** a developer inspects `apps/web/src/store/slices/`
- **THEN** there is exactly one file per domain module (clients, cases, assessments, coordinatedEntry, dashboard), and the store's root reducer combines them without any cross-domain state embedded in another slice's file

### Requirement: Frontend theme is a single source of truth
The frontend SHALL define colors, spacing, and type scale in one theme token file consumed by the Tailwind configuration, rather than components using inline hex or pixel literals for these values.

#### Scenario: Tailwind config derives from the theme file
- **WHEN** `apps/web/tailwind.config.ts` is inspected
- **THEN** its color, spacing, and font-size values are imported from the single theme token file rather than being redefined inline in the config or in component files

### Requirement: Frontend route stubs render without console errors
The frontend SHALL register routes for Home, My Clients, Cases, Assessments, and Coordinated Entry via React Router, each rendering a placeholder page, and each SHALL render without producing any browser console errors.

#### Scenario: Navigating to each stub route
- **WHEN** a developer runs the frontend dev server and navigates to the Home, My Clients, Cases, Assessments, and Coordinated Entry routes in turn
- **THEN** each route renders a placeholder page and the browser console shows no errors

### Requirement: Frontend API calls go through a single client layer
All frontend data fetching SHALL go through one API client module; Redux thunks SHALL call into that module rather than calling `fetch` (or another HTTP client) directly.

#### Scenario: A thunk calls fetch directly
- **WHEN** a Redux thunk under `apps/web/src/store/slices/` contains a direct `fetch(...)` call instead of calling the shared API client module
- **THEN** this is a layering violation the scaffold's conventions are built to prevent (enforced via code review and the shared client module being the only place `fetch` is used in thunks)

### Requirement: Shared config package for lint, format, and TypeScript
The system SHALL provide a `packages/config` package containing shared ESLint, Prettier, and base `tsconfig` configuration, consumed by both `apps/web` and `apps/api` rather than each app maintaining its own duplicate configuration.

#### Scenario: Both apps extend the shared config
- **WHEN** `apps/web` and `apps/api`'s ESLint, Prettier, and `tsconfig.json` files are inspected
- **THEN** each extends the corresponding base configuration from `packages/config` rather than redefining the same rules independently

### Requirement: Shared types package
The system SHALL provide a `packages/types` package containing TypeScript types/interfaces shared between `apps/web` and `apps/api`, importable by both without duplication.

#### Scenario: A type is shared across apps
- **WHEN** a type is defined once in `packages/types`
- **THEN** it is importable from both `apps/api` and `apps/web` via the workspace package reference, with no duplicate definition of that type in either app

### Requirement: Empty shared UI package scaffold
The system SHALL provide a `packages/ui` package scaffold (buildable, lintable, installable as a workspace dependency) with no components implemented yet, ready for component work in a future change.

#### Scenario: Package builds with no components
- **WHEN** `turbo build` runs across the workspace
- **THEN** `packages/ui` builds successfully despite containing no real components, and is consumable as a workspace dependency by `apps/web`

### Requirement: Documented environment variables
The repository SHALL provide a root `.env.example` file documenting every environment variable the applications expect, with no real values, and a root `README.md` describing how to run both apps, how to configure the environment, and where the design reference and prompt sequence live in `docs/`.

#### Scenario: Fresh clone environment setup
- **WHEN** a developer copies `.env.example` to `.env` and fills in real values per the README
- **THEN** every variable required by `apps/api` and `apps/web` is present in `.env.example`, with none of its values being real credentials
