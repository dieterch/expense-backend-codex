import type { H3Event } from "h3";

export function isTruthyRuntimeFlag(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return false;
}

export function isDocsEnabled(event: H3Event) {
  return isTruthyRuntimeFlag(useRuntimeConfig(event).docsEnabled);
}
