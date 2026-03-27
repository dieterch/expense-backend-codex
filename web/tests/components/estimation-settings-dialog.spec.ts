import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import EstimationSettingsDialog from "../../app/components/trip/EstimationSettingsDialog.vue";

mockNuxtImport("useRoute", () => () => ({ path: "/trips/demo" }));

describe("estimation settings dialog", () => {
  it("shows settings fields and emits submit", async () => {
    const wrapper = await mountSuspended(EstimationSettingsDialog, {
      props: {
        modelValue: true,
        saving: false,
        form: {
          globalMarkupPercent: 1.5,
          fixedFeeAmount: 0.25,
          weekendMarkupPercent: 0.5,
          currencyFields: [
            { currency: "USD", markupPercent: 2.25 },
          ],
        },
      },
      global: {
        stubs: {
          VDialog: {
            props: ["modelValue"],
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Default markup (%)");
    expect(wrapper.text()).toContain("Weekend surcharge (%)");
    expect(wrapper.text()).toContain("USD markup override (%)");

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeTruthy();
  });
});
