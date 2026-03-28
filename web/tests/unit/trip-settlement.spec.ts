import { describe, expect, it } from "vitest";
import { calculateTripSettlement } from "../../app/utils/trip-settlement";

describe("calculateTripSettlement", () => {
  it("splits weighted shares and proposes balancing payments", () => {
    const settlement = calculateTripSettlement(
      [
        { user: { id: "user-a", name: "User A", settlementFactor: 1 } },
        { user: { id: "user-b", name: "User B", settlementFactor: 2 } },
        { user: { id: "user-c", name: "User C", settlementFactor: 1 } },
      ],
      [
        { amount: 120, currency: "EUR", user: { id: "user-a", name: "User A" } },
        { amount: 40, currency: "EUR", user: { id: "user-c", name: "User C" } },
      ],
    );

    expect(settlement.totalAmount).toBe(160);
    expect(settlement.factorTotal).toBe(4);
    expect(settlement.members).toEqual([
      { userId: "user-a", name: "User A", factor: 1, paid: 120, share: 40, balance: 80 },
      { userId: "user-c", name: "User C", factor: 1, paid: 40, share: 40, balance: 0 },
      { userId: "user-b", name: "User B", factor: 2, paid: 0, share: 80, balance: -80 },
    ]);
    expect(settlement.payments).toEqual([
      {
        fromUserId: "user-b",
        fromName: "User B",
        toUserId: "user-a",
        toName: "User A",
        amount: 80,
      },
    ]);
  });

  it("uses historical EUR references for foreign-currency expenses", () => {
    const settlement = calculateTripSettlement(
      [
        { user: { id: "user-a", name: "User A", settlementFactor: 1 } },
        { user: { id: "user-b", name: "User B", settlementFactor: 1 } },
      ],
      [
        {
          amount: 100,
          currency: "USD",
          referenceEurAmount: 91,
          user: { id: "user-a", name: "User A" },
        },
      ],
    );

    expect(settlement.totalAmount).toBe(91);
    expect(settlement.members).toEqual([
      { userId: "user-a", name: "User A", factor: 1, paid: 91, share: 45.5, balance: 45.5 },
      { userId: "user-b", name: "User B", factor: 1, paid: 0, share: 45.5, balance: -45.5 },
    ]);
    expect(settlement.payments).toEqual([
      {
        fromUserId: "user-b",
        fromName: "User B",
        toUserId: "user-a",
        toName: "User A",
        amount: 45.5,
      },
    ]);
  });
});
