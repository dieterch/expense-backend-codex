# Expense Web

Nuxt 4 + Vuetify frontend for the expense-sharing app.

## Development

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

By default the app targets `http://127.0.0.1:5678/api/v1`.

## Tests

Run the frontend unit/component suite:

```bash
npm run test
```

Run the Playwright smoke suite:

```bash
npm run test:e2e
```

The E2E command seeds the local demo data before launching the backend and frontend dev servers.

Default seeded member login:

- `dev-member@example.com`
- `dev-member-password`

## Playwright Linux dependencies

If Playwright cannot launch Chromium on Linux with missing shared-library errors such as
`libatk-1.0.so.0`, install the required browser system packages first:

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

The second command may require sudo/root privileges depending on the machine.
