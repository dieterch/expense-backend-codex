// server/api/tripusers.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import users from "./users";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log(
      "tripusers.ts, body:",
      body,
      ", method:",
      event.node.req.method,
    );

    if (event.node.req.method === "POST") {
      return await prisma.tripUser.findMany({
        where: {
          tripId: body.id,
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
  } catch (error) {
    console.error("Database operation error:", error);
    return { error: "An error occurred during the request." };
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
