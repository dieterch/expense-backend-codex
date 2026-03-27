# Expense Backend Specification

## 1) Overview

This project is a **Nitro-based backend API** for a trip expense-sharing application.
It provides CRUD-style endpoints for users, trips, expenses, categories, and currencies, plus helper endpoints to fetch users/expenses for a specific trip.
It also provides a login endpoint that returns JWTs for identified users.

- Runtime: Nitro (`nitropack`)
- ORM: Prisma
- Database: SQLite (configured via Prisma)
- Auth: Bearer JWT middleware (`jose`)
- Password utility: `bcrypt` (currently mostly present for legacy/optional paths)

---

## 2) Repository Structure

```text
.
├── nitro.config.ts
├── package.json
├── prisma/
│   ├── schema.prisma
│   ├── client.js
│   ├── dev.db
│   └── migrations/
├── server/
│   ├── api/
│   │   ├── categories.ts
│   │   ├── currency.ts
│   │   ├── expenses.ts
│   │   ├── tripexpenses.ts
│   │   ├── trips.ts
│   │   ├── tripusers.ts
│   │   └── users.ts
│   ├── middleware/
│   │   └── auth.global.ts
│   └── routes/
│       └── index.ts
├── utils/
│   ├── jwt.ts
│   └── precheck.ts
└── help/
    └── ct.mjs
```

---

## 3) Runtime & Configuration

### Nitro config (`nitro.config.ts`)
- `srcDir`: `server`
- `compatibilityDate`: `2024-11-21`
- runtime config:
  - `apiToken` default: `dev_token`
  - `jwtSecret` default: `secret`

### Environment variables
Prisma reads DB connection from:
- `DATABASE_URL`

JWT middleware reads secret from runtime config:
- `jwtSecret` (Nitro runtime config; can be injected via env according to Nitro conventions)
- `devAuthBypass` (set via `NITRO_DEV_AUTH_BYPASS=true` to bypass bearer auth in local development)

> For production, configure secure non-default secrets.

---

## 4) Data Model (Prisma)

Source: `prisma/schema.prisma`

### `User`
- `id` (uuid, PK)
- `email` (unique)
- `name`
- `password`
- `role`
- timestamps (`createdAt`, `updatedAt`)
- relations: `trips` (`TripUser[]`), `expenses` (`Expense[]`), `shares` (`TripShare[]`)

### `Trip`
- `id` (uuid, PK)
- `name` (unique)
- `startDate`
- `endDate?`
- timestamps
- relations: `users` (`TripUser[]`), `expenses` (`Expense[]`), `shares` (`TripShare[]`)

### `TripUser` (join table)
- `id` (uuid, PK)
- `userId` → `User`
- `tripId` → `Trip`
- unique constraint: `(userId, tripId)`

### `Expense`
- `id` (uuid, PK)
- `amount` (Float)
- `amountCents` (Int, nullable during transition; integer minor units derived from `amount`)
- `currency` (String FK to `Currency.name`)
- `date`
- `location`
- `description?`
- `tripId` → `Trip`
- `userId` → `User`
- `categoryId` → `Category`
- timestamps

### `TripShare`
- `id` (uuid, PK)
- `percentage` (Float)
- `userId` → `User`
- `tripId` → `Trip`
- unique constraint: `(userId, tripId)`

### `Category`
- `id` (uuid, PK)
- `name` (unique)
- `icon`
- timestamps
- relation: `expenses`

### `Currency`
- `name` (PK)
- `symbol`
- `factor` (Float)
- relation: `expenses`

Most relations use `onDelete: Cascade`.

---

## 5) Authentication & CORS

## Global middleware
File: `server/middleware/auth.global.ts`

Behavior:
- Handles `OPTIONS` requests with permissive CORS headers and returns early.
- If `NITRO_DEV_AUTH_BYPASS=true`, skips bearer token validation and sets `event.context.user` to a synthetic developer payload.
- For non-OPTIONS requests, expects header:
  - `Authorization: Bearer <token>`
- Verifies token using HS256-compatible secret (`jwtSecret`) via `jose.jwtVerify`.
- On success: stores payload in `event.context.user`.
- On failure:
  - missing/invalid header → `401 Unauthorized`
  - failed verification → `403 Forbidden`

## Endpoint precheck helper
File: `utils/precheck.ts`

- Calls `handleCors(...)` with wildcard origin and broad method list.
- Contains commented-out cookie/JWT auth flow (currently inactive).

> Current codebase uses both global auth middleware and per-endpoint precheck CORS handling.

---

## 6) API Endpoints

Base path uses Nitro file routing under `server/api`, so endpoints are available under `/api/*`.

---

### 6.1 `/api/users`
File: `server/api/users.ts`

- Requires admin privileges for all methods.
- `GET`
  - Returns all users with:
    - `id`, `name`, `email`, `role`, `trips`, `expenses`
- `POST`
  - Creates user from request body
  - Hashes plaintext password before storing it
- `PUT`
  - Updates user by `body.id`
  - Re-hashes password if a new plaintext password is supplied
