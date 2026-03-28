import test from "node:test";
import assert from "node:assert/strict";

import { backfillExpenseReferenceExchanges, importCurrenciesFromFrankfurter, resolveExpenseReferenceExchange } from "../utils/reference-exchange";

test("resolveExpenseReferenceExchange uses the Frankfurter v2 rates payload", async () => {
  const result = await resolveExpenseReferenceExchange({
    amount: 10,
    currency: "GBP",
    date: "1999-01-04T00:00:00.000Z",
    fetchImpl: async (input) => {
      const url = new URL(String(input));

      assert.equal(url.pathname, "/v2/rates");
      assert.equal(url.searchParams.get("base"), "GBP");
      assert.equal(url.searchParams.get("quotes"), "EUR");
      assert.equal(url.searchParams.get("date"), "1999-01-04");

      return new Response(JSON.stringify([{
        date: "1999-01-04",
        base: "GBP",
        quote: "EUR",
        rate: 1.4215,
      }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    },
  });

  assert.deepEqual(result, {
    referenceRate: 1.4215,
    referenceRateProvider: "Frankfurter",
    referenceRateDate: "1999-01-04",
    referenceEurAmountCents: 1422,
  });
});

test("importCurrenciesFromFrankfurter normalizes iso codes and symbols", async () => {
  const result = await importCurrenciesFromFrankfurter({
    fetchImpl: async () => new Response(JSON.stringify([
      {
        iso_code: " eur ",
        symbol: "€",
      },
      {
        iso_code: "usd",
        symbol: "",
      },
    ]), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }),
  });

  assert.deepEqual(result, [
    {
      name: "EUR",
      symbol: "€",
    },
    {
      name: "USD",
      symbol: "USD",
    },
  ]);
});

test("backfillExpenseReferenceExchanges persists missing historical EUR reference data", async () => {
  const updatedRows: Array<Record<string, unknown>> = [];

  const result = await backfillExpenseReferenceExchanges({
    expense: {
      update: async ({ where, data }) => {
        const updated = {
          id: where.id,
          ...data,
        };
        updatedRows.push(updated);
        return updated;
      },
    },
  } as any, [
    {
      id: "expense-1",
      amount: 10,
      currency: "GBP",
      date: "1999-01-04T12:00:00.000Z",
      referenceRate: null,
      referenceRateDate: null,
      referenceRateProvider: null,
      referenceEurAmountCents: null,
    },
    {
      id: "expense-2",
      amount: 12,
      currency: "EUR",
      date: "1999-01-04T12:00:00.000Z",
      referenceRate: null,
      referenceRateDate: null,
      referenceRateProvider: null,
      referenceEurAmountCents: null,
    },
  ], {
    fetchImpl: async () => new Response(JSON.stringify([{
      date: "1999-01-04",
      base: "GBP",
      quote: "EUR",
      rate: 1.4215,
    }]), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }),
  });

  assert.equal(updatedRows.length, 1);
  assert.deepEqual(updatedRows[0], {
    id: "expense-1",
    referenceRate: 1.4215,
    referenceRateProvider: "Frankfurter",
    referenceRateDate: "1999-01-04",
    referenceEurAmountCents: 1422,
  });
  assert.equal((result[0] as any).referenceRate, 1.4215);
  assert.equal((result[0] as any).referenceEurAmountCents, 1422);
  assert.equal((result[1] as any).referenceRate, null);
});
