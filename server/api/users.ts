// server/api/users.ts
import { doPreChecks } from "../../utils/precheck";
import prisma from "../../prisma/client.js";
import { requireAdminUser } from "../../utils/access-control";
import { hashPassword } from "../../utils/password";

export default defineEventHandler(async (event) => {
  await doPreChecks(event, "users.ts");
  try {
    if (event.node.req.method === "OPTIONS") {
      console.log("OPTIONS call detected, will not forward this to Database.");
      return;
    }

    requireAdminUser(event);

    if (event.node.req.method === "GET") {
      console.log("users.ts, method:", event.node.req.method);
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
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
      const createData = {
        ...body,
        email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
        password: await hashPassword(body.password),
      };

      return await prisma.user.create({
        data: createData,
      });
    }

    if (event.node.req.method === "PUT") {
      const updateData = {
        ...body,
        email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
      };

      if (typeof body.password === "string" && body.password.length > 0) {
        updateData.password = await hashPassword(body.password);
      } else {
        delete updateData.password;
      }

      return await prisma.user.update({
        where: {
          id: body.id,
        },
        data: updateData,
      });
    }

    if (event.node.req.method === "DELETE") {
      const user = await prisma.user.delete({
        where: {
          id: body.id,
        },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(
      `Http Method ${event.node.req.method} created Database operation error:`,
      error
    );
    throw error;
  }
});
