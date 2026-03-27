# Quasar Frontend Spec

This document summarizes the main functionality of the legacy Quasar frontend found in `/home/developer/projects/quasar-expense`.

## Overview

The Quasar app is a multi-target frontend for the old expense-sharing system.

Supported targets in the repo:

- Web SPA
- PWA
- Capacitor mobile shell
- Electron desktop shell

Core stack:

- Vue 3
- Quasar 2
- Pinia
- Axios
- Chart.js / vue-chartjs
- Capacitor filesystem/share APIs
- Excel export via `write-excel-file`

## Runtime Model

The frontend is configured as a hash-based SPA.

It talks to the backend through:

- `APIURL`
- `APITOKEN`

The app sets a global static Bearer token in the Axios boot file and does not implement a user-facing login screen. Authentication is therefore environment-driven, not session-driven.

## Main Navigation

The drawer menu exposes these primary screens:

- `Trip Expenses` at `/`
- `Trips` at `/trips`
- `Users` at `/users`
- `Categories` at `/categories`
- `All Expenses` at `/allexpenses`
- `Currencies` at `/currencies`

There are also non-primary routes:

- `/test`
- `/chart`
- 404 fallback page

## Main Functional Areas

### 1. Trip-scoped expense management

The default landing page is the trip expense screen.

Main behavior:

- reads the currently selected trip from Quasar local storage
- fetches trip-scoped expenses through `/api/tripexpenses`
- shows expense rows in a table
- supports add, edit, and delete via `ExpensesDialog`
- allows row click to open the edit dialog
- computes trip-level statistics
- exports trip expenses to Excel

Expense entry/edit fields:

- title/description
- category
- currency
- amount
- payer/user
- date

Important UX dependency:

- the page depends on a selected trip having been chosen on the Trips page first

### 2. Trip management

The Trips page is the selector and manager for trips.

Main behavior:

- loads all trips through `/api/trips`
- displays trip name, start date, participants, and expense count
- stores the selected trip in Quasar local storage under `selectedTrip`
- clicking a trip selects it and routes back to the main expense page
- supports add, edit, and delete via `TripsDialog`

Trip create/update behavior:

- trip name
- trip start date
- participant selection from all users

Important business rule enforced in the dialog:

- users with active expenses may not be removed from a trip during update

Important delete rule enforced in the page:

- trips with existing expenses cannot be deleted

### 3. User administration

The Users page is a CRUD admin-style screen for people in the system.

Main behavior:

- loads all users through `/api/users`
- displays name, email, and role
- supports add, edit, and delete via `UsersDialog`

User fields:

- name
- email
- password
- role (`admin` or `user`)

Notable legacy behavior:

- the dialog hashes the password in the frontend with `bcryptjs` before sending it to the API

### 4. Category management

The Categories page manages expense categories.

Main behavior:

- loads categories through `/api/categories`
- displays category name and icon
- supports add, edit, and delete via `CategoriesDialog`

Category fields:

- name
- icon

The dialog links users to the Material Design Icons catalog for icon lookup.

### 5. Currency management

The Currencies page manages exchange-rate records.

Main behavior:

- loads currencies through `/api/currency`
- supports add, edit, and delete via `CurrenciesDialog`
- keeps currencies in a Pinia store
- also auto-loads currencies on app boot

Currency fields:

- name
- symbol
- factor

Functional role in the app:

- currency factors are used to convert expenses into EUR-equivalent values for reporting and statistics

### 6. All-expenses reporting

The All Expenses page is a cross-trip reporting view.

Main behavior:

- loads all expenses through `/api/expenses`
- shows trip, category, payer, description, amount, and currency in one table
- calculates aggregate statistics across all loaded expenses
- exports the result set to Excel

This view is effectively an admin/global reporting page rather than a member-scoped page.

### 7. Statistics and charts

The app includes a reusable statistics dialog shown from expense views.

Available outputs:

- totals in EUR
- average per day
- trip duration in days
- category breakdown table
- pie chart by category
- optional per-user filtering within the chart dialog

Statistics are computed client-side from the loaded expense list.

### 8. Export and sharing

The app supports Excel export in multiple runtime environments.

Behavior by platform:

- Web: direct `.xlsx` download
- Capacitor/mobile: writes the file to device storage and opens native share flow
- Electron: writes a local file

Export content includes:

- date
- category
- title
- amount
- currency
- payer
- trip

## State Management

Main Pinia stores:

- `trip-store`
- `expense-store`
- `user-store`
- `category-store`
- `currency-store`

Responsibilities:

- fetch API data
- keep table-oriented row transforms
- hold reusable column definitions
- compute expense statistics
- manage currency conversion factors

Persistent local state:

- selected trip is stored in Quasar local storage as `selectedTrip`

## Backend Endpoints Used

The frontend expects these endpoints:

- `GET /api/trips`
- `POST /api/trips`
- `PUT /api/trips`
- `DELETE /api/trips`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users`
- `DELETE /api/users`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories`
- `DELETE /api/categories`
- `GET /api/currency`
- `POST /api/currency`
- `PUT /api/currency`
- `DELETE /api/currency`
- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses`
- `DELETE /api/expenses`
- `POST /api/tripexpenses`
- `POST /api/tripusers`

## Important Legacy Characteristics

### Auth model

- no login page
- no per-user session handling
- one static API token from env

### Data access assumptions

- frontend assumes broad CRUD access to users, trips, categories, currencies, and all expenses
- this matches the old app model more than the newer member-scoped authorization model

### Client-side business logic

- selected trip state lives on the client
- statistics are calculated in the frontend
- currency conversion is done in the frontend from loaded exchange factors
- some validation and business rules are enforced in dialogs before API calls

## Suggested Mapping To The New Frontend

The most important product capabilities to preserve from the old Quasar app are:

1. Select a trip and work in a trip-scoped expense view
2. Create, edit, and delete expenses
3. Show trip-level statistics and category breakdowns
4. Manage trips and trip participants
5. Export expenses to Excel
6. Provide admin CRUD for users, categories, and currencies

The biggest architectural change needed when porting to the new app is auth:

- the old frontend assumes a static global API token
- the new backend is built around authenticated users, roles, and per-trip authorization

That means the old functionality should be preserved, but the access model should be rebuilt around:

- real login
- admin-only management screens
- member-scoped trip and expense views
