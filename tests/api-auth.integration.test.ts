import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const repoDir = process.cwd();
const port = 5689;
const referenceRatePort = 5690;
const baseUrl = `http://127.0.0.1:${port}`;
const referenceRateBaseUrl = `http://127.0.0.1:${referenceRatePort}/v2`;
const jwtSecret = "integration-test-secret";
const baseDatabasePath = resolve(repoDir, "prisma/dev.db");

let tempDir = "";
let databaseUrl = "";
let prisma: PrismaClient;
let serverProcess: ReturnType<typeof spawn> | null = null;
let referenceRateServer: ReturnType<typeof createServer> | null = null;

async function stopServer(processToStop: ReturnType<typeof spawn>) {
  if (processToStop.exitCode !== null || processToStop.signalCode !== null) {
    return;
  }

  processToStop.kill("SIGTERM");

  const exitCode = await Promise.race([
    new Promise((resolve) => processToStop.once("exit", resolve)),
    new Promise((resolve) => setTimeout(() => resolve("timeout"), 3000)),
  ]);

  if (exitCode === "timeout") {
    if (processToStop.exitCode !== null || processToStop.signalCode !== null) {
      return;
    }

    processToStop.kill("SIGKILL");
    await new Promise((resolve) => {
      if (processToStop.exitCode !== null || processToStop.signalCode !== null) {
        resolve(null);
        return;
      }

      processToStop.once("exit", resolve);
    });
  }
}

async function waitForServer(url: string, timeoutMs: number) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return;
      }
    } catch {
      // server is still starting
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

before(async () => {
  const tempRoot = resolve(repoDir, ".tmp-tests");
  await mkdir(tempRoot, { recursive: true });
  tempDir = await mkdtemp(join(tempRoot, "expense-backend-integration-"));
  const databasePath = join(tempDir, "integration.db");
  await copyFile(baseDatabasePath, databasePath);
  databaseUrl = `file:${databasePath}`;

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prisma.expense.deleteMany();
  await prisma.tripShare.deleteMany();
  await prisma.tripUser.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.currency.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "member@example.com",
      name: "Member User",
      password: "legacy-password",
      role: "user",
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: "other@example.com",
      name: "Other User",
      password: "another-password",
      role: "user",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: "admin-password",
      role: "admin",
    },
  });

  const trip = await prisma.trip.create({
    data: {
      name: "Integration Trip",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
    },
  });

  const hiddenTrip = await prisma.trip.create({
    data: {
      name: "Hidden Trip",
      startDate: new Date("2025-02-01T00:00:00.000Z"),
    },
  });

  await prisma.tripUser.create({
    data: {
      userId: user.id,
      tripId: trip.id,
    },
  });

  await prisma.tripUser.create({
    data: {
      userId: otherUser.id,
      tripId: hiddenTrip.id,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: "Meals",
      icon: "fork-knife",
    },
  });

  const currency = await prisma.currency.create({
    data: {
      name: "EUR",
      symbol: "EUR",
      factor: 1,
    },
  });

  await prisma.currency.create({
    data: {
      name: "USD",
      symbol: "$",
      factor: 1.08,
    },
  });

  await prisma.expense.create({
    data: {
      amount: 18.5,
      amountCents: 1850,
      currency: currency.name,
      date: new Date("2025-02-02T12:00:00.000Z"),
      location: "Secret Place",
      description: "Hidden expense",
      tripId: hiddenTrip.id,
      userId: otherUser.id,
      categoryId: category.id,
    },
  });

  referenceRateServer = createServer((request, response) => {
    const url = new URL(request.url || "/", referenceRateBaseUrl);
    const base = url.searchParams.get("base");
    const quotes = url.searchParams.get("quotes");
    const date = url.searchParams.get("date");

    if (
      request.method !== "GET" ||
      url.pathname !== "/v2/rates" ||
      base !== "USD" ||
      quotes !== "EUR" ||
      date !== "2025-03-02"
    ) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not found" }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify([{
      base: "USD",
      quote: "EUR",
      date: "2025-02-28",
      rate: 0.91,
    }]));
  });

  await new Promise<void>((resolve, reject) => {
    referenceRateServer?.listen(referenceRatePort, "127.0.0.1", () => resolve());
    referenceRateServer?.once("error", reject);
  });

  await execFileAsync(npmCommand, ["run", "build"], { cwd: repoDir });

  serverProcess = spawn(process.execPath, [".output/server/index.mjs"], {
    cwd: repoDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NITRO_JWT_SECRET: jwtSecret,
      PORT: String(port),
      NITRO_PORT: String(port),
      HOST: "127.0.0.1",
      NITRO_HOST: "127.0.0.1",
      NITRO_DEV_AUTH_BYPASS: "false",
      NITRO_DOCS_ENABLED: "true",
      NITRO_REFERENCE_RATE_API_BASE: referenceRateBaseUrl,
    },
    stdio: "ignore",
  });

  await waitForServer(`${baseUrl}/docs`, 20000);
});

