import { describe, expect, it } from "vitest";
import { normalizeCategoryIcon } from "../../app/utils/category-icon";

describe("normalizeCategoryIcon", () => {
  it("keeps mdi-prefixed icon names unchanged", () => {
    expect(normalizeCategoryIcon("mdi-food")).toBe("mdi-food");
  });

  it("adds the mdi prefix for legacy stored icon names", () => {
    expect(normalizeCategoryIcon("silverware-fork-knife")).toBe("mdi-silverware-fork-knife");
  });

  it("maps legacy aliases to their mdi equivalents", () => {
    expect(normalizeCategoryIcon("fork-knife")).toBe("mdi-silverware-fork-knife");
  });
});
