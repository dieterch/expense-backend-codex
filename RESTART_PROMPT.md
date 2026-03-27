# Restart Prompt

Use this prompt to start a fresh Codex session on this repo with the right context.

```text
You are continuing work in `/home/developer/projects/expense-backend-codex`.

Please begin by reading these files:

- `README.md`
- `spec.md`
- `frontend-spec.md`
- `new-frontend-spec.md`
- `SECURITY.md`
- `package.json`
- `web/package.json`

Then inspect the current git status and the last 12 commits.

Project summary:

- Backend is a standalone Nitro API with Prisma + SQLite.
- Auth is JWT Bearer based, with `/api/v1/auth/login` and `/api/v1/me`.
- Authorization is role-aware:
  - normal users only see their own trips and related expenses
  - admins can see/manage all trips and admin resources
- `/api/v1/*` routes exist and should be preferred.
- Money migration has started:
  - `Expense.amountCents` exists
  - API responses normalize `amount` and `amountCents`
- CORS/auth are centralized in middleware.
- The repo includes a separate Nuxt + Vuetify frontend in `web/`.
- Local dev bootstrap exists:
  - `npm run db:seed:dev`
  - admin login: `dev-admin@example.com` / `dev-admin-password`
  - member login: `dev-member@example.com` / `dev-member-password`
- `ausgaben.xlsx` exists locally in the repo root and is intentionally gitignored.

Important working conventions:

- Commit automatically after each meaningful, verified implementation step.
- Do not commit `.env` or `ausgaben.xlsx`.
- Use `apply_patch` for file edits.
- Prefer concise progress updates while working.
- Run verification after changes when feasible.

Recent relevant commits:

- `e7e9f26` Ignore local expense analysis workbook
- `0a501a2` Expand frontend plan with testing and FX estimation
- `53bb5dd` Define new frontend feature scope
- `6c1cbb5` Document legacy Quasar frontend features
- `2aa4954` Optimize Vuetify frontend bundle
- `2b25fa9` Add local dev bootstrap accounts
- `e5a8bfb` Add Nuxt Vuetify frontend app
- `47f4b75` Add versioned API route aliases
- `0ffc669` Expand end-to-end authorization coverage

Current planning source of truth:

- `new-frontend-spec.md`

Current recommended next step:

Step 1 from `new-frontend-spec.md`:
- establish frontend test infrastructure in `web/`
- add `Vitest`
- add component test support
- add `Playwright`
- add scripts
- add at least one frontend unit/component test and one E2E smoke test

Expected verification for that step:

- backend tests still pass
- frontend test command passes
- E2E smoke test passes or is documented if partially blocked
- frontend build still passes

When you respond after loading context:

1. summarize where the project stands
2. confirm the exact next implementation step
3. start executing it without asking unnecessary questions
```

## Should You Restart?

Yes, restarting can make sense if the current session feels context-constrained or sluggish. The repo documentation and this handoff file should be enough for a fresh session to resume work reliably without losing direction.
