# Restart Prompt

Use this prompt to start a fresh Codex session on this repo with the right context.

```text
You are continuing work in `/home/developer/projects/expense-backend-codex`.

Read `RESTART_PROMPT.md` first, then continue with the files below.

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
- frontend dev host is exposed for LAN access
- API base resolution is LAN-aware:
  - if the configured API base points at `localhost` or `127.0.0.1`, remote devices use the current browser hostname with backend port `5678`
- trip flows are implemented:
  - trip list
  - trip detail
  - expense create/edit/delete
  - selected-trip persistence
  - trip stats dialog
  - weighted settlement dialog
  - admin trip create/edit/delete
  - participant selection during trip create/edit
- admin flows are implemented:
  - users CRUD
  - categories CRUD
  - currencies CRUD
  - all-expenses reporting
  - XLSX export
- settlement weighting is implemented:
  - each user has a `settlementFactor`
  - trip settlement computes weighted target share per participant
  - settlement dialog proposes balancing payments between debtors and creditors
  - confirmed settlement payments are persisted per trip
  - confirmed payments are listed with date, payer, recipient, and amount
  - confirmed payments can be edited or cancelled
  - later settlement suggestions subtract already confirmed payments
- FX support is implemented in trip UI:
  - foreign-currency expenses show reference EUR conversion
  - when historical reference FX is missing, the UI falls back to the configured manual exchange rate
  - the EUR view was simplified to the minimum:
    - no `xxxx cents` display under expense amounts
    - only the EUR amount plus a short exchange-rate source line remain
- trip expense dialogs were improved:
  - last used currency and location are remembered for the next created expense
  - browser geolocation can autofill location
  - Firefox/local-network geolocation caveat is relevant:
    - geolocation works on `localhost`
    - plain `http://<LAN-IP>:3000` may be blocked as a non-secure context
- configurable bank-cost estimation is implemented:
  - local persisted settings in browser
  - default markup
  - fixed fee
  - weekend surcharge field
  - per-currency override support
  - estimated EUR total shown beside reference EUR
  - estimation settings dialog only shows override fields for currencies currently enabled in admin currency settings
- currency administration/import is expanded:
  - admin currencies page can import from Frankfurter
  - import stores `displayName`, `symbol`, and derived `factor` from Frankfurter EUR rates
  - currencies have persisted `enabled` state
  - trip expense dialogs only offer enabled currencies
  - after refresh/backfill, only currencies actually used by expenses are enabled by default
  - newly imported currencies default to disabled until explicitly enabled
- admin expense reporting is expanded:
  - totals and category summaries use normalized EUR amounts
  - payer filter exists
  - optional category breakdown table exists
  - amount column shows compact EUR subline only when original currency is non-EUR
- estimator calibration from `ausgaben.xlsx` is implemented and documented
- category icons are rendered in trip/admin views
- MDI font icons are loaded and legacy icon names are normalized for display
- ten selectable frontend themes are implemented and persisted:
  - Atlas
  - Tide
  - Grove
  - Dusk
  - Paper
  - Ember
  - Fjord
  - Terracotta
  - Alpine
  - Noir
