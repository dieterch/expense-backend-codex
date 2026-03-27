import { clearNuxtState } from "#app";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authState, navigateTo } = vi.hoisted(() => ({
  authState: {
    init: vi.fn(),
    isAuthenticated: { value: false },
    isAdmin: { value: false },
    redirectToLogin: vi.fn(),
  },
  navigateTo: vi.fn(),
}));

mockNuxtImport("useAuth", () => () => authState);
mockNuxtImport("navigateTo", () => navigateTo);

describe("route guards", () => {
  beforeEach(() => {
    clearNuxtState();
    authState.init.mockReset();
    authState.redirectToLogin.mockReset();
    navigateTo.mockReset();
    authState.isAuthenticated.value = false;
    authState.isAdmin.value = false;
  });

  it("redirects unauthenticated users to login from protected routes", async () => {
    const middleware = (await import("../../app/middleware/auth")).default;

    await middleware({ fullPath: "/trips/demo" } as any);

    expect(authState.init).toHaveBeenCalled();
    expect(authState.redirectToLogin).toHaveBeenCalledWith("auth-required", "/trips/demo");
  });

  it("blocks non-admin users from admin routes", async () => {
    const middleware = (await import("../../app/middleware/admin")).default;
    authState.isAuthenticated.value = true;

    await middleware({ fullPath: "/admin/users" } as any);

    expect(navigateTo).toHaveBeenCalledWith("/forbidden");
  });

  it("allows admins through the admin middleware", async () => {
    const middleware = (await import("../../app/middleware/admin")).default;
    authState.isAuthenticated.value = true;
    authState.isAdmin.value = true;

    const result = await middleware({ fullPath: "/admin/users" } as any);

    expect(result).toBeUndefined();
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
