import test from "node:test";
import assert from "node:assert/strict";

import {
  expenseReadWhereForUser,
  isAdminUser,
  normalizeEventUser,
  requireAdminUser,
  requireAuthenticatedUser,
  requireExpenseCreateAccess,
  requireExpenseWriteAccess,
  requireTripAccess,
  tripReadWhereForUser,
} from "../utils/access-control";

function createEvent(user?: Record<string, unknown>) {
  return {
    context: {
      user,
    },
  } as any;
}

test("normalizeEventUser returns null without subject", () => {
  assert.equal(normalizeEventUser(undefined), null);
  assert.equal(normalizeEventUser({ role: "admin" }), null);
});

test("normalizeEventUser accepts dev bypass payload without subject", () => {
  assert.deepEqual(normalizeEventUser({ devAuthBypassed: true }), {
    id: "dev-mode",
    role: null,
    devAuthBypassed: true,
  });
});

test("requireAuthenticatedUser returns normalized user", () => {
  assert.deepEqual(requireAuthenticatedUser(createEvent({ sub: "user-1", role: "user" })), {
    id: "user-1",
    role: "user",
    devAuthBypassed: false,
  });
});

test("requireAuthenticatedUser throws 401 when user is missing", () => {
  assert.throws(() => requireAuthenticatedUser(createEvent()), (error: any) => error?.statusCode === 401);
});

test("requireAdminUser allows admins and dev bypass users", () => {
  assert.equal(isAdminUser(requireAdminUser(createEvent({ sub: "admin-1", role: "admin" }))), true);
  assert.equal(isAdminUser(requireAdminUser(createEvent({ devAuthBypassed: true }))), true);
});

test("requireAdminUser rejects non-admin users", () => {
  assert.throws(
    () => requireAdminUser(createEvent({ sub: "user-1", role: "user" })),
    (error: any) => error?.statusCode === 403
  );
});

test("tripReadWhereForUser scopes normal users to memberships", () => {
  assert.deepEqual(tripReadWhereForUser({ id: "user-1", role: "user", devAuthBypassed: false }), {
    users: {
      some: {
        userId: "user-1",
      },
    },
  });
});

test("tripReadWhereForUser returns unscoped query for admins", () => {
  assert.deepEqual(tripReadWhereForUser({ id: "admin-1", role: "admin", devAuthBypassed: false }), {});
});

test("expenseReadWhereForUser scopes normal users through trip membership", () => {
  assert.deepEqual(expenseReadWhereForUser({ id: "user-1", role: "user", devAuthBypassed: false }), {
    trip: {
      users: {
        some: {
          userId: "user-1",
        },
      },
    },
  });
});

test("requireTripAccess allows members and rejects non-members", async () => {
  const prisma = {
    tripUser: {
      async findUnique({ where }: { where: { userId_tripId: { userId: string; tripId: string } } }) {
        return where.userId_tripId.userId === "member-1" && where.userId_tripId.tripId === "trip-1"
          ? { userId: "member-1", tripId: "trip-1" }
          : null;
      },
    },
  };

  const member = await requireTripAccess(prisma, createEvent({ sub: "member-1", role: "user" }), "trip-1");
  assert.equal(member.id, "member-1");

  await assert.rejects(
    () => requireTripAccess(prisma, createEvent({ sub: "member-2", role: "user" }), "trip-1"),
    (error: any) => error?.statusCode === 403
  );
});

test("requireExpenseCreateAccess prevents users from creating expenses for another user", async () => {
  const prisma = {
    tripUser: {
      async findUnique() {
        return { userId: "user-1", tripId: "trip-1" };
      },
    },
  };

  await assert.rejects(
    () => requireExpenseCreateAccess(prisma, createEvent({ sub: "user-1", role: "user" }), "trip-1", "user-2"),
    (error: any) => error?.statusCode === 403
  );
});

test("requireExpenseWriteAccess allows owners, admins, and reports missing expenses", async () => {
  const prisma = {
    expense: {
      async findUnique({ where }: { where: { id: string } }) {
        if (where.id === "missing") {
          return null;
        }

        return {
          id: where.id,
          tripId: "trip-1",
          userId: "user-1",
        };
      },
    },
    tripUser: {
      async findUnique({ where }: { where: { userId_tripId: { userId: string; tripId: string } } }) {
        return where.userId_tripId.userId === "user-1" ? { ok: true } : null;
      },
    },
  };

  const ownerAccess = await requireExpenseWriteAccess(
    prisma,
    createEvent({ sub: "user-1", role: "user" }),
    "expense-1"
  );
  assert.equal(ownerAccess.user.id, "user-1");

  const adminAccess = await requireExpenseWriteAccess(
    prisma,
    createEvent({ sub: "admin-1", role: "admin" }),
    "expense-1"
  );
  assert.equal(adminAccess.user.id, "admin-1");

  await assert.rejects(
    () => requireExpenseWriteAccess(prisma, createEvent({ sub: "user-2", role: "user" }), "expense-1"),
    (error: any) => error?.statusCode === 403
  );

  await assert.rejects(
    () => requireExpenseWriteAccess(prisma, createEvent({ sub: "admin-1", role: "admin" }), "missing"),
    (error: any) => error?.statusCode === 404
  );
});