- `DELETE`
  - Deletes user by `body.id`

### 6.1a `/api/auth/login`
File: `server/api/auth/login.post.ts`

- `POST`
  - Public endpoint
  - Expects:
    ```json
    { "email": "user@example.com", "password": "secret" }
    ```
  - Verifies credentials and returns:
    - `token`
    - safe `user` object (`id`, `email`, `name`, `role`)
  - If the stored password is still plaintext from older data, successful login upgrades it to a bcrypt hash

### 6.1b `/api/me`
File: `server/api/me.get.ts`

- `GET`
  - Requires authentication
  - Returns the current signed-in user:
    - `id`, `email`, `name`, `role`
    - `trips` limited to the user's memberships
  - In developer auth-bypass mode, returns a synthetic developer profile

---

### 6.2 `/api/trips`
File: `server/api/trips.ts`

- `GET`
  - Returns all trips with:
    - `id`, `name`, `startDate`
    - `users` expanded to user basic fields
    - `expenses`
- `POST`
  - Creates trip from request body
- `PUT`
  - Updates trip (`id`, `name`, `startDate`)
  - Rebuilds trip-user assignments:
    1. `deleteMany` all `TripUser` rows for the trip
    2. `upsert` each provided `body.users[]` entry (`userId`, `tripId`)
- `DELETE`
  - Deletes trip by `body.id`

Expected `PUT` shape (implicit from implementation):
```json
{
  "id": "trip-id",
  "name": "Trip name",
  "startDate": "2025-01-01T00:00:00.000Z",
  "users": [
    { "userId": "user-1", "tripId": "trip-id" }
  ]
}
```

---

### 6.3 `/api/expenses`
File: `server/api/expenses.ts`

- `GET`
  - Returns all expenses including related `trip`, `user`, `category`
- `POST`
  - Creates expense from request body
- `PUT`
  - Updates expense by `body.id`
- `DELETE`
  - Deletes expense by `body.id`

---

### 6.4 `/api/tripexpenses`
File: `server/api/tripexpenses.ts`

- `POST`
  - Expects body with trip id:
    ```json
    { "id": "trip-id" }
    ```
  - Returns expenses filtered by `tripId`, including `trip`, `user`, `category`

No GET handler is defined.

---

### 6.5 `/api/tripusers`
File: `server/api/tripusers.ts`

- `POST`
  - Expects body with trip id:
    ```json
    { "id": "trip-id" }
    ```
  - Returns trip participants (user subset: `id`, `name`, `email`)

No GET handler is defined.

---

### 6.6 `/api/categories`
File: `server/api/categories.ts`

- `GET`
  - Returns all categories including related `expenses`
- `POST`
  - Creates category from body
- `PUT`
  - Updates category by `body.id`
- `DELETE`
  - Deletes category by `body.id`

---

### 6.7 `/api/currency`
File: `server/api/currency.ts`

- `GET`
  - Returns currencies: `name`, `symbol`, `factor`
- `POST`
  - Creates currency
- `PUT`
  - Updates currency by `body.name`
- `DELETE`
  - Deletes currency by `body.name`

---

### 6.8 `/`
File: `server/routes/index.ts`

- Returns plain text: `"access prohibited"`

---

## 7) Utilities

### Prisma client singleton
File: `prisma/client.js`

- Uses singleton pattern in development to avoid multiple Prisma client instances during HMR.

### JWT helper
File: `utils/jwt.ts`

- `createToken(payload, secret, expiresIn = '24h')`
- `verifyToken(token, secret)`

### Token generator helper script
File: `help/ct.mjs`

- Generates and prints a long-lived JWT using `NITRO_JWT_SECRET` from environment.

---

## 8) Scripts & Commands

From `package.json`:
- `npm run dev` → `nitro dev --host 0.0.0.0 --port 5678`
- `npm run build` → `nitro build`
- `npm run prepare` → `nitro prepare`
- `npm run preview` → `node .output/server/index.mjs`
- `npm run db:backup` → create a timestamped backup of the current SQLite database in `backups/`
- `npm run db:backfill:amount-cents` → populate `Expense.amountCents` from existing float `amount` values

Prisma seed hook configured:
- `prisma.seed = "node prisma/seed.js"` (seed file not present in current tree)

---

## 9) Known Gaps / Technical Debt

1. Several catch blocks build strings but do not return/throw structured errors.
2. Users endpoint currently exposes `password` field on list reads.
3. Some endpoint logging labels are inconsistent (e.g., precheck tag uses `users.ts` in non-user files).
4. Mixed CORS/auth strategy between global middleware and precheck helper.
5. README is still default Nitro starter content.

---

## 10) Suggested Next Improvements

1. Remove `password` from all API responses.
2. Standardize error handling (`createError` with status codes).
3. Centralize CORS and auth in middleware only.
4. Add DTO/request validation (e.g., Zod) per endpoint.
5. Add pagination/filtering for list endpoints.
6. Add project-specific README setup + env documentation.
7. Add tests for endpoint behavior and auth enforcement.
