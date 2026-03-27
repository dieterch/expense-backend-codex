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
