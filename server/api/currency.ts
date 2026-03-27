import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "currency.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("currency.ts, method:", event.node.req.method);
      return await (prisma as any).currency.findMany({
        select: {
          name: true,
          symbol: true,
          factor: true,
        },
      });
    }

    const body = await readBody(event);
    console.log("currency.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      return await (prisma as any).currency.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      return await (prisma as any).currency.update({
        where: { name: body.name },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      return await (prisma as any).currency.delete({
        where: { name: body.name },
      });
    }
  } catch (error) {
    console.error(`Http Method ${event.node.req.method} created Database operation error:`, error);
    throw createError({ statusCode: 500, statusMessage: "Database operation failed" });
  }
});