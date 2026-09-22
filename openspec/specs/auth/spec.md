# auth

## Purpose

Minimal authentication for Housing360's demo phase: a single seeded case-manager user, login/logout, and route-guarding for `apps/web` screens. No registration, roles, or permissions. TBD: expand when multi-user or role-based access becomes in scope.

## Requirements

### Requirement: Seeded Demo User
The system SHALL provide exactly one seeded case-manager user for demo purposes, created via a seed script against the database, with no registration flow available to create additional users.

#### Scenario: Seeded user exists after seeding
- **WHEN** the seed script is run against the database
- **THEN** exactly one case-manager user record exists with credentials usable for login

#### Scenario: No registration endpoint or page exists
- **WHEN** a client requests a registration route or endpoint
- **THEN** no such route exists (registration is out of scope for this phase)

### Requirement: Login
The system SHALL allow the seeded user to log in with credentials and receive a session or JWT establishing their authenticated identity.

#### Scenario: Successful login
- **WHEN** the seeded user submits valid credentials to the login endpoint
- **THEN** the system establishes an authenticated session/token for that user and the client is considered logged in

#### Scenario: Failed login
- **WHEN** a client submits invalid credentials to the login endpoint
- **THEN** the system rejects the request and no session/token is established

### Requirement: Route Guard Redirects Unauthenticated Requests
Any screen route in `apps/web` SHALL require an authenticated session/token; a request to a screen route without one SHALL redirect to the login page.

#### Scenario: Unauthenticated request redirects to login
- **WHEN** an unauthenticated client requests any screen route (e.g. Home, My Clients, Cases, Assessments, Coordinated Entry, or any route-stub screen)
- **THEN** the client is redirected to the login page instead of the requested screen

#### Scenario: Authenticated request reaches the screen
- **WHEN** an authenticated client requests a screen route
- **THEN** the requested screen renders normally, inside the shared app shell

### Requirement: Current User Welcome Value
The system SHALL expose the authenticated user's first name to any screen that needs it, in a "Welcome, [First Name]" form.

#### Scenario: Welcome value available after login
- **WHEN** a screen requests the current authenticated user's display value after login
- **THEN** it receives a "Welcome, [First Name]" value derived from the seeded user's first name

### Requirement: Logout
The system SHALL allow the authenticated user to log out, invalidating their session/token so subsequent screen requests are treated as unauthenticated.

#### Scenario: Logout ends the session
- **WHEN** an authenticated user logs out
- **THEN** their session/token is invalidated and a subsequent request to a screen route redirects to the login page

### Requirement: No Roles or Permissions
The system SHALL NOT implement role-based or permission-based access control in this phase; every authenticated request is treated identically regardless of user attributes.

#### Scenario: Authenticated access is uniform
- **WHEN** the (single) seeded authenticated user accesses any protected screen route
- **THEN** access is granted without any role or permission check beyond authentication itself
