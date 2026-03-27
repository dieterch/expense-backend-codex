// server/api/tripexpenses.ts
import prisma from "../../prisma/client.js";
import { requireTripAccess } from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import { ensureObjectBody, requireUuidLikeId } from "../../utils/request-validation";
import { normalizeExpenseRecord } from "../../utils/money";

export default defineEventHandler(async (event) => {
  try {
    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log(
      "tripexpenses.ts, body:",
      body,
      ", method:",
      event.node.req.method,
    );

    if (event.node.req.method === "POST") {
      const tripId = requireUuidLikeId(body.id, "id");
      await requireTripAccess(prisma, event, tripId);
      const expenses = await prisma.expense.findMany({
        where: {
          tripId,
          // tripId: "9bb38019-873f-4bf4-8a35-ac4dffb49bf7"
        },
        include: {
          trip: true,
          user: true,
          category: true,
        },
      });

      return expenses.map(normalizeExpenseRecord);
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
