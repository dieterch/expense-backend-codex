import { describe, expect, it } from "vitest";
import {
  DEFAULT_ESTIMATION_SETTINGS,
  estimateExpenseEur,
  estimateTripTotal,
  getEstimatedMarkupBps,
} from "../../app/utils/expense-estimation";

describe("expense estimation helpers", () => {
  it("applies default markup, weekend surcharge, and fixed fee to foreign-currency expenses", () => {
    const settings = {
      ...DEFAULT_ESTIMATION_SETTINGS,
      defaultMarkupBps: 200,
      weekendSurchargeBps: 50,
      fixedFeeCents: 25,
      currencyMarkupOverrides: {},
    };

    const estimate = estimateExpenseEur({
      amount: 10,
      currency: "USD",
      date: "2026-03-28T12:00:00.000Z",
      referenceEurAmount: 9.1,
    }, settings);

    expect(getEstimatedMarkupBps({
      amount: 10,
      currency: "USD",
      date: "2026-03-28T12:00:00.000Z",
      referenceEurAmount: 9.1,
    }, settings)).toBe(250);
    expect(estimate.estimatedFixedFeeCents).toBe(25);
    expect(estimate.estimatedTotalEurAmountCents).toBe(958);
    expect(estimate.estimatedTotalEurAmount).toBe(9.58);
  });

  it("prefers per-currency overrides and leaves EUR expenses untouched", () => {
    const settings = {
      ...DEFAULT_ESTIMATION_SETTINGS,
      defaultMarkupBps: 200,
      currencyMarkupOverrides: {
        USD: 325,
      },
    };

    const usdEstimate = estimateExpenseEur({
      amount: 20,
      currency: "USD",
      date: "2026-03-27T12:00:00.000Z",
      referenceEurAmount: 18,
    }, settings);

    expect(usdEstimate.estimatedBankMarkupBps).toBe(325);
    expect(usdEstimate.estimatedTotalEurAmount).toBe(18.59);

    const eurEstimate = estimateExpenseEur({
      amount: 12,
      currency: "EUR",
      date: "2026-03-27T12:00:00.000Z",
      referenceEurAmount: null,
    }, settings);

    expect(eurEstimate.estimatedBankMarkupBps).toBeNull();
    expect(eurEstimate.estimatedTotalEurAmount).toBeNull();
  });

  it("sums estimated foreign expenses and raw EUR expenses into a trip total", () => {
    const settings = {
      ...DEFAULT_ESTIMATION_SETTINGS,
      defaultMarkupBps: 100,
      fixedFeeCents: 10,
    };

    const total = estimateTripTotal([
      {
        amount: 12,
        currency: "EUR",
        date: "2026-03-27T12:00:00.000Z",
      },
      {
        amount: 10,
        currency: "USD",
        date: "2026-03-27T12:00:00.000Z",
        referenceEurAmount: 9.1,
      },
    ], settings);

    expect(total).toBe(21.29);
  });
});
