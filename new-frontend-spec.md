# New Frontend Spec

This document defines what should be carried over from the legacy Quasar frontend into the new Nuxt + Vuetify frontend, while adapting the product to real session-based authentication and the newer backend authorization model.

## Goals

Build a modern web frontend that:

- preserves the most valuable workflows from the old app
- works with real authenticated users instead of a static API token
- respects per-user and per-trip authorization
- supports both regular users and admins
- becomes the reference web client alongside the iOS client
- is implemented incrementally with automated tests at every step

## Product Direction

The new frontend should keep the old app’s core experience:

- choose a trip
- manage trip expenses
- see totals and category breakdowns
- administer trips, users, categories, and currencies

But it should replace the old runtime assumptions:

- no static global Bearer token
- no implicit admin-level access for everyone
- no frontend-side password hashing
- no dependence on unrestricted `/api/*` access

Instead, the frontend should use:

- login via `/api/v1/auth/login`
- session restoration via `/api/v1/me`
- role-aware navigation
- member-scoped trip and expense data

## Testing Strategy

Every meaningful implementation step should add or update tests.

Test layers:

- unit tests for frontend composables, helpers, money formatting, exchange-rate logic, and prediction logic
- component tests for forms, route guards, navigation visibility, and error handling
- backend integration tests for login, authorization, exchange-rate persistence, and expense write/read flows
- end-to-end tests for the complete authenticated app

Recommended tooling:

- `Vitest` for unit and component tests in `web/`
- `Playwright` for full-app end-to-end tests
- existing backend test runner for API integration and regression tests

Baseline expectations:

- each implementation phase has at least one direct test proving the new behavior
- the whole app has a small but real E2E smoke suite
- no feature is considered complete until its test path is green

## What To Carry Over

### 1. Trip-first workflow

Keep the old app’s strongest interaction model:

- users select a trip
- the UI becomes centered on that trip’s expenses
- trip context stays visible while browsing and editing

Recommended implementation:

- keep a selected-trip state in the frontend
- show the current trip prominently in the layout or page header
- route from trip list to trip detail rather than relying only on local storage

### 2. Expense management

Carry over full expense CRUD in trip context.

Required features:

- list trip expenses
- add expense
- edit expense
- delete expense
- show payer, category, date, amount, and currency

Adjustments for the new backend:

- regular users may only edit/delete their own expenses unless admin
- user selection when creating an expense should be limited to valid trip members
- forms must send the current backend payload shape, not the old nested Prisma-style payloads

### 3. Trip statistics

Carry over the statistics dialog concept.

Required outputs:

- trip total
- average per day
- duration in days
- category breakdown
- optional per-user breakdown
- chart visualization

Recommended implementation:

- keep client-side derived statistics for responsiveness
- compute from already loaded trip expense data
- use the new canonical money representation from the backend

### 4. Trips management

Carry over trip administration.

Required features:

- trips list
- create trip
- update trip
- delete trip
- manage trip participants

Rules to preserve:

- trip delete should be guarded carefully
- participant changes should respect expense ownership constraints

Backend-aware behavior:

- admin sees all trips
- regular users see only their own trips
- only admins should get create/update/delete trip UI unless product rules change

### 5. User administration

Carry over user management, but make it explicitly admin-only.

Required features:

- list users
- create user
- update user
- delete user
- assign role

Changes from legacy behavior:

- do not hash passwords in the browser
- send plaintext password only over authenticated HTTPS in normal deployment
- backend performs hashing
- hide this entire area from non-admin users

### 6. Categories and currencies

Carry over both admin CRUD areas.

Required features:

- list/create/update/delete categories
- list/create/update/delete currencies

Changes:

- admin-only navigation and access
- use backend validation and normalized errors
- keep category icon selection simple at first

### 7. All-expenses reporting

Partially carry this over.

Recommendation:

- keep a global all-expenses screen only for admins
- regular users should not have a global all-expenses page

Useful features to preserve:

- sortable cross-trip table
- export support
- global aggregate statistics

### 8. Export

Carry over Excel export, but as a second-phase feature unless needed immediately.

Recommended scope:

- trip expense export first
- admin all-expenses export second

Web-first implementation is enough for now:

- browser download of `.xlsx`

Mobile-native sharing can remain an iOS-app concern later unless the web app becomes a packaged mobile shell.

### 9. Foreign-currency exchange-rate support

Add explicit exchange-rate handling for non-EUR expenses.

Required product behavior:

- a foreign-currency expense should preserve the original amount and original currency
- the app should store a historical reference rate for the expense date
- the app should derive a reference EUR amount from that rate
- the UI should be able to show both original and EUR-equivalent values

Recommended external rate source:

- use a free historical exchange-rate API such as Frankfurter as the default provider
- store the provider name with the fetched rate
- treat the fetched rate as a reference market rate, not as the final bank-booked rate

