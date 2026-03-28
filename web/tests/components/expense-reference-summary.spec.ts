import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ExpenseReferenceSummary from "../../app/components/trip/ExpenseReferenceSummary.vue";

mockNuxtImport("useRoute", () => () => ({ path: "/trips/demo" }));

describe("expense reference summary", () => {
  it("shows reference EUR details for foreign-currency expenses", async () => {
    const wrapper = await mountSuspended(ExpenseReferenceSummary, {
      props: {
        amount: 10,
        currency: "USD",
        referenceEurAmount: 9.1,
        referenceRate: 0.91,
        referenceRateDate: "2025-02-28",
        referenceRateProvider: "Frankfurter",
        estimatedTotalEurAmount: 9.58,
        estimatedBankMarkupBps: 250,
        estimatedFixedFeeCents: 25,
      },
    });

    expect(wrapper.text()).toContain("(USD = 0.9100 EUR)");
    expect(wrapper.text()).not.toContain("Estimated EUR");
    expect(wrapper.text()).not.toContain("markup");
    expect(wrapper.text()).not.toContain("fee EUR");
  });

  it("renders nothing for EUR expenses", async () => {
    const wrapper = await mountSuspended(ExpenseReferenceSummary, {
      props: {
        amount: 10,
        currency: "EUR",
      },
    });

    expect(wrapper.text()).toBe("");
  });

  it("falls back to the configured manual exchange rate when the historical reference is missing", async () => {
    const wrapper = await mountSuspended(ExpenseReferenceSummary, {
      props: {
        amount: 135,
        currency: "GBP",
        manualReferenceEurAmount: 157.95,
        manualRate: 1.17,
        manualRateProvider: "Configured manual exchange rate",
        estimatedTotalEurAmount: 160.22,
        estimatedBankMarkupBps: 75,
        estimatedFixedFeeCents: 109,
      },
    });

    expect(wrapper.text()).toContain("(GBP = 1.1700 EUR)");
    expect(wrapper.text()).not.toContain("Estimated EUR");
  });
});
