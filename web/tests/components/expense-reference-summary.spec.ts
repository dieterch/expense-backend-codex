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

    expect(wrapper.text()).toContain("Reference EUR 9.10");
    expect(wrapper.text()).toContain("Frankfurter");
    expect(wrapper.text()).toContain("2025-02-28");
    expect(wrapper.text()).toContain("1 USD = 0.9100 EUR");
    expect(wrapper.text()).toContain("Estimated EUR 9.58");
    expect(wrapper.text()).toContain("markup 2.50%");
    expect(wrapper.text()).toContain("fee EUR 0.25");
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
});
