import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, isPasswordHash, passwordNeedsUpgrade, verifyPassword } from "../utils/password";

test("hashPassword produces a bcrypt hash", async () => {
  const hashed = await hashPassword("secret123");

  assert.equal(isPasswordHash(hashed), true);
  assert.equal(await verifyPassword("secret123", hashed), true);
  assert.equal(await verifyPassword("wrong", hashed), false);
});

test("verifyPassword supports legacy plaintext values for migration safety", async () => {
  assert.equal(await verifyPassword("legacy-secret", "legacy-secret"), true);
  assert.equal(await verifyPassword("wrong", "legacy-secret"), false);
  assert.equal(passwordNeedsUpgrade("legacy-secret"), true);
});
