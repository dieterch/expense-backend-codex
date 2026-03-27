// server/api/tripexpenses.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {

    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log(
      "tripexpenses.ts, body:",
      body,
      ", method:",
      event.node.req.method,
    );

    if (event.node.req.method === "POST") {
      return await prisma.expense.findMany({
        where: {
          tripId: body.id,
          // tripId: "9bb38019-873f-4bf4-8a35-ac4dffb49bf7"
        },
        include: {
          trip: true,
          user: true,
          category: true,
        },
      });
    }
  } catch (error) {
    console.error(
      `Http Method ${event.node.req.method} created Database operation error: ${error}`
    );
    return;
  }
});