after(async () => {
  if (serverProcess) {
    await stopServer(serverProcess);
  }

  if (referenceRateServer) {
    await new Promise((resolve) => referenceRateServer?.close(resolve));
  }

  if (prisma) {
    await prisma.$disconnect();
  }

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("login returns a JWT, upgrades legacy password storage, and /api/me returns member trips", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const loginPayload = await loginResponse.json();

  assert.equal(typeof loginPayload.token, "string");
  assert.equal(loginPayload.user.email, "member@example.com");
  assert.equal("password" in loginPayload.user, false);

  const meResponse = await fetch(`${baseUrl}/api/me`, {
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
    },
  });

  assert.equal(meResponse.status, 200);
  const mePayload = await meResponse.json();
  assert.equal(mePayload.email, "member@example.com");
  assert.equal(mePayload.trips.length, 1);
  assert.equal(mePayload.trips[0].name, "Integration Trip");

  const storedUser = await prisma.user.findUnique({
    where: {
      email: "member@example.com",
    },
    select: {
      password: true,
    },
  });

  assert.ok(storedUser);
  assert.equal(storedUser.password.startsWith("$2"), true);
});

test("api/me rejects requests without a bearer token", async () => {
  const response = await fetch(`${baseUrl}/api/me`);
  assert.equal(response.status, 401);
});

test("versioned api aliases work for login and authenticated reads", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();

  const meResponse = await fetch(`${baseUrl}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = await meResponse.json();
  assert.equal(mePayload.email, "member@example.com");

  const tripsResponse = await fetch(`${baseUrl}/api/v1/trips`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  assert.equal(tripsResponse.status, 200);
  const trips = await tripsResponse.json();
  assert.equal(trips.length, 1);
  assert.equal(trips[0].name, "Integration Trip");
});

test("docs routes respond when explicitly enabled", async () => {
  const docsResponse = await fetch(`${baseUrl}/docs`);
  const specResponse = await fetch(`${baseUrl}/openapi.yaml`);

  assert.equal(docsResponse.status, 200);
  assert.equal(specResponse.status, 200);
  assert.match(await docsResponse.text(), /SwaggerUIBundle/);
  assert.match(await specResponse.text(), /^openapi:/);
});

test("regular users only see their own trips while admins see all trips", async () => {
  const memberLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });
  assert.equal(memberLogin.status, 200);
  const { token: memberToken } = await memberLogin.json();

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "admin-password",
    }),
  });
  assert.equal(adminLogin.status, 200);
  const { token: adminToken } = await adminLogin.json();

  const memberTripsResponse = await fetch(`${baseUrl}/api/trips`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(memberTripsResponse.status, 200);
  const memberTrips = await memberTripsResponse.json();
  assert.equal(memberTrips.length, 1);
  assert.equal(memberTrips[0].name, "Integration Trip");

  const adminTripsResponse = await fetch(`${baseUrl}/api/trips`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminTripsResponse.status, 200);
  const adminTrips = await adminTripsResponse.json();
  assert.equal(adminTrips.length, 2);
});

test("cors preflight is handled by middleware", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, PUT, DELETE, OPTIONS");
});

test("regular users cannot access another trip's users or expenses", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();

  const hiddenTrip = await prisma.trip.findUniqueOrThrow({
    where: { name: "Hidden Trip" },
    select: { id: true },
  });

  const hiddenTripUsersResponse = await fetch(`${baseUrl}/api/tripusers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: hiddenTrip.id }),
  });
  assert.equal(hiddenTripUsersResponse.status, 403);

  const hiddenTripExpensesResponse = await fetch(`${baseUrl}/api/tripexpenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: hiddenTrip.id }),
  });
  assert.equal(hiddenTripExpensesResponse.status, 403);
});

test("expense writes and reads expose synced amount and amountCents", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();

  const member = await prisma.user.findUniqueOrThrow({
    where: { email: "member@example.com" },
    select: { id: true },
  });
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { name: "Integration Trip" },
    select: { id: true },
  });
  const category = await prisma.category.findUniqueOrThrow({
    where: { name: "Meals" },
    select: { id: true },
  });

  const createResponse = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: 12.34,
      currency: "EUR",
      date: "2025-03-01T12:00:00.000Z",
      location: "Vienna",
      description: "Lunch",
      tripId: trip.id,
      userId: member.id,
      categoryId: category.id,
    }),
  });

  assert.equal(createResponse.status, 200);
  const createdExpense = await createResponse.json();
  assert.equal(createdExpense.amount, 12.34);
  assert.equal(createdExpense.amountCents, 1234);

  const listResponse = await fetch(`${baseUrl}/api/expenses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(listResponse.status, 200);
  const expenses = await listResponse.json();
  const expense = expenses.find((item: any) => item.id === createdExpense.id);

  assert.ok(expense);
  assert.equal(expense.amount, 12.34);
  assert.equal(expense.amountCents, 1234);
});

