// server/api/categories.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import { requireAdminUser, requireAuthenticatedUser } from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import { ensureObjectBody, requireString, requireUuidLikeId } from "../../utils/request-validation";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "categories.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    requireAuthenticatedUser(event);

    if (event.node.req.method === "GET") {
      console.log("categories.ts, method:", event.node.req.method);
      return await prisma.category.findMany({
        include: {
          expenses: true,
        },
      });
    }

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log("categories.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      requireAdminUser(event);
      return await prisma.category.create({
        data: {
          name: requireString(body.name, "name"),
          icon: requireString(body.icon, "icon"),
        },
      });
    }

    if (event.node.req.method === "PUT") {
      requireAdminUser(event);
      return await prisma.category.update({
        where: {
          id: requireUuidLikeId(body.id, "id"),
        },
        data: {
          name: requireString(body.name, "name"),
          icon: requireString(body.icon, "icon"),
        },
      });
    }

    if (event.node.req.method === "DELETE") {
      requireAdminUser(event);
      return await prisma.category.delete({
        where: {
          id: requireUuidLikeId(body.id, "id"),
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