Recommended per-expense data to expose in the frontend once the backend supports it:

- `amount`
- `currency`
- `referenceRate`
- `referenceRateProvider`
- `referenceEurAmount`
- `estimatedBankMarkupBps`
- `estimatedFixedFeeCents`
- `estimatedTotalEurAmount`
- `actualBookedEurAmount` when known
- `predictionErrorCents` when known

### 10. Bank-cost estimation and surcharge prediction

Add a configurable estimation layer for non-EUR expenses.

Reason:

- real bank/card settlements often differ from the reference exchange rate
- the difference can vary by currency, bank spread, fees, weekend handling, and card rules

Recommended first model:

`estimated_total_eur = reference_eur + percentage_markup + fixed_fee`

Config levels:

- global default markup
- per-currency markup override
- optional fixed fee
- optional weekend surcharge
- optional payment-type profile later

Product behavior:

- estimates should be clearly labeled as estimates
- the UI should distinguish:
  - reference market conversion
  - estimated bank-adjusted amount
  - actual booked amount if entered later

Planned calibration input:

- use `ausgaben.xlsx` in the project root as the initial analysis source
- fit a first prediction profile from the historical bank-account data in that workbook
- keep the first estimator simple and explainable before attempting more advanced modeling

## New Authentication Model

### Login

The frontend should provide a proper login screen.

Flow:

1. user enters email and password
2. frontend posts to `/api/v1/auth/login`
3. backend returns JWT plus user payload
4. frontend stores token locally
5. frontend loads authenticated user state

### Session restoration

On app startup:

1. read stored token
2. call `/api/v1/me`
3. restore current user and trip list if the token is still valid
4. clear session and redirect to login if unauthorized

### Logout

Required behavior:

- clear token
- clear user state
- clear selected trip state if appropriate
- redirect to login

### Route protection

The frontend should define protected and guest-only routes.

Protected:

- trips
- trip detail
- expenses
- admin screens

Guest-only:

- login

### Role-aware navigation

The menu should differ by role.

Regular users should see:

- Trips
- Current Trip / Trip Detail
- Their expenses/statistics

Admins should also see:

- Users
- Categories
- Currencies
- All Expenses
- Trip administration actions

## Information Architecture

Recommended pages for the new app:

- `/login`
- `/trips`
- `/trips/[id]`
- `/admin/users`
- `/admin/categories`
- `/admin/currencies`
- `/admin/expenses`

Recommended layout behavior:

- app shell with top bar
- current user shown in shell
- current role shown for admins
- contextual trip header on trip detail pages

## Data / State Model

The new frontend should keep centralized composables or stores for:

- auth/session state
- current user
- selected trip
- trips list
- trip detail / trip expenses
- admin resources: users, categories, currencies
- exchange-rate display state and estimation settings where needed

Recommended persistence:

- persist auth token
- optionally persist last selected trip id
- never persist sensitive user data beyond what is needed

## API Integration Rules

Use only versioned routes:

- `/api/v1/auth/login`
- `/api/v1/me`
- `/api/v1/trips`
- `/api/v1/expenses`
- `/api/v1/tripexpenses`
- `/api/v1/tripusers`
- `/api/v1/users`
- `/api/v1/categories`
- `/api/v1/currency`

Frontend API layer requirements:

- inject Bearer token automatically
- normalize `401` into logout/redirect
- surface `403` as forbidden UI states
- display validation errors from `400`
- display conflict messages from `409`

Additional API expectations for the currency-estimation feature:

- fetch or receive per-expense reference exchange data
- read and write estimated bank-cost settings once backend support exists
- support later reconciliation when actual booked EUR values are available

## UX / Behavior Changes From Legacy App

### Replace selected-trip-only home behavior

The old app assumes the main page depends on a locally stored selected trip.

New recommendation:

- `/trips` should be the default authenticated landing page
- `/trips/[id]` should be the canonical detail page
- selected trip can still be remembered, but route state should lead

### Remove frontend password hashing

The old app hashes passwords in the browser.

New behavior:

- plain password entry only in admin user create/update forms
- hashing handled exclusively by the backend

### Remove static environment token assumptions

The old app depends on one global API token.

New behavior:

- every session belongs to one user
- UI is personalized and permission-aware

### Restrict global data access

The old app treats most pages as globally visible CRUD.

New behavior:

- regular users only see their own trips and related expenses
- admins see all and can administer

### Make exchange-rate uncertainty visible

The old app converts currencies client-side using simple factors.

New behavior:

- show a clear separation between:
  - original expense amount
  - reference exchange conversion
  - estimated bank-adjusted conversion
- avoid presenting estimates as exact booked values

## Phase 1 Scope

This is what I would build first in the new frontend.

### User scope

- login
- session restore/logout
- trips list
- trip detail with expenses
- add/edit/delete own expenses
- trip statistics

