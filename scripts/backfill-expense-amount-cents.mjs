import "dotenv/config";
import { PrismaClient } from "@prisma/client";

function amountToCents(amount) {
  return Math.round((amount + Number.EPSILON) * 100);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.replace("${PWD}", process.cwd());
  const prisma = new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
  });

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        amountCents: null,
      },
      select: {
        id: true,
        amount: true,
      },
    });

    for (const expense of expenses) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          amountCents: amountToCents(expense.amount),
        },
      });
    }

    console.log(`Backfilled amountCents for ${expenses.length} expenses.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Expense amountCents backfill failed:", error);
  process.exit(1);
});
