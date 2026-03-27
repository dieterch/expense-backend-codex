import prisma from "../../prisma/client.js";
import { requireAuthenticatedUser } from "../../utils/access-control";

export default defineEventHandler(async (event) => {
  const authUser = requireAuthenticatedUser(event);

  if (authUser.devAuthBypassed) {
    return {
      id: authUser.id,
      email: "dev-mode@example.local",
      name: "Developer Mode",
      role: authUser.role ?? "developer",
      trips: [],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      trips: {
        select: {
          trip: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    trips: user.trips.map(({ trip }) => trip),
  };
});
