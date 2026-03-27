import { createError, type H3Event } from "h3";

type EventUser = {
  sub?: unknown;
  role?: unknown;
  devAuthBypassed?: unknown;
};

export type AuthenticatedUser = {
  id: string;
  role: string | null;
  devAuthBypassed: boolean;
};

type TripMembershipReader = {
  tripUser: {
    findUnique(args: { where: { userId_tripId: { userId: string; tripId: string } } }): Promise<unknown>;
  };
};

type ExpenseAccessReader = TripMembershipReader & {
  expense: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; tripId: true; userId: true };
    }): Promise<{ id: string; tripId: string; userId: string } | null>;
  };
};

function createHttpError(statusCode: number, statusMessage: string) {
  return createError({ statusCode, statusMessage });
}

export function normalizeEventUser(rawUser: EventUser | null | undefined): AuthenticatedUser | null {
  const devAuthBypassed = rawUser?.devAuthBypassed === true;
  const id = typeof rawUser?.sub === "string" ? rawUser.sub : devAuthBypassed ? "dev-mode" : null;
  const role = typeof rawUser?.role === "string" ? rawUser.role : null;

  if (!id) {
    return null;
  }

  return {
    id,
    role,
    devAuthBypassed,
  };
}

export function requireAuthenticatedUser(event: H3Event): AuthenticatedUser {
  const user = normalizeEventUser(event.context.user as EventUser | null | undefined);

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  return user;
}

export function isAdminUser(user: AuthenticatedUser): boolean {
  return user.devAuthBypassed || user.role === "admin";
}

export function requireAdminUser(event: H3Event): AuthenticatedUser {
  const user = requireAuthenticatedUser(event);

  if (!isAdminUser(user)) {
    throw createHttpError(403, "Forbidden");
  }

  return user;
}

export function tripReadWhereForUser(user: AuthenticatedUser) {
  if (isAdminUser(user)) {
    return {};
  }

  return {
    users: {
      some: {
        userId: user.id,
      },
    },
  };
}

export function expenseReadWhereForUser(user: AuthenticatedUser) {
  if (isAdminUser(user)) {
    return {};
  }

  return {
    trip: {
      users: {
        some: {
          userId: user.id,
        },
      },
    },
  };
}

export async function requireTripAccess(
  prisma: TripMembershipReader,
  event: H3Event,
  tripId: string
): Promise<AuthenticatedUser> {
  const user = requireAuthenticatedUser(event);

  if (isAdminUser(user)) {
    return user;
  }

  const membership = await prisma.tripUser.findUnique({
    where: {
      userId_tripId: {
        userId: user.id,
        tripId,
      },
    },
  });

  if (!membership) {
    throw createHttpError(403, "Forbidden");
  }

  return user;
}

export async function requireExpenseCreateAccess(
  prisma: TripMembershipReader,
  event: H3Event,
  tripId: string,
  expenseUserId: string
): Promise<AuthenticatedUser> {
  const user = await requireTripAccess(prisma, event, tripId);

  if (!isAdminUser(user) && expenseUserId !== user.id) {
    throw createHttpError(403, "Forbidden");
  }

  return user;
}

export async function requireExpenseWriteAccess(
  prisma: ExpenseAccessReader,
  event: H3Event,
  expenseId: string
): Promise<{ expense: { id: string; tripId: string; userId: string }; user: AuthenticatedUser }> {
  const user = requireAuthenticatedUser(event);
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      tripId: true,
      userId: true,
    },
  });

  if (!expense) {
    throw createHttpError(404, "Expense not found");
  }

  if (isAdminUser(user)) {
    return { expense, user };
  }

  const membership = await prisma.tripUser.findUnique({
    where: {
      userId_tripId: {
        userId: user.id,
        tripId: expense.tripId,
      },
    },
  });

  if (!membership || expense.userId !== user.id) {
    throw createHttpError(403, "Forbidden");
  }

  return { expense, user };
}
