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
    currencies: [{ name: "EUR", displayName: "Euro", symbol: "EUR", factor: 1 }],
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
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("visualViewport", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      width: 1280,
      height: 720,
    });
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn(),
      },
      language: "en-US",
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

  it("autofills location when the dialog opens with an empty location", async () => {
    const getCurrentPosition = vi.fn((resolve: (value: GeolocationPosition) => void) => {
      resolve({
        coords: {
          latitude: 48.2082,
          longitude: 16.3738,
        },
      } as GeolocationPosition);
    });
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition,
      },
      language: "en-US",
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      locality: "Innere Stadt",
      city: "Vienna",
      principalSubdivision: "Vienna",
      countryName: "Austria",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    const wrapper = await mountSuspended(ExpenseEditorDialog, {
      props: {
        ...baseProps,
        form: {
          ...baseProps.form,
          location: "",
        },
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

    await vi.waitFor(() => {
      expect((wrapper.props("form") as any).location).toBe("Innere Stadt, Vienna, Austria");
    });
  });

  it("shows a permission hint when geolocation is blocked", async () => {
    const getCurrentPosition = vi.fn((
      _resolve: (value: GeolocationPosition) => void,
      reject: (reason?: unknown) => void,
    ) => {
      reject({
        code: 1,
      } as GeolocationPositionError);
    });
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition,
      },
      language: "en-US",
    });

    const wrapper = await mountSuspended(ExpenseEditorDialog, {
      props: {
        ...baseProps,
        form: {
          ...baseProps.form,
          location: "",
        },
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

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("Firefox blocked location access for this site.");
    });
  });
});
