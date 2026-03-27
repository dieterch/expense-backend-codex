import { createError, H3Error } from "h3";
import { Prisma } from "@prisma/client";

function isH3Error(error: unknown): error is H3Error {
  return error instanceof H3Error;
}

export function normalizeRouteError(error: unknown) {
  if (isH3Error(error)) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return createError({
        statusCode: 409,
        statusMessage: "A record with the same unique value already exists",
      });
    }

    if (error.code === "P2025") {
      return createError({
        statusCode: 404,
        statusMessage: "Requested record was not found",
      });
    }
  }

  return createError({
    statusCode: 500,
    statusMessage: "Internal server error",
  });
}
