import test from "node:test";
import assert from "node:assert/strict";

import { amountToCents, centsToAmount, normalizeExpenseMoney } from "../utils/money";

test("amountToCents converts decimal amounts to integer cents", () => {
  assert.equal(amountToCents(0), 0);
  assert.equal(amountToCents(10), 1000);
  assert.equal(amountToCents(12.34), 1234);
  assert.equal(amountToCents(12.345), 1235);
  assert.equal(amountToCents(19.99), 1999);
});

test("normalizeExpenseMoney returns consistent amount and amountCents", () => {
  assert.deepEqual(normalizeExpenseMoney({ amount: 12.34, amountCents: null }), {
    amount: 12.34,
    amountCents: 1234,
  });

  assert.equal(centsToAmount(1999), 19.99);
  assert.deepEqual(normalizeExpenseMoney({ amount: 12.34, amountCents: 1999 }), {
    amount: 19.99,
    amountCents: 1999,
  });
});