- responsive/mobile improvements are implemented:
  - mobile shell navigation drawer
  - responsive expense/report card layouts beside table layouts
  - tablet/iPad app bar now uses the drawer-based shell to avoid wrapped/clipped controls
  - wide-screen container sizing was fixed to avoid asymmetric left/right margins and clipped content
  - login form width was increased on larger screens
  - trip detail header now keeps participants on their own row and settlement/statistics/estimation buttons on a separate row underneath to avoid uncontrolled wrapping
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
- `server/api/tripsettlements.ts`
- `server/middleware/auth.global.ts`
- `utils/money.ts`
- `utils/reference-exchange.ts`
- `utils/runtime-flags.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260327153000_add_expense_reference_exchange/migration.sql`
- `prisma/migrations/20260329115556_add_settlement_payments/migration.sql`
- `server/routes/docs.ts`
- `server/routes/openapi.yaml.ts`
- `web/.nuxtrc`
- `web/app/assets/main.scss`
- `web/app/layouts/default.vue`
- `web/app/pages/index.vue`
- `web/app/middleware/root-redirect.ts`
- `web/app/pages/login.vue`
- `web/app/pages/trips/[id].vue`
- `web/app/pages/trips/index.vue`
- `web/app/pages/admin/expenses.vue`
- `web/app/pages/admin/currencies.vue`
- `web/app/pages/admin/users.vue`
- `web/app/components/admin/TripEditorDialog.vue`
- `web/app/components/admin/CurrencyEditorDialog.vue`
- `web/app/components/admin/UserEditorDialog.vue`
- `web/app/components/shared/CategoryIcon.vue`
- `web/app/components/trip/ExpenseEditorDialog.vue`
- `web/app/components/trip/ExpenseReferenceSummary.vue`
- `web/app/components/trip/EstimationSettingsDialog.vue`
- `web/app/components/trip/TripSettlementDialog.vue`
- `web/app/composables/useApi.ts`
- `web/app/composables/useAuth.ts`
- `web/app/composables/useEstimationSettings.ts`
- `web/app/composables/useThemePreferences.ts`
- `web/app/plugins/vuetify.ts`
- `web/app/utils/api-base.ts`
- `web/app/utils/category-icon.ts`
- `web/app/utils/expense-estimation.ts`
- `web/app/utils/expense-estimation-calibration.ts`
- `web/app/utils/expense-reference.ts`
- `web/app/utils/trip-settlement.ts`
- `web/app/utils/themes.ts`
- `web/estimation-calibration.md`
- `tests/trip-settlement.test.ts`

Testing status:
- `npm run test` passes
- `npm --prefix web run test` has passed previously, but Nuxt/Vitest should be run through the repo's existing setup; ad-hoc direct `npx vitest` calls can fail on Nuxt runtime imports
- `npm run web:build` passes
- `npm run test:e2e` in `web/` passes

Important workflow note:
- run Nuxt Vitest, Nuxt build, and Playwright sequentially, not in parallel
- parallel runs can collide on Nuxt generated artifacts and produce false failures

Recent meaningful commits:
- `7b0c78b` Persist confirmed trip settlement payments
- `be60d8d` Stabilize trip header participant and action rows
- `7817a24` Add more UI themes and filter estimation currencies
- `c6d94d2` Improve geolocation error hints in expense dialog
- `015281c` Backfill enabled currencies from expense usage
- `c64e888` Add selectable currencies for trip expense dialogs
- `44238c4` Remember recent trip expense currency and location
- `ddc3f45` Tighten trip action row and participant chips
- `b9f52d8` Keep trip total card footprint while aligning rows
- `f2c5ecc` Align trip total card rows
- `5a35bea` Revert "Refine trip header summary and action layout"
- `dd28b81` Add weighted trip settlement workflow
- `53725ba` Add payer filter to admin expenses
- `1266427` Add toggleable admin category breakdown

Local/dev notes:
- Local dev bootstrap exists:
  - `npm run db:seed:dev`
  - admin login: `dev-admin@example.com` / `dev-admin-password`
  - member login: `dev-member@example.com` / `dev-member-password`
- `ausgaben.xlsx` exists locally in the repo root and is intentionally gitignored.
- docs/UI API docs are disabled unless `.env` contains:
  - `NITRO_DOCS_ENABLED=true`
- if frontend behavior looks stale or blank while using VS Code localhost forwarding, restart both frontend/backend dev servers and hard refresh the browser once before debugging further
- for LAN testing on devices like iPad:
  - frontend should be opened via your machine's LAN IP, not `localhost`
  - backend also needs to be running on `0.0.0.0:5678`
- for browser geolocation in the expense dialog:
  - `localhost` works in Firefox
  - `http://<LAN-IP>:3000` may not work because Firefox can treat it as a non-secure context for Geolocation API
  - if geolocation seems broken, retry on `http://localhost:3000` before debugging app code

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
  - manual FX fallback is implemented in the UI when historical reference data is missing
  - weighted settlement is implemented in the trip UI
  - confirmed settlement payment persistence and multi-round settlement tracking are implemented
  - actual booked EUR reconciliation/prediction-error follow-up is still an open next frontier
- repo should be clean before starting new work

When you respond after loading context:

1. summarize where the project stands now
2. confirm that the planned spec steps are complete
3. propose the most sensible next frontier only if needed
```

## Should You Restart?

Yes, restarting can make sense if the current session feels context-constrained or sluggish. The repo documentation and this handoff file should be enough for a fresh session to resume work reliably without losing direction.
