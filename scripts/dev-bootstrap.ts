import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../utils/password";

const prisma = new PrismaClient();

const defaults = {
  adminEmail: process.env.DEV_BOOTSTRAP_ADMIN_EMAIL ?? "dev-admin@example.com",
  adminPassword: process.env.DEV_BOOTSTRAP_ADMIN_PASSWORD ?? "dev-admin-password",
  adminName: process.env.DEV_BOOTSTRAP_ADMIN_NAME ?? "Developer Admin",
  memberEmail: process.env.DEV_BOOTSTRAP_MEMBER_EMAIL ?? "dev-member@example.com",
  memberPassword: process.env.DEV_BOOTSTRAP_MEMBER_PASSWORD ?? "dev-member-password",
  memberName: process.env.DEV_BOOTSTRAP_MEMBER_NAME ?? "Developer Member",
  tripName: process.env.DEV_BOOTSTRAP_TRIP_NAME ?? "Codex Demo Trip",
  categoryName: process.env.DEV_BOOTSTRAP_CATEGORY_NAME ?? "Meals",
  categoryIcon: process.env.DEV_BOOTSTRAP_CATEGORY_ICON ?? "mdi-silverware-fork-knife",
  currencyName: process.env.DEV_BOOTSTRAP_CURRENCY_NAME ?? "EUR",
  currencySymbol: process.env.DEV_BOOTSTRAP_CURRENCY_SYMBOL ?? "EUR",
};

async function ensureUser(options: {
  email: string;
  password: string;
  name: string;
  role: string;
}) {
  const passwordHash = await hashPassword(options.password);

  return prisma.user.upsert({
    where: { email: options.email },
    create: {
      email: options.email,
      name: options.name,
      password: passwordHash,
      role: options.role,
    },
    update: {
      name: options.name,
      password: passwordHash,
      role: options.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

async function main() {
  const admin = await ensureUser({
    email: defaults.adminEmail,
    password: defaults.adminPassword,
    name: defaults.adminName,
    role: "admin",
  });

  const member = await ensureUser({
    email: defaults.memberEmail,
    password: defaults.memberPassword,
    name: defaults.memberName,
    role: "user",
  });

  const category = await prisma.category.upsert({
    where: { name: defaults.categoryName },
    create: {
      name: defaults.categoryName,
      icon: defaults.categoryIcon,
    },
    update: {
      icon: defaults.categoryIcon,
    },
    select: {
      name: true,
    },
  });

  const currency = await prisma.currency.upsert({
    where: { name: defaults.currencyName },
    create: {
      name: defaults.currencyName,
      displayName: "Euro",
      symbol: defaults.currencySymbol,
      factor: 1,
    },
    update: {
      displayName: "Euro",
      symbol: defaults.currencySymbol,
    },
    select: {
      name: true,
    },
  });

  const usdCurrency = await prisma.currency.upsert({
    where: { name: "USD" },
    create: {
      name: "USD",
      displayName: "United States Dollar",
      symbol: "$",
      factor: 1.08,
    },
    update: {
      displayName: "United States Dollar",
      symbol: "$",
      factor: 1.08,
    },
    select: {
      name: true,
    },
  });

  const trip = await prisma.trip.upsert({
    where: { name: defaults.tripName },
    create: {
      name: defaults.tripName,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
    },
    update: {},
    select: {
      id: true,
      name: true,
    },
  });

  await prisma.tripUser.upsert({
    where: {
      userId_tripId: {
        userId: admin.id,
        tripId: trip.id,
      },
    },
    create: {
      userId: admin.id,
      tripId: trip.id,
    },
    update: {},
  });

  await prisma.tripUser.upsert({
    where: {
      userId_tripId: {
        userId: member.id,
        tripId: trip.id,
      },
    },
    create: {
      userId: member.id,
      tripId: trip.id,
    },
    update: {},
  });

  console.log("Developer bootstrap complete.");
  console.log("");
  console.log("Local login credentials:");
  console.log(`- Admin: ${defaults.adminEmail} / ${defaults.adminPassword}`);
  console.log(`- Member: ${defaults.memberEmail} / ${defaults.memberPassword}`);
  console.log("");
  console.log("Ensured local records:");
  console.log(`- Trip: ${trip.name}`);
  console.log(`- Category: ${category.name}`);
  console.log(`- Currency: ${currency.name}`);
  console.log(`- Currency: ${usdCurrency.name}`);
  console.log("");
  console.log("Optional env overrides:");
  console.log("- DEV_BOOTSTRAP_ADMIN_EMAIL");
  console.log("- DEV_BOOTSTRAP_ADMIN_PASSWORD");
  console.log("- DEV_BOOTSTRAP_MEMBER_EMAIL");
  console.log("- DEV_BOOTSTRAP_MEMBER_PASSWORD");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
