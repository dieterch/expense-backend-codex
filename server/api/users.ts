// server/api/users.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    if (event.node.req.method === "GET") {
      console.log("users.ts, method:", event.node.req.method);
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          trips: true,
          expenses: true,
          //shares:true
        },
      });
    }

    const body = await readBody(event); // Verwende readBody statt useBody
    console.log("users.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      return await prisma.user.create({
        data: body,
      });
    }

    if (event.node.req.method === "PUT") {
      return await prisma.user.update({
        where: {
          id: body.id,
        },
        data: body,
      });
    }

    if (event.node.req.method === "DELETE") {
      const user = await prisma.user.delete({
        where: {
          id: body.id,
        },
      });
    }
  } catch (error) {
    `Http Method ${event.node.req.method} created Database operation error: ${error}`;
  }
});
