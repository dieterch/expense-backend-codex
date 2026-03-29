# Expense Backend

Nitro + Prisma backend for the trip expense-sharing app.

## Apps

- `./` contains the Nitro + Prisma API
- `./web` contains a separate Nuxt + Vuetify frontend that consumes `/api/v1`

## Local development

The API uses Bearer JWT auth by default.

Create a local env file from the tracked template:

```bash
cp .env.example .env
```

For local-only development, you can bypass Bearer auth by setting this in [.env](/home/developer/projects/expense-backend-codex/.env):

```dotenv
NITRO_DEV_AUTH_BYPASS=true
```

When enabled, the global auth middleware skips JWT validation and injects a synthetic user payload into `event.context.user`.

Leave `NITRO_DEV_AUTH_BYPASS=false` in normal or production-like environments.

API docs are disabled by default. To expose `/docs` and `/openapi.yaml` locally, set this in `.env`:

```dotenv
NITRO_DOCS_ENABLED=true
```

## Running the frontend

Start the API first:

```bash
npm install
npm run dev
```

Then in a second terminal start the web app:

```bash
npm --prefix web install
npm run web:dev
```

By default the frontend targets `http://127.0.0.1:5678/api/v1`.

The first web flow includes:

- login
- trips list
- trip detail
- expense creation

## Local demo users

To create a local admin login, a member login, and a sample trip without deleting existing data, run:

```bash
npm run db:seed:dev
```

Default local credentials:

- admin: `dev-admin@example.com` / `dev-admin-password`
- member: `dev-member@example.com` / `dev-member-password`

The bootstrap is idempotent:

- it creates or updates only the named demo users
- it ensures one sample trip and memberships exist
- it does not wipe existing rows from your SQLite database

You can override the defaults with env vars such as:

- `DEV_BOOTSTRAP_ADMIN_EMAIL`
- `DEV_BOOTSTRAP_ADMIN_PASSWORD`
- `DEV_BOOTSTRAP_MEMBER_EMAIL`
- `DEV_BOOTSTRAP_MEMBER_PASSWORD`

## Docker

Container files live in [docker/](/home/developer/projects/expense-backend-codex/docker).

The repository now includes server-root deployment templates intended to be copied from [docker/compose.yaml](/home/developer/projects/expense-backend-codex/docker/compose.yaml) and [docker/Dockerfile](/home/developer/projects/expense-backend-codex/docker/Dockerfile) into a separate deployment directory that contains:

- `compose.yaml`
- `Dockerfile`
- `data/`
- `expense-backend-codex/`

In that deployment directory, the provided Compose setup starts:

- backend on `5678`
- frontend on `3000`

It expects `./expense-backend-codex/.env`. For local browser access, use:

```dotenv
NUXT_PUBLIC_API_BASE=http://127.0.0.1:5678/api/v1
```

To build and run from the deployment root:

```bash
docker compose build
docker compose up -d
```

The backend stores SQLite data in the named Docker volume `expense_data` at `/app/data/dev.db`.

The deployment root `data/` directory is reserved for Prisma runtime metadata used by `npx prisma migrate deploy`:

- `data/schema.prisma`
- `data/migrations/`

The provided Compose file binds those files into `/app/prisma` and keeps the actual SQLite database out of `./data`.

The Compose template already includes Traefik labels for frontend and backend on an external `traefik_network`. Authelia middleware labels are included as commented examples and should use `authelia@file` in this environment when re-enabled. When the frontend is served behind a public hostname, set `NUXT_PUBLIC_API_BASE` to the public backend URL, for example `https://api.example.com/api/v1`.

## SQLite safety

Before changing the Prisma schema or running migrations, create a SQLite backup:

```bash
npm run db:backup
```

Backups are written to `backups/` and are gitignored.

After additive expense money-field migrations, you can backfill the integer minor-unit column with:

```bash
npm run db:backfill:amount-cents
```