Tests for Phase 1:

- login success/failure
- session restore on reload
- redirect to login on `401`
- user only sees own trips
- user can create an expense in an allowed trip
- user cannot access an admin route

### Admin scope

- admin nav visibility
- users list/basic CRUD
- categories CRUD
- currencies CRUD

Tests for Phase 1 admin work:

- admin menu visibility
- non-admin menu hiding
- admin-only route protection
- users/categories/currencies CRUD happy paths
- `403` handling for non-admin access attempts

## Phase 2 Scope

- admin all-expenses reporting
- Excel export
- richer statistics UI
- trip participant management polish
- stronger empty/error/loading states
- reference exchange-rate display for foreign-currency expenses
- configurable estimated bank-cost display

Tests for Phase 2:

- foreign-currency expense shows original and EUR reference values
- exchange-rate fetch/persist flow works for supported currencies
- estimation settings change the displayed estimate predictably
- export includes currency-related fields correctly

## Phase 3 Scope

- analyze `ausgaben.xlsx`
- derive an initial prediction profile from real bank data
- support actual booked EUR reconciliation
- show prediction accuracy and error once real outcomes are available

Tests for Phase 3:

- estimator calibration logic is reproducible from fixture data
- predicted values remain stable for a fixed configuration
- actual booked values override estimates where appropriate
- prediction error is displayed correctly

## Implementation Plan

### Step 1. Establish frontend test infrastructure

Work:

- add `Vitest`
- add Vue/component test utilities
- add `Playwright`
- add root/frontend test scripts

Done when:

- unit tests run in `web/`
- one E2E smoke test can boot the app and reach the login page

### Step 2. Finalize session-auth foundation

Work:

- strengthen login, logout, route guards, and session restore
- add explicit loading, unauthorized, and forbidden UI states

Done when:

- protected routes consistently redirect unauthenticated users
- admin-only routes are hidden and blocked for non-admins

Tests:

- auth composable tests
- guard tests
- login/logout E2E

### Step 3. Finish trip and expense user flows

Work:

- complete trip list
- complete trip detail
- complete expense create/update/delete UX
- add statistics dialog

Done when:

- a regular user can manage expenses only within their own trips

Tests:

- component tests for trip/expense forms
- E2E trip selection and expense CRUD path

### Step 4. Add admin resource screens

Work:

- users CRUD
- categories CRUD
- currencies CRUD

Done when:

- an admin can manage all reference data from the web UI

Tests:

- admin CRUD component tests
- admin E2E smoke flow

### Step 5. Add global reporting and export

Work:

- admin all-expenses page
- Excel export
- better loading/error/empty states

Done when:

- admins can inspect and export cross-trip data

Tests:

- reporting page tests
- export trigger tests

### Step 6. Add reference exchange-rate support

Work:

- extend backend and frontend data model for per-expense reference rates
- use a free historical provider for non-EUR expenses
- expose reference EUR conversion in the UI

Done when:

- a foreign-currency expense shows reproducible historical reference conversion

Tests:

- backend integration tests for rate fetch/persist
- frontend display tests for foreign-currency expenses

### Step 7. Add configurable bank-cost estimation

Work:

- add configurable markup/fee settings
- show estimated bank-adjusted total alongside reference conversion

Done when:

- estimates are clearly visible and configurable

Tests:

- estimator unit tests
- frontend settings/display tests

### Step 8. Calibrate from `ausgaben.xlsx`

Work:

- analyze the workbook
- derive an initial configuration profile
- document assumptions and confidence limits

Done when:

- the estimator uses a real, explainable baseline derived from your historical data

Tests:

- fixture-based calibration tests
- reproducibility checks for model outputs

## Acceptance Criteria

### Regular user

- can log in
- sees only trips they belong to
- can open a trip and see its expenses
- can create expenses in their trips
- cannot access admin pages
- cannot see other users’ unrelated trips

### Admin

- can log in
- sees all trips
- can manage users, categories, currencies, and trips
- can access global reporting pages

### Shared

- session survives reload when token is valid
- invalid token returns user to login
- loading and error states are visible and understandable
- API validation errors are shown cleanly in forms
- automated tests cover both incremental features and a full-app smoke path

## Recommended Migration Strategy

1. Keep the new Nuxt + Vuetify app as the target frontend.
2. Rebuild the old Quasar core flows in order of business value.
3. Start with authenticated trips and trip expenses.
4. Add admin-only resource screens next.
5. Add statistics polish and export after the main CRUD flows are stable.

## Summary

The new frontend should preserve the old app’s strongest product ideas:

- trip-centered expense work
- quick CRUD dialogs
- statistics
- admin resource management

But it should rebuild them around the new backend contract:

- session authentication
- user identity
- role-based navigation
- member-scoped authorization
- versioned API integration
