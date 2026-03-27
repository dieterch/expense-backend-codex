// server/api/expenses.ts
import { doPreChecks } from "../../utils/precheck";
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

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {
    const user = requireAuthenticatedUser(event);

    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("expenses.ts, method:", event.node.req.method);
      return await prisma.expense.findMany({
        where: expenseReadWhereForUser(user),
        include: {
          trip: true,
          user: true,
          category: true,
        },
      });
    }

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log("expenses.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      const createData = {
        amount: requireNumber(body.amount, "amount"),
        currency: requireString(body.currency, "currency"),
        date: requireDate(body.date, "date"),
        location: requireString(body.location, "location"),
        description: optionalString(body.description, "description"),
        tripId: requireUuidLikeId(body.tripId, "tripId"),
        userId: requireUuidLikeId(body.userId, "userId"),
        categoryId: requireUuidLikeId(body.categoryId, "categoryId"),
      };

      await requireExpenseCreateAccess(prisma, event, createData.tripId, createData.userId);
      return await prisma.expense.create({
        data: createData,
      });
    }

    if (event.node.req.method === "PUT") {
      const expenseId = requireUuidLikeId(body.id, "id");
      const access = await requireExpenseWriteAccess(prisma, event, expenseId);
      const updateData = {
        amount: requireNumber(body.amount, "amount"),
        currency: requireString(body.currency, "currency"),
        date: requireDate(body.date, "date"),
        location: requireString(body.location, "location"),
        description: optionalString(body.description, "description"),
        userId: requireUuidLikeId(body.userId, "userId"),
        tripId: requireUuidLikeId(body.tripId, "tripId"),
        categoryId: requireUuidLikeId(body.categoryId, "categoryId"),
      };

      if (!isAdminUser(access.user)) {
        updateData.userId = access.user.id;
        updateData.tripId = access.expense.tripId;
      }

      return await prisma.expense.update({
        where: {
          id: expenseId,
        },
        data: updateData,
      });
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
