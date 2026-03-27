import { flushPromises } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";
import LoginPage from "../../app/pages/login.vue";

const { login, navigateTo } = vi.hoisted(() => ({
  login: vi.fn(),
  navigateTo: vi.fn(),
}));

mockNuxtImport("useAuth", () => () => ({
  init: vi.fn(),
  login,
}));

mockNuxtImport("navigateTo", () => navigateTo);

describe("login page", () => {
  beforeEach(() => {
    login.mockReset();
    navigateTo.mockReset();
  });

  it("submits the seeded member credentials and routes to trips", async () => {
    login.mockResolvedValue({
      token: "token",
      user: {
        id: "member-id",
        email: "dev-member@example.com",
        name: "Dev Member",
        role: "user",
      },
    });

    const wrapper = await mountSuspended(LoginPage, {
      global: {
        plugins: [createVuetify()],
      },
    });

    expect(wrapper.text()).toContain("dev-member@example.com / dev-member-password");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(login).toHaveBeenCalledWith("dev-member@example.com", "dev-member-password");
    expect(navigateTo).toHaveBeenCalledWith("/trips");
  });
});
