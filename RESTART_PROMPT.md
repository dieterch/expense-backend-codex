# Restart Prompt

Use this prompt to start a fresh Codex session on this repo with the right context.

```text
You are continuing work in `/home/developer/projects/expense-backend-codex`.

Start by reading:

- `README.md`
- `new-frontend-spec.md`
- `web/estimation-calibration.md`
- `package.json`
- `web/package.json`

Then inspect:
- `git status --short`
- last 12 commits

Current verified project state:

Backend:
- Backend is a standalone Nitro API with Prisma + SQLite.
- Auth is JWT Bearer based, with `/api/v1/auth/login` and `/api/v1/me`.
- Authorization is role-aware:
  - normal users only see their own trips and related expenses
  - admins can see/manage all trips and admin resources
- `/api/v1/*` routes exist and should be preferred.
- money normalization is in place:
  - `Expense.amount`
  - `Expense.amountCents`
- historical FX reference support is implemented:
  - `Expense.referenceRate`
  - `Expense.referenceRateProvider`
  - `Expense.referenceRateDate`
  - `Expense.referenceEurAmountCents`
  - API responses also expose normalized `referenceEurAmount`
- CORS/auth are centralized in middleware.
- docs endpoints are env-gated:
  - `/docs`
  - `/openapi.yaml`
  - they are only available when `NITRO_DOCS_ENABLED=true`
  - default/off behavior is `404`

Frontend:
- Nuxt + Vuetify app in `web/`
- frontend test infrastructure is set up with Vitest + Playwright
- auth/session restore, route guards, admin guards, forbidden page, logout handling all exist
- trip flows are implemented:
  - trip list
  - trip detail
  - expense create/edit/delete
  - selected-trip persistence
  - trip stats dialog
  - admin trip create/edit/delete
  - participant selection during trip create/edit
- admin flows are implemented:
  - users CRUD
  - categories CRUD
  - currencies CRUD
  - all-expenses reporting
  - XLSX export
- FX support is implemented in trip UI:
  - foreign-currency expenses show reference EUR conversion
- configurable bank-cost estimation is implemented:
  - local persisted settings in browser
  - default markup
  - fixed fee
  - weekend surcharge field
  - per-currency override support
  - estimated EUR total shown beside reference EUR
- estimator calibration from `ausgaben.xlsx` is implemented and documented
- category icons are rendered in trip/admin views
- responsive/mobile improvements are implemented:
  - mobile shell navigation drawer
  - responsive expense/report card layouts beside table layouts
- frontend startup redirect/session restore has been stabilized:
  - root `/` now redirects via dedicated route middleware
  - session restore no longer uses the auto-redirecting API helper during bootstrap

Calibration outcome now in code:
- default markup: `75` bps (`0.75%`)
- fixed fee: `109` cents (`EUR 1.09`)
- weekend surcharge: `0`
- source: `web/estimation-calibration.md`

Important files for current state:
- `server/api/expenses.ts`
- `server/api/trips.ts`
- `server/api/tripexpenses.ts`
- `server/middleware/auth.global.ts`
- `utils/money.ts`
- `utils/reference-exchange.ts`
- `utils/runtime-flags.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260327153000_add_expense_reference_exchange/migration.sql`
- `server/routes/docs.ts`
- `server/routes/openapi.yaml.ts`
- `web/app/pages/index.vue`
- `web/app/middleware/root-redirect.ts`
- `web/app/pages/trips/[id].vue`
- `web/app/pages/trips/index.vue`
- `web/app/components/admin/TripEditorDialog.vue`
- `web/app/components/shared/CategoryIcon.vue`
- `web/app/components/trip/ExpenseReferenceSummary.vue`
- `web/app/components/trip/EstimationSettingsDialog.vue`
- `web/app/composables/useAuth.ts`
- `web/app/composables/useEstimationSettings.ts`
- `web/app/utils/expense-estimation.ts`
- `web/app/utils/expense-estimation-calibration.ts`
- `web/estimation-calibration.md`

Testing status:
- `npm run test` passes
- `npm --prefix web run test` passes
- `npm run web:build` passes
- `npm run test:e2e` in `web/` passes

Important workflow note:
- run Nuxt Vitest, Nuxt build, and Playwright sequentially, not in parallel
- parallel runs can collide on Nuxt generated artifacts and produce false failures

Recent meaningful commits:
- `1f24376` Stabilize frontend startup redirects
- `9ed18da` Fix initial root-page redirect
- `41e43b1` Gate docs routes behind env toggle
- `013d9c8` Add trip admin UI and responsive expense views
- `9bbc0ac` Add frontend test infrastructure
- `993179e` Finalize frontend session auth foundation
- `906e18a` Complete trip expense user flows
- `cd2878f` Add admin resource management screens
- `c49d9d3` Add admin expense reporting and export
- `04f2c3e` Add historical FX reference support
- `40a7361` Add configurable FX cost estimation
- `9a2dde6` Calibrate FX estimator from workbook

Local/dev notes:
- Local dev bootstrap exists:
  - `npm run db:seed:dev`
  - admin login: `dev-admin@example.com` / `dev-admin-password`
  - member login: `dev-member@example.com` / `dev-member-password`
- `ausgaben.xlsx` exists locally in the repo root and is intentionally gitignored.
- docs/UI API docs are disabled unless `.env` contains:
  - `NITRO_DOCS_ENABLED=true`
- if frontend behavior looks stale or blank while using VS Code localhost forwarding, restart both frontend/backend dev servers and hard refresh the browser once before debugging further

Important working conventions:

- Commit automatically after each meaningful, verified implementation step.
- Do not commit `.env` or `ausgaben.xlsx`.
- Use `apply_patch` for file edits.
- Prefer concise progress updates while working.
- Run verification after changes when feasible.

Current planning source of truth:

- `new-frontend-spec.md`

Status:
- Steps 1 through 8 from `new-frontend-spec.md` are complete
- steps 9 and 10 have partial/meaningful implementation:
  - historical FX reference support is implemented
  - configurable bank-cost estimation is implemented
  - actual booked EUR reconciliation/prediction-error follow-up is still an open next frontier
- repo should be clean before starting new work

When you respond after loading context:

1. summarize where the project stands now
2. confirm that the planned spec steps are complete
3. propose the most sensible next frontier only if needed
```

## Should You Restart?

Yes, restarting can make sense if the current session feels context-constrained or sluggish. The repo documentation and this handoff file should be enough for a fresh session to resume work reliably without losing direction.
