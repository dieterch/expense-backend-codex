import prisma from "../../../prisma/client.js";
import { requireAdminUser } from "../../../utils/access-control";
import { normalizeRouteError } from "../../../utils/route-error";
import { importCurrenciesFromFrankfurter } from "../../../utils/reference-exchange";

export default defineEventHandler(async (event) => {
  try {
    requireAdminUser(event);

    const importedCurrencies = await importCurrenciesFromFrankfurter();
    const existingCurrencies = await prisma.currency.findMany({
      select: {
        name: true,
        displayName: true,
        factor: true,
        enabled: true,
      },
    });
    const existingByName = new Map(existingCurrencies.map((currency) => [currency.name, currency]));

    await prisma.$transaction(
      importedCurrencies.map((currency) => prisma.currency.upsert({
        where: {
          name: currency.name,
        },
        update: {
          displayName: currency.displayName,
          symbol: currency.symbol,
          factor: currency.factor || 1,
        },
        create: {
          name: currency.name,
          displayName: currency.displayName,
          symbol: currency.symbol,
          factor: currency.factor || 1,
          enabled: true,
        },
      })),
    );

    const currencies = await prisma.currency.findMany({
      select: {
        name: true,
        displayName: true,
        symbol: true,
        factor: true,
        enabled: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const createdCount = importedCurrencies.filter((currency) => !existingByName.has(currency.name)).length;
    const updatedCount = importedCurrencies.length - createdCount;

    return {
      createdCount,
      updatedCount,
      totalCount: currencies.length,
      currencies,
    };
  } catch (error) {
    console.error("currency/import.post.ts import error:", error);
    throw normalizeRouteError(error);
  }
});
