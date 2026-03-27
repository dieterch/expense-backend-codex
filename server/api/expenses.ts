// server/api/expenses.ts
import prisma from "../../prisma/client.js";
import {
  expenseReadWhereForUser,
  isAdminUser,
  requireAuthenticatedUser,
  requireExpenseCreateAccess,
  requireExpenseWriteAccess,
} from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import {
  ensureObjectBody,
  optionalString,
  requireDate,
  requireNumber,
  requireString,
  requireUuidLikeId,
} from "../../utils/request-validation";
import { amountToCents, normalizeExpenseRecord } from "../../utils/money";
import { resolveExpenseReferenceExchange } from "../../utils/reference-exchange";

export default defineEventHandler(async (event) => {
  try {
    const user = requireAuthenticatedUser(event);

    if (event.node.req.method === "GET") {
      console.log("expenses.ts, method:", event.node.req.method);
      const expenses = await prisma.expense.findMany({
        where: expenseReadWhereForUser(user),
        include: {
          trip: true,
          user: true,
          category: true,
        },
      });

      return expenses.map(normalizeExpenseRecord);
    }

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log("expenses.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      const amount = requireNumber(body.amount, "amount");
      const createData = {
        amount,
        amountCents: amountToCents(amount),
        currency: requireString(body.currency, "currency"),
        date: requireDate(body.date, "date"),
        location: requireString(body.location, "location"),
        description: optionalString(body.description, "description"),
        tripId: requireUuidLikeId(body.tripId, "tripId"),
        userId: requireUuidLikeId(body.userId, "userId"),
        categoryId: requireUuidLikeId(body.categoryId, "categoryId"),
        ...(await resolveExpenseReferenceExchange({
          amount,
          currency: requireString(body.currency, "currency"),
          date: requireDate(body.date, "date"),
        })),
      };

      await requireExpenseCreateAccess(prisma, event, createData.tripId, createData.userId);
      const expense = await prisma.expense.create({
        data: createData,
      });

      return normalizeExpenseRecord(expense);
    }

    if (event.node.req.method === "PUT") {
      const expenseId = requireUuidLikeId(body.id, "id");
      const access = await requireExpenseWriteAccess(prisma, event, expenseId);
      const amount = requireNumber(body.amount, "amount");
      const updateData = {
        amount,
        amountCents: amountToCents(amount),
        currency: requireString(body.currency, "currency"),
        date: requireDate(body.date, "date"),
        location: requireString(body.location, "location"),
        description: optionalString(body.description, "description"),
        userId: requireUuidLikeId(body.userId, "userId"),
        tripId: requireUuidLikeId(body.tripId, "tripId"),
        categoryId: requireUuidLikeId(body.categoryId, "categoryId"),
        ...(await resolveExpenseReferenceExchange({
          amount,
          currency: requireString(body.currency, "currency"),
          date: requireDate(body.date, "date"),
        })),
      };

      if (!isAdminUser(access.user)) {
        updateData.userId = access.user.id;
        updateData.tripId = access.expense.tripId;
      }

      const expense = await prisma.expense.update({
        where: {
          id: expenseId,
        },
        data: updateData,
      });

      return normalizeExpenseRecord(expense);
    }

    if (event.node.req.method === "DELETE") {
      const expenseId = requireUuidLikeId(body.id, "id");
      await requireExpenseWriteAccess(prisma, event, expenseId);
      return await prisma.expense.delete({
        where: {
          id: expenseId,
        },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(
      `Http Method ${event.node.req.method} created Database operation error:`,
      error
    );
    throw normalizeRouteError(error);
  }
});
