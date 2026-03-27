// server/api/expenses.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {

    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("expenses.ts, method:", event.node.req.method);
      return await prisma.expense.findMany({
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
      return await prisma.expense.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      return await prisma.expense.update({
        where: {
          id: body.id,
        },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      const expense = await prisma.expense.delete({
        where: {
          id: body.id,
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
