import prisma from "../../../prisma/client.js";
import { createToken } from "../../../utils/jwt";
import { hashPassword, passwordNeedsUpgrade, verifyPassword } from "../../../utils/password";

type LoginBody = {
  email?: string;
  password?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
    },
  });

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  if (passwordNeedsUpgrade(user.password)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
      },
    });
  }

  const secret = new TextEncoder().encode(useRuntimeConfig(event).jwtSecret);
  const token = await createToken(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    secret
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
});
