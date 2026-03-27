// server/api/users.ts
import prisma from "../../prisma/client.js";
import { requireAdminUser } from "../../utils/access-control";
import { hashPassword } from "../../utils/password";
import { normalizeRouteError } from "../../utils/route-error";
import { ensureObjectBody, optionalString, requireString, requireUuidLikeId } from "../../utils/request-validation";

export default defineEventHandler(async (event) => {
  try {
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

    const body = ensureObjectBody(await readBody(event)); // Verwende readBody statt useBody
    console.log("users.ts, body:", body, ", method:", event.node.req.method);

    if (event.node.req.method === "POST") {
      const createData = {
        email: requireString(body.email, "email").toLowerCase(),
        name: requireString(body.name, "name"),
        password: await hashPassword(requireString(body.password, "password")),
        role: requireString(body.role, "role"),
      };

      return await prisma.user.create({
        data: createData,
      });
    }

    if (event.node.req.method === "PUT") {
      const updateData = {
        email: requireString(body.email, "email").toLowerCase(),
        name: requireString(body.name, "name"),
        role: requireString(body.role, "role"),
      };

      const password = optionalString(body.password, "password");
      if (password) {
        updateData.password = await hashPassword(password);
      } else {
        delete updateData.password;
      }

      return await prisma.user.update({
        where: {
          id: requireUuidLikeId(body.id, "id"),
        },
        data: updateData,
      });
    }

    if (event.node.req.method === "DELETE") {
      return await prisma.user.delete({
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
