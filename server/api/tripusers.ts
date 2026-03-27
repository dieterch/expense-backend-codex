// server/api/tripusers.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import { requireTripAccess } from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import { ensureObjectBody, requireUuidLikeId } from "../../utils/request-validation";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log(
      "tripusers.ts, body:",
      body,
      ", method:",
      event.node.req.method,
    );

    if (event.node.req.method === "POST") {
      const tripId = requireUuidLikeId(body.id, "id");
      await requireTripAccess(prisma, event, tripId);
      return await prisma.tripUser.findMany({
        where: {
          tripId,
          // tripId: "9bb38019-873f-4bf4-8a35-ac4dffb49bf7"
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error("Database operation error:", error);
    throw normalizeRouteError(error);
  }
});

// if (event.node.req.method === "GET") {
//   return await prisma.user.findMany({
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   });
