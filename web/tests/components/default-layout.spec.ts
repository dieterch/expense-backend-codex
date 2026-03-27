import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";
import DefaultLayout from "../../app/layouts/default.vue";

const { authState, routeState } = vi.hoisted(() => ({
  authState: {
    initialized: { value: true },
    user: { value: { name: "Dev Member" } },
    isAdmin: { value: false },
    logout: vi.fn(),
  },
  routeState: {
    path: "/trips",
  },
}));

mockNuxtImport("useAuth", () => () => authState);
mockNuxtImport("useRoute", () => () => routeState);

describe("default layout", () => {
  beforeEach(() => {
    authState.logout.mockReset();
    authState.initialized.value = true;
    authState.isAdmin.value = false;
    routeState.path = "/trips";
  });

  it("hides admin navigation for non-admin users", async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: () => "Trips content",
      },
      global: {
        plugins: [createVuetify()],
      },
    });

    expect(wrapper.text()).toContain("Trips");
    expect(wrapper.text()).not.toContain("Users");
    expect(wrapper.text()).not.toContain("Categories");
    expect(wrapper.text()).not.toContain("Currencies");
    expect(wrapper.text()).not.toContain("All Expenses");
  });

  it("shows admin navigation for admins", async () => {
    authState.isAdmin.value = true;
    authState.user.value = { name: "Dev Admin" };

    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: () => "Admin content",
      },
      global: {
        plugins: [createVuetify()],
      },
    });

    expect(wrapper.text()).toContain("Users");
    expect(wrapper.text()).toContain("Categories");
    expect(wrapper.text()).toContain("Currencies");
    expect(wrapper.text()).toContain("All Expenses");
    expect(wrapper.text()).toContain("admin");
  });
});
