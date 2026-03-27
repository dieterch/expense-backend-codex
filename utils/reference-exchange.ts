import { createError } from "h3";

import { amountToCents } from "./money";

const DEFAULT_REFERENCE_RATE_API_BASE = "https://api.frankfurter.dev/v1";

type HistoricalRatePayload = {
  date?: string;
  rates?: Record<string, number>;
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

export async function resolveExpenseReferenceExchange(options: {
  amount: number;
  currency: string;
  date: Date;
  fetchImpl?: typeof fetch;
}) {
  const currency = normalizeCurrencyCode(options.currency);

  if (currency === "EUR") {
    return {
      referenceRate: null,
      referenceRateProvider: null,
      referenceRateDate: null,
      referenceEurAmountCents: null,
    };
  }

  const referenceDate = options.date.toISOString().slice(0, 10);
  const apiBase = process.env.NITRO_REFERENCE_RATE_API_BASE || DEFAULT_REFERENCE_RATE_API_BASE;
  const url = new URL(`${apiBase.replace(/\/$/, "")}/${referenceDate}`);
  url.searchParams.set("base", currency);
  url.searchParams.set("symbols", "EUR");

  const response = await (options.fetchImpl || fetch)(url);
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch historical EUR reference rate for ${currency}`,
    });
  }

  const payload = await response.json() as HistoricalRatePayload;
  const referenceRate = payload.rates?.EUR;

  if (!payload.date || typeof referenceRate !== "number" || !Number.isFinite(referenceRate) || referenceRate <= 0) {
    throw createError({
      statusCode: 502,
      statusMessage: `Reference rate data for ${currency} was incomplete`,
    });
  }

  return {
    referenceRate,
    referenceRateProvider: "Frankfurter",
    referenceRateDate: payload.date,
    referenceEurAmountCents: amountToCents(options.amount * referenceRate),
  };
}
