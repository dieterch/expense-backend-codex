import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveApiBase } from "../../app/utils/api-base";

describe("resolveApiBase", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWindow) {
      vi.stubGlobal("window", originalWindow);
    }
  });

  it("keeps the configured loopback api base on the same machine", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        protocol: "http:",
      },
    });

    expect(resolveApiBase("http://127.0.0.1:5678/api/v1")).toBe("http://127.0.0.1:5678/api/v1");
  });

  it("rewrites a loopback api base to the current browser hostname on LAN devices", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "192.168.1.50",
        protocol: "http:",
      },
    });

    expect(resolveApiBase("http://127.0.0.1:5678/api/v1")).toBe("http://192.168.1.50:5678/api/v1");
  });
});
