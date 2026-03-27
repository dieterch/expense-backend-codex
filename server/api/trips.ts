// server/api/trips.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "trips.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("trips.ts, method:", event.node.req.method);
      return await prisma.trip.findMany({
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

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log("trips.ts, body:", JSON.stringify(body,null,2), ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      try {
          return await prisma.trip.create({
          data: body,
        });
      } catch (error) {
        console.log('trips.ts POST error:', error )
      }
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
      const updatedTrip = await prisma.trip.update({
        where: { id: body.id },
        data: {
          name: body.name,
          startDate: body.startDate,
        },
      });

      // lösche alle tripUser des Trips
      await prisma.tripUser.deleteMany({
        where: {
          tripId: body.id,
        },
      });

      // und füge die selektierten user wieder ein.
      await Promise.all(
        body.users.map(async (user: UserInput) => {
          await prisma.tripUser.upsert({
            where: {
              userId_tripId: {
                userId: user.userId,
                tripId: body.id,
              },
            },
            update: {},
            create: {
              userId: user.userId,
              tripId: body.id,
            },
          });
        })
      );

      return updatedTrip;
    }

    if (event.node.req.method === "DELETE") {
      const trip = await prisma.trip.delete({
        where: {
          id: body.id,
        },
      });
    }
  } catch (error) {
    `Http Method ${event.node.req.method} created Database operation error: ${error}`;
  }
});
