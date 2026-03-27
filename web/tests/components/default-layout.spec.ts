import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";
import DefaultLayout from "../../app/layouts/default.vue";
import { APP_THEMES, DEFAULT_THEME_NAME } from "../../app/utils/themes";

const { authState, routeState, themeState } = vi.hoisted(() => ({
  authState: {
    initialized: { value: true },
    user: { value: { name: "Dev Member" } },
    isAdmin: { value: false },
    logout: vi.fn(),
  },
  routeState: {
    path: "/trips",
  },
  themeState: {
    selectedTheme: { value: "expense" },
    initialized: { value: true },
    init: vi.fn(),
    setTheme: vi.fn((value: string) => {
      themeState.selectedTheme.value = value;
    }),
  },
}));

mockNuxtImport("useAuth", () => () => authState);
mockNuxtImport("useRoute", () => () => routeState);
mockNuxtImport("useThemePreferences", () => () => themeState);

function createTestVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: DEFAULT_THEME_NAME,
      themes: APP_THEMES,
    },
  });
}

describe("default layout", () => {
  beforeEach(() => {
    authState.logout.mockReset();
    authState.initialized.value = true;
    authState.isAdmin.value = false;
    routeState.path = "/trips";
    themeState.selectedTheme.value = "expense";
    themeState.init.mockReset();
    themeState.setTheme.mockClear();
  });

  it("hides admin navigation for non-admin users", async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: () => "Trips content",
      },
      global: {
        plugins: [createTestVuetify()],
      },
    });

    expect(wrapper.text()).toContain("Trips");
    expect(wrapper.text()).not.toContain("Users");
    expect(wrapper.text()).not.toContain("Categories");
    expect(wrapper.text()).not.toContain("Currencies");
    expect(wrapper.text()).not.toContain("All Expenses");
    expect(wrapper.text()).toContain("Theme");
  });

  it("shows admin navigation for admins", async () => {
    authState.isAdmin.value = true;
    authState.user.value = { name: "Dev Admin" };

    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: () => "Admin content",
      },
      global: {
        plugins: [createTestVuetify()],
      },
    });

    expect(wrapper.text()).toContain("Users");
    expect(wrapper.text()).toContain("Categories");
    expect(wrapper.text()).toContain("Currencies");
    expect(wrapper.text()).toContain("All Expenses");
    expect(wrapper.text()).toContain("admin");
  });

  it("initializes theme preferences and exposes the available theme labels", async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      slots: {
        default: () => "Trips content",
      },
      global: {
        plugins: [createTestVuetify()],
      },
    });

    expect(themeState.init).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Atlas");
  });
});
