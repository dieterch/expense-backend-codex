import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import { requireAdminUser, requireAuthenticatedUser } from "../../utils/access-control";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "currency.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    requireAuthenticatedUser(event);

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
      requireAdminUser(event);
      return await (prisma as any).currency.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      requireAdminUser(event);
      return await (prisma as any).currency.update({
        where: { name: body.name },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      requireAdminUser(event);
      return await (prisma as any).currency.delete({
        where: { name: body.name },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(`Http Method ${event.node.req.method} created Database operation error:`, error);
    throw error;
  }
});
