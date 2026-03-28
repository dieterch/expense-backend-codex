import { createError } from "h3";
import type { PrismaClient } from "@prisma/client";

import { amountToCents } from "./money";

const DEFAULT_REFERENCE_RATE_API_BASE = "https://api.frankfurter.dev/v2";
const DEFAULT_CURRENCY_API_BASE = "https://api.frankfurter.dev/v2";

type HistoricalRatePayload = Array<{
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
}>;

type FrankfurterCurrencyPayload = Array<{
  iso_code?: string;
  symbol?: string;
}>;

type ExpenseReferenceBackfillRecord = {
  id: string;
  amount: number;
  currency: string;
  date: Date | string;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
  referenceEurAmountCents?: number | null;
};

export type ReferenceExchangeData = {
  referenceRate: number;
  referenceRateProvider: string;
  referenceRateDate: string;
  referenceEurAmountCents: number;
};

function normalizeCurrencyCode(currency: string) {
  return currency.trim().toUpperCase();
}

function resolveReferenceRateApiBase() {
  return (process.env.NITRO_REFERENCE_RATE_API_BASE || DEFAULT_REFERENCE_RATE_API_BASE).replace(/\/$/, "");
}

function resolveCurrencyApiBase() {
  return (process.env.NITRO_CURRENCY_IMPORT_API_BASE || DEFAULT_CURRENCY_API_BASE).replace(/\/$/, "");
}

function resolveReferenceDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

async function fetchHistoricalReferenceRate(options: {
  currency: string;
  date: Date | string;
  fetchImpl?: typeof fetch;
}) {
  const currency = normalizeCurrencyCode(options.currency);

  if (currency === "EUR") {
    return {
      referenceRate: null,
      referenceRateProvider: null,
      referenceRateDate: null,
    };
  }

  const referenceDate = resolveReferenceDate(options.date);
  const url = new URL(`${resolveReferenceRateApiBase()}/rates`);
  url.searchParams.set("base", currency);
  url.searchParams.set("quotes", "EUR");
  url.searchParams.set("date", referenceDate);

  const response = await (options.fetchImpl || fetch)(url);
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch historical EUR reference rate for ${currency}`,
    });
  }

  const payload = await response.json() as HistoricalRatePayload;
  const entry = Array.isArray(payload) ? payload[0] : null;
  const referenceRate = entry?.rate;

  if (!entry?.date || typeof referenceRate !== "number" || !Number.isFinite(referenceRate) || referenceRate <= 0) {
    throw createError({
      statusCode: 502,
      statusMessage: `Reference rate data for ${currency} was incomplete`,
    });
  }

  return {
    referenceRate,
    referenceRateProvider: "Frankfurter",
    referenceRateDate: entry.date,
  };
}

export async function resolveExpenseReferenceExchange(options: {
  amount: number;
  currency: string;
  date: Date | string;
  fetchImpl?: typeof fetch;
}) {
  const exchange = await fetchHistoricalReferenceRate(options);

  if (!exchange.referenceRate || !exchange.referenceRateDate) {
    return {
      ...exchange,
      referenceEurAmountCents: null,
    };
  }

  return {
    ...exchange,
    referenceEurAmountCents: amountToCents(options.amount * exchange.referenceRate),
  };
}

export async function importCurrenciesFromFrankfurter(options?: {
  fetchImpl?: typeof fetch;
}) {
  const url = new URL(`${resolveCurrencyApiBase()}/currencies`);
  const response = await (options?.fetchImpl || fetch)(url);

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch currencies from Frankfurter",
    });
  }

  const payload = await response.json() as FrankfurterCurrencyPayload;
  if (!Array.isArray(payload)) {
    throw createError({
      statusCode: 502,
      statusMessage: "Currency data from Frankfurter was incomplete",
    });
  }

  return payload
    .map((entry) => ({
      name: typeof entry.iso_code === "string" ? normalizeCurrencyCode(entry.iso_code) : "",
      symbol: typeof entry.symbol === "string" && entry.symbol.trim().length > 0
        ? entry.symbol.trim()
        : typeof entry.iso_code === "string"
          ? normalizeCurrencyCode(entry.iso_code)
          : "",
    }))
    .filter((entry) => entry.name.length > 0);
}

function needsReferenceBackfill(expense: ExpenseReferenceBackfillRecord) {
  return normalizeCurrencyCode(expense.currency) !== "EUR" && (
    typeof expense.referenceRate !== "number" ||
    !Number.isFinite(expense.referenceRate) ||
    expense.referenceRate <= 0 ||
    !expense.referenceRateDate ||
    typeof expense.referenceEurAmountCents !== "number"
  );
}

export async function backfillExpenseReferenceExchanges<T extends ExpenseReferenceBackfillRecord>(
  prisma: Pick<PrismaClient, "expense">,
  expenses: T[],
  options?: {
    fetchImpl?: typeof fetch;
  },
) {
  const missingExpenses = expenses.filter(needsReferenceBackfill);

  if (!missingExpenses.length) {
    return expenses;
  }

  const ratesByKey = new Map<string, Awaited<ReturnType<typeof fetchHistoricalReferenceRate>>>();
  const fetchImpl = options?.fetchImpl;

  await Promise.all(
    Array.from(new Set(
      missingExpenses.map((expense) => `${normalizeCurrencyCode(expense.currency)}:${resolveReferenceDate(expense.date)}`),
    )).map(async (key) => {
      const [currency, date] = key.split(":");

      try {
        const exchange = await fetchHistoricalReferenceRate({
          currency,
          date,
          fetchImpl,
        });

        if (exchange.referenceRate && exchange.referenceRateDate) {
          ratesByKey.set(key, exchange);
        }
      } catch (error) {
        console.warn(`Failed to backfill historical EUR reference rate for ${key}:`, error);
      }
    }),
  );

  const updatedById = new Map<string, Partial<T>>();

  await Promise.all(
    missingExpenses.map(async (expense) => {
      const key = `${normalizeCurrencyCode(expense.currency)}:${resolveReferenceDate(expense.date)}`;
      const exchange = ratesByKey.get(key);

      if (!exchange?.referenceRate || !exchange.referenceRateDate) {
        return;
      }

      const updateData = {
        referenceRate: exchange.referenceRate,
        referenceRateProvider: exchange.referenceRateProvider,
        referenceRateDate: exchange.referenceRateDate,
        referenceEurAmountCents: amountToCents(expense.amount * exchange.referenceRate),
      };

      const updatedExpense = await prisma.expense.update({
        where: {
          id: expense.id,
        },
        data: updateData,
      });

      updatedById.set(expense.id, updatedExpense as Partial<T>);
    }),
  );

  return expenses.map((expense) => {
    const updatedExpense = updatedById.get(expense.id);
    return updatedExpense ? { ...expense, ...updatedExpense } : expense;
  });
}
