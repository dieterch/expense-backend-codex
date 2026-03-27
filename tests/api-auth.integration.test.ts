import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const repoDir = process.cwd();
const port = 5689;
const baseUrl = `http://127.0.0.1:${port}`;
const jwtSecret = "integration-test-secret";
const baseDatabasePath = resolve(repoDir, "prisma/dev.db");

let tempDir = "";
let databaseUrl = "";
let prisma: PrismaClient;
let serverProcess: ReturnType<typeof spawn> | null = null;

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
    },
    stdio: "ignore",
  });

  await waitForServer(`${baseUrl}/docs`, 20000);
});

after(async () => {
  if (serverProcess) {
    await stopServer(serverProcess);
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
