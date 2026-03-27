import { defineComponent } from "vue";
import { clearNuxtState } from "#app";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SELECTED_TRIP_KEY, STORAGE_KEY } from "../../app/composables/useSessionState";
import { useAuth } from "../../app/composables/useAuth";

const { apiGet, navigateTo, fetchMock } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  navigateTo: vi.fn(),
  fetchMock: vi.fn(),
}));

mockNuxtImport("useApi", () => () => ({
  get: apiGet,
}));

mockNuxtImport("navigateTo", () => navigateTo);

const Harness = defineComponent({
  setup() {
    const auth = useAuth();

    return {
      auth,
    };
  },
  template: "<div />",
});

describe("useAuth", () => {
  beforeEach(() => {
    clearNuxtState();
    localStorage.clear();
    apiGet.mockReset();
    navigateTo.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("$fetch", fetchMock);
  });

  it("restores a stored token and fetches the current user", async () => {
    apiGet.mockResolvedValue({
      id: "member-id",
      email: "dev-member@example.com",
      name: "Dev Member",
      role: "user",
    });

    localStorage.setItem(STORAGE_KEY, "saved-token");

    const wrapper = await mountSuspended(Harness);
    await wrapper.vm.auth.init();

    expect(wrapper.vm.auth.token.value).toBe("saved-token");
    expect(apiGet).toHaveBeenCalledWith("/me");
    expect(wrapper.vm.auth.user.value?.email).toBe("dev-member@example.com");
  });

  it("stores the JWT on login and refreshes the current user", async () => {
    fetchMock.mockResolvedValue({
      token: "fresh-token",
      user: {
        id: "member-id",
        email: "dev-member@example.com",
        name: "Dev Member",
        role: "user",
      },
    });
    apiGet.mockResolvedValue({
      id: "member-id",
      email: "dev-member@example.com",
      name: "Dev Member",
      role: "user",
      trips: [],
    });

    const wrapper = await mountSuspended(Harness);
    await wrapper.vm.auth.login("dev-member@example.com", "dev-member-password");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:5678/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe("fresh-token");
    expect(apiGet).toHaveBeenCalledWith("/me");
  });

  it("clears token state and selected trip on logout", async () => {
    localStorage.setItem(STORAGE_KEY, "saved-token");
    localStorage.setItem(SELECTED_TRIP_KEY, "trip-123");

    const wrapper = await mountSuspended(Harness);
    wrapper.vm.auth.token.value = "saved-token";
    wrapper.vm.auth.user.value = {
      id: "member-id",
      email: "dev-member@example.com",
      name: "Dev Member",
      role: "user",
    };

    await wrapper.vm.auth.logout();

    expect(wrapper.vm.auth.token.value).toBeNull();
    expect(wrapper.vm.auth.user.value).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(SELECTED_TRIP_KEY)).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith({
      path: "/login",
      query: {
        reason: "logged-out",
      },
    });
  });
});
