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

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log("expenses.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      await requireExpenseCreateAccess(prisma, event, body.tripId, body.userId);
      return await prisma.expense.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      const access = await requireExpenseWriteAccess(prisma, event, body.id);
      if (!isAdminUser(access.user)) {
        body.userId = access.user.id;
        body.tripId = access.expense.tripId;
      }

      return await prisma.expense.update({
        where: {
          id: body.id,
        },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      await requireExpenseWriteAccess(prisma, event, body.id);
      const expense = await prisma.expense.delete({
        where: {
          id: body.id,
        },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(
      `Http Method ${event.node.req.method} created Database operation error:`,
      error
    );
    throw error;
  }
});
