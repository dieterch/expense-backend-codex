// server/api/trips.ts
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
  try {
    const user = requireAuthenticatedUser(event);

    function parseTripUsers(input: unknown, tripId: string) {
      if (input === undefined) {
        return [];
      }

      return requireStringArrayOfObjects(input, "users", (item, index) => {
        const tripUser = ensureObjectBody(item, `users[${index}] must be an object`);
        return {
          userId: requireUuidLikeId(tripUser.userId, `users[${index}].userId`),
          tripId: requireUuidLikeId(tripUser.tripId, `users[${index}].tripId`),
        };
      }).map((tripUser) => ({
        ...tripUser,
        tripId,
      }));
    }

    if (event.node.req.method === "GET") {
      console.log("trips.ts, method:", event.node.req.method);
      return await prisma.trip.findMany({
        where: tripReadWhereForUser(user),
        select: {
          id: true,
          startDate: true,
          endDate: true,
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
      const createdTrip = await prisma.trip.create({
        data: {
          name: requireString(body.name, "name"),
          startDate: requireDate(body.startDate, "startDate"),
          endDate: optionalDate(body.endDate, "endDate"),
        },
      });

      const tripUsers = parseTripUsers(body.users, createdTrip.id);

      if (tripUsers.length) {
        await prisma.tripUser.createMany({
          data: tripUsers.map((tripUser) => ({
            userId: tripUser.userId,
            tripId: createdTrip.id,
          })),
        });
      }

      return createdTrip;
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
      const tripId = requireUuidLikeId(body.id, "id");
      const tripUsers = parseTripUsers(body.users, tripId);
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
