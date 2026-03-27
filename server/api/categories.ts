// server/api/categories.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "categories.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("categories.ts, method:", event.node.req.method);
      return await prisma.category.findMany({
        include: {
          expenses: true,
        },
      });
    }

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log("categories.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      return await prisma.category.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      return await prisma.category.update({
        where: {
          id: body.id,
        },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      const category = await prisma.category.delete({
        where: {
          id: body.id,
        },
      });
    }
  } catch (error) {
    `Http Method ${event.node.req.method} created Database operation error: ${error}`;
  }
});
