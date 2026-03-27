import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import {
  ensureObjectBody,
  optionalDate,
  optionalString,
  requireDate,
  requireNumber,
  requireString,
  requireStringArrayOfObjects,
} from "../utils/request-validation";
import { normalizeRouteError } from "../utils/route-error";

test("ensureObjectBody accepts plain objects and rejects arrays", () => {
  assert.deepEqual(ensureObjectBody({ ok: true }), { ok: true });
  assert.throws(() => ensureObjectBody([]), (error: any) => error?.statusCode === 400);
});

test("request validators enforce required values", () => {
  assert.equal(requireString(" hello ", "name"), "hello");
  assert.equal(optionalString(undefined, "note"), undefined);
  assert.equal(requireNumber(12.5, "amount"), 12.5);
  assert.equal(requireDate("2025-01-01T00:00:00.000Z", "date").toISOString(), "2025-01-01T00:00:00.000Z");
  assert.equal(optionalDate(null, "endDate"), null);

  assert.throws(() => requireString("", "name"), (error: any) => error?.statusCode === 400);
  assert.throws(() => requireNumber("12", "amount"), (error: any) => error?.statusCode === 400);
  assert.throws(() => requireDate("nope", "date"), (error: any) => error?.statusCode === 400);
});

test("requireStringArrayOfObjects validates array bodies", () => {
  const result = requireStringArrayOfObjects([{ id: "a" }], "items", (item) => {
    const body = ensureObjectBody(item, "item must be an object");
    return { id: requireString(body.id, "item.id") };
  });

  assert.deepEqual(result, [{ id: "a" }]);
  assert.throws(() => requireStringArrayOfObjects({}, "items", () => null), (error: any) => error?.statusCode === 400);
});

test("normalizeRouteError maps prisma and unknown errors", () => {
  const uniqueError = new Prisma.PrismaClientKnownRequestError("unique", {
    code: "P2002",
    clientVersion: "test",
  });

  const notFoundError = new Prisma.PrismaClientKnownRequestError("missing", {
    code: "P2025",
    clientVersion: "test",
  });

  assert.equal(normalizeRouteError(uniqueError).statusCode, 409);
  assert.equal(normalizeRouteError(notFoundError).statusCode, 404);
  assert.equal(normalizeRouteError(new Error("boom")).statusCode, 500);
});
