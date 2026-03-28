import prisma from "../../prisma/client.js";
import { requireAdminUser, requireAuthenticatedUser } from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import { ensureObjectBody, requireNumber, requireString } from "../../utils/request-validation";

function requireBoolean(value: unknown, fieldName: string) {
  if (typeof value !== "boolean") {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} must be a boolean` });
  }

  return value;
}

export default defineEventHandler(async (event) => {
  try {
    requireAuthenticatedUser(event);

    if (event.node.req.method === "GET") {
      console.log("currency.ts, method:", event.node.req.method);
      return await (prisma as any).currency.findMany({
        select: {
          name: true,
          displayName: true,
          symbol: true,
          factor: true,
          enabled: true,
        },
      });
    }

    const body = ensureObjectBody(await readBody(event));
    console.log("currency.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      requireAdminUser(event);
      return await (prisma as any).currency.create({
        data: {
          name: requireString(body.name, "name"),
          displayName: requireString(body.displayName, "displayName"),
          symbol: requireString(body.symbol, "symbol"),
          factor: requireNumber(body.factor, "factor"),
          enabled: requireBoolean(body.enabled, "enabled"),
        },
      });
    }

    if (event.node.req.method === "PUT") {
      requireAdminUser(event);
      return await (prisma as any).currency.update({
        where: { name: requireString(body.name, "name") },
        data: {
          displayName: requireString(body.displayName, "displayName"),
          symbol: requireString(body.symbol, "symbol"),
          factor: requireNumber(body.factor, "factor"),
          enabled: requireBoolean(body.enabled, "enabled"),
        },
      });
    }

    if (event.node.req.method === "DELETE") {
      requireAdminUser(event);
      return await (prisma as any).currency.delete({
        where: { name: requireString(body.name, "name") },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(`Http Method ${event.node.req.method} created Database operation error:`, error);
    throw normalizeRouteError(error);
  }
});
