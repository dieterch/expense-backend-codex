import { describe, expect, it } from "vitest";
import { calculateTripStats } from "../../app/utils/trip-stats";

describe("calculateTripStats", () => {
  it("computes totals, trip span, payer count, and category breakdown", () => {
    const stats = calculateTripStats([
      {
        id: "expense-1",
        amount: 12.5,
        date: "2026-03-10T12:00:00.000Z",
        currency: "EUR",
        category: { name: "Meals" },
        user: { id: "user-1", name: "Dev Member" },
      },
      {
        id: "expense-2",
        amount: 20,
        date: "2026-03-12T12:00:00.000Z",
        currency: "EUR",
        category: { name: "Transport" },
        user: { id: "user-2", name: "Dev Friend" },
      },
      {
        id: "expense-3",
        amount: 7.5,
        date: "2026-03-12T16:00:00.000Z",
        currency: "EUR",
        category: { name: "Meals" },
        user: { id: "user-1", name: "Dev Member" },
      },
    ], "2026-03-10T08:00:00.000Z");

    expect(stats.totalAmount).toBe(40);
    expect(stats.expenseCount).toBe(3);
    expect(stats.uniquePayers).toBe(2);
    expect(stats.durationDays).toBe(3);
    expect(stats.averagePerDay).toBeCloseTo(13.33, 2);
    expect(stats.categoryBreakdown).toEqual([
      { category: "Meals", amount: 20 },
      { category: "Transport", amount: 20 },
    ]);
  });
});
