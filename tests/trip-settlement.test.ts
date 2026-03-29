import test from "node:test";
import assert from "node:assert/strict";

import { calculateTripSettlement } from "../web/app/utils/trip-settlement";

test("confirmed settlement payments reduce later suggested balances", () => {
  const participants = [
    { user: { id: "user-a", name: "Alex", settlementFactor: 1 } },
    { user: { id: "user-b", name: "Blair", settlementFactor: 1 } },
  ];

  const expenses = [
    {
      amount: 100,
      currency: "EUR",
      user: { id: "user-a", name: "Alex" },
    },
  ];

  const initialSettlement = calculateTripSettlement(participants, expenses);
  assert.equal(initialSettlement.payments.length, 1);
  assert.equal(initialSettlement.payments[0].fromUserId, "user-b");
  assert.equal(initialSettlement.payments[0].toUserId, "user-a");
  assert.equal(initialSettlement.payments[0].amount, 50);

  const updatedSettlement = calculateTripSettlement(participants, expenses, [
    {
      id: "payment-1",
      tripId: "trip-1",
      fromUserId: "user-b",
      fromName: "Blair",
      toUserId: "user-a",
      toName: "Alex",
      amount: 20,
      amountCents: 2000,
      date: "2025-03-05T12:00:00.000Z",
    },
  ]);

  assert.equal(updatedSettlement.payments.length, 1);
  assert.equal(updatedSettlement.payments[0].amount, 30);

  const alex = updatedSettlement.members.find((member) => member.userId === "user-a");
  const blair = updatedSettlement.members.find((member) => member.userId === "user-b");

  assert.ok(alex);
  assert.ok(blair);
  assert.equal(alex.balance, 30);
  assert.equal(blair.balance, -30);
});
