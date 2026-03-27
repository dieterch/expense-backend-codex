import test from "node:test";
import assert from "node:assert/strict";

import { amountToCents } from "../utils/money";

test("amountToCents converts decimal amounts to integer cents", () => {
  assert.equal(amountToCents(0), 0);
  assert.equal(amountToCents(10), 1000);
  assert.equal(amountToCents(12.34), 1234);
  assert.equal(amountToCents(12.345), 1235);
  assert.equal(amountToCents(19.99), 1999);
});
