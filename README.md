# Expense Backend

Nitro + Prisma backend for the trip expense-sharing app.

## Local development

The API uses Bearer JWT auth by default.

For local-only development, you can bypass Bearer auth by setting this in [.env](/home/developer/projects/expense-backend-codex/.env):

```dotenv
NITRO_DEV_AUTH_BYPASS=true
```

When enabled, the global auth middleware skips JWT validation and injects a synthetic user payload into `event.context.user`.

Leave `NITRO_DEV_AUTH_BYPASS=false` in normal or production-like environments.
