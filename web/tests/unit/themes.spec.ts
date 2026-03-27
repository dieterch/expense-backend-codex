import { describe, expect, it } from "vitest";
import { APP_THEMES, isThemeName, THEME_OPTIONS } from "../../app/utils/themes";

describe("theme definitions", () => {
  it("defines five selectable app themes", () => {
    expect(Object.keys(APP_THEMES)).toHaveLength(5);
    expect(THEME_OPTIONS).toHaveLength(5);
  });

  it("recognizes valid theme names", () => {
    expect(isThemeName("expense")).toBe(true);
    expect(isThemeName("tide")).toBe(true);
    expect(isThemeName("unknown")).toBe(false);
  });
});
