import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExpenseEditorDialog from "../../app/components/trip/ExpenseEditorDialog.vue";

mockNuxtImport("useRoute", () => () => ({ path: "/trips/demo" }));

describe("expense editor dialog", () => {
  const baseProps = {
    modelValue: true,
    saving: false,
    title: "Add expense",
    submitLabel: "Create expense",
    categories: [{ id: "cat-1", name: "Meals", icon: "mdi-food" }],
    currencies: [{ name: "EUR", symbol: "EUR", factor: 1 }],
    participants: [
      {
        user: {
          id: "user-1",
          name: "Dev Member",
          email: "dev-member@example.com",
        },
      },
    ],
    form: {
      amount: 18,
      currency: "EUR",
      date: "2026-03-27",
      location: "Vienna",
      description: "Dinner",
      categoryId: "cat-1",
      userId: "user-1",
    },
    currentUserName: "Dev Member",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("visualViewport", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      width: 1280,
      height: 720,
    });
  });

  it("shows a payer select for admins", async () => {
    const wrapper = await mountSuspended(ExpenseEditorDialog, {
      props: {
        ...baseProps,
        isAdmin: true,
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

    expect(wrapper.text()).toContain("Payer");
    expect(wrapper.text()).not.toContain("Paying as");
  });

  it("emits submit for a valid member form", async () => {
    const wrapper = await mountSuspended(ExpenseEditorDialog, {
      props: {
        ...baseProps,
        isAdmin: false,
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

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.text()).toContain("Paying as");
  });
});