test("foreign-currency expenses persist historical EUR reference conversion", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();

  const member = await prisma.user.findUniqueOrThrow({
    where: { email: "member@example.com" },
    select: { id: true },
  });
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { name: "Integration Trip" },
    select: { id: true },
  });
  const category = await prisma.category.findUniqueOrThrow({
    where: { name: "Meals" },
    select: { id: true },
  });

  const createResponse = await fetch(`${baseUrl}/api/v1/expenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: 10,
      currency: "USD",
      date: "2025-03-02T12:00:00.000Z",
      location: "New York",
      description: "Museum ticket",
      tripId: trip.id,
      userId: member.id,
      categoryId: category.id,
    }),
  });

  assert.equal(createResponse.status, 200);
  const createdExpense = await createResponse.json();
  assert.equal(createdExpense.referenceRate, 0.91);
  assert.equal(createdExpense.referenceRateProvider, "Frankfurter");
  assert.equal(createdExpense.referenceRateDate, "2025-02-28");
  assert.equal(createdExpense.referenceEurAmountCents, 910);
  assert.equal(createdExpense.referenceEurAmount, 9.1);

  const storedExpense = await prisma.expense.findUniqueOrThrow({
    where: {
      id: createdExpense.id,
    },
    select: {
      referenceRate: true,
      referenceRateProvider: true,
      referenceRateDate: true,
      referenceEurAmountCents: true,
    },
  });

  assert.equal(storedExpense.referenceRate, 0.91);
  assert.equal(storedExpense.referenceRateProvider, "Frankfurter");
  assert.equal(storedExpense.referenceRateDate, "2025-02-28");
  assert.equal(storedExpense.referenceEurAmountCents, 910);

  const listResponse = await fetch(`${baseUrl}/api/v1/expenses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(listResponse.status, 200);
  const expenses = await listResponse.json();
  const expense = expenses.find((item: any) => item.id === createdExpense.id);

  assert.ok(expense);
  assert.equal(expense.referenceRate, 0.91);
  assert.equal(expense.referenceRateProvider, "Frankfurter");
  assert.equal(expense.referenceRateDate, "2025-02-28");
  assert.equal(expense.referenceEurAmountCents, 910);
  assert.equal(expense.referenceEurAmount, 9.1);
});

test("regular users cannot create expenses in trips they do not belong to", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });

  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();

  const member = await prisma.user.findUniqueOrThrow({
    where: { email: "member@example.com" },
    select: { id: true },
  });
  const hiddenTrip = await prisma.trip.findUniqueOrThrow({
    where: { name: "Hidden Trip" },
    select: { id: true },
  });
  const category = await prisma.category.findUniqueOrThrow({
    where: { name: "Meals" },
    select: { id: true },
  });

  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: 4.5,
      currency: "EUR",
      date: "2025-03-01T12:00:00.000Z",
      location: "Blocked Trip",
      description: "Should fail",
      tripId: hiddenTrip.id,
      userId: member.id,
      categoryId: category.id,
    }),
  });

  assert.equal(response.status, 403);
});

test("regular users cannot update another user's expense, but admins can read all expenses", async () => {
  const memberLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "member@example.com",
      password: "legacy-password",
    }),
  });
  assert.equal(memberLogin.status, 200);
  const { token: memberToken } = await memberLogin.json();

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "admin-password",
    }),
  });
  assert.equal(adminLogin.status, 200);
  const { token: adminToken } = await adminLogin.json();

  const hiddenExpense = await prisma.expense.findFirstOrThrow({
    where: { description: "Hidden expense" },
    select: {
      id: true,
      amount: true,
      currency: true,
      date: true,
      location: true,
      description: true,
      userId: true,
      tripId: true,
      categoryId: true,
    },
  });

  const forbiddenUpdate = await fetch(`${baseUrl}/api/expenses`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${memberToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: hiddenExpense.id,
      amount: hiddenExpense.amount,
      currency: hiddenExpense.currency,
      date: hiddenExpense.date.toISOString(),
      location: hiddenExpense.location,
      description: "Illegal update",
      userId: hiddenExpense.userId,
      tripId: hiddenExpense.tripId,
      categoryId: hiddenExpense.categoryId,
    }),
  });

  assert.equal(forbiddenUpdate.status, 403);

  const adminExpensesResponse = await fetch(`${baseUrl}/api/expenses`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  assert.equal(adminExpensesResponse.status, 200);
  const adminExpenses = await adminExpensesResponse.json();
  assert.ok(adminExpenses.some((expense: any) => expense.description === "Hidden expense"));
  assert.ok(adminExpenses.some((expense: any) => expense.description === "Lunch"));
});
