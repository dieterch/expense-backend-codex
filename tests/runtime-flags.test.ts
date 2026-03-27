import test from "node:test";
import assert from "node:assert/strict";

import { isTruthyRuntimeFlag } from "../utils/runtime-flags";

test("isTruthyRuntimeFlag accepts common enabled values", () => {
  assert.equal(isTruthyRuntimeFlag(true), true);
  assert.equal(isTruthyRuntimeFlag("true"), true);
  assert.equal(isTruthyRuntimeFlag("TRUE"), true);
  assert.equal(isTruthyRuntimeFlag("1"), true);
  assert.equal(isTruthyRuntimeFlag("yes"), true);
  assert.equal(isTruthyRuntimeFlag("on"), true);
});

test("isTruthyRuntimeFlag rejects falsey and unknown values", () => {
  assert.equal(isTruthyRuntimeFlag(false), false);
  assert.equal(isTruthyRuntimeFlag("false"), false);
  assert.equal(isTruthyRuntimeFlag("0"), false);
  assert.equal(isTruthyRuntimeFlag("off"), false);
  assert.equal(isTruthyRuntimeFlag(undefined), false);
});
