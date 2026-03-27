# Security Notes

## Secrets and local configuration

- Never commit `.env` or `.env.*` files with real values.
- Use [.env.example](/home/developer/projects/expense-backend-codex/.env.example) as the tracked template and keep real secrets only in local `.env`.
- Treat `NITRO_JWT_SECRET` as a real secret. Rotate it immediately if it is ever exposed.
- Do not commit private keys, certificates, or export bundles such as `.pem`, `.key`, `.crt`, `.p12`, or `.pfx`.

## Local database safety

- `prisma/dev.db` and local SQLite artifacts are ignored and should stay local.
- Before Prisma schema changes or migration work, create a backup:

```bash
npm run db:backup
```

- Backups are written to `backups/` and are intentionally gitignored.

## If a secret or local file is committed

1. Rotate the secret first.
2. Remove the file or value from git history.
3. Force-push the cleaned history.
4. Ask collaborators to re-clone or hard-reset to the rewritten history.

Example cleanup commands:

```bash
git filter-repo --path .env --invert-paths
git push origin --force --all
git push origin --force --tags
```

If a secret value appeared inside a tracked file, use `git filter-repo --replace-text` and then rotate the secret anyway.

## Reporting

If you find an exposed secret, revoke or rotate it before opening a public issue or sharing logs/screenshots that include the value.
