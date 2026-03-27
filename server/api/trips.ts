// server/api/trips.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import { requireAdminUser, requireAuthenticatedUser, tripReadWhereForUser } from "../../utils/access-control";
import { normalizeRouteError } from "../../utils/route-error";
import {
  ensureObjectBody,
  optionalDate,
  requireDate,
  requireString,
  requireStringArrayOfObjects,
  requireUuidLikeId,
} from "../../utils/request-validation";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "trips.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    const user = requireAuthenticatedUser(event);

    if (event.node.req.method === "GET") {
      console.log("trips.ts, method:", event.node.req.method);
      return await prisma.trip.findMany({
        where: tripReadWhereForUser(user),
        select: {
          id: true,
          startDate: true,
          name: true,
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          expenses: true,
        },
      });
    }

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log("trips.ts, body:", JSON.stringify(body,null,2), ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      requireAdminUser(event);
      return await prisma.trip.create({
        data: {
          name: requireString(body.name, "name"),
          startDate: requireDate(body.startDate, "startDate"),
          endDate: optionalDate(body.endDate, "endDate"),
        },
      });
    }

    interface UserInput {
      userId: string;
      tripId: string;
    }

    // interface TripUpdateBody {
    //   id: string,
    //   name: string,
    //   startDate: string,
    //   users: UserInput[]
    // }

    // Update Trip - logic to prevent invalid operation in
    // the frontend code.
    if (event.node.req.method === "PUT") {
      requireAdminUser(event);
      const tripUsers = requireStringArrayOfObjects(body.users, "users", (item, index) => {
        const user = ensureObjectBody(item, `users[${index}] must be an object`);
        return {
          userId: requireUuidLikeId(user.userId, `users[${index}].userId`),
          tripId: requireUuidLikeId(user.tripId, `users[${index}].tripId`),
        };
      });
      const tripId = requireUuidLikeId(body.id, "id");
      const updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          name: requireString(body.name, "name"),
          startDate: requireDate(body.startDate, "startDate"),
          endDate: optionalDate(body.endDate, "endDate"),
        },
      });

      // lösche alle tripUser des Trips
      await prisma.tripUser.deleteMany({
        where: {
          tripId,
        },
      });

      // und füge die selektierten user wieder ein.
      await Promise.all(
        tripUsers.map(async (user: UserInput) => {
          await prisma.tripUser.upsert({
            where: {
              userId_tripId: {
                userId: user.userId,
                tripId,
              },
            },
            update: {},
            create: {
              userId: user.userId,
              tripId,
            },
          });
        })
      );

      return updatedTrip;
    }

    if (event.node.req.method === "DELETE") {
      requireAdminUser(event);
      return await prisma.trip.delete({
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
