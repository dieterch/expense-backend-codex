import { createError } from "h3";

type UnknownRecord = Record<string, unknown>;

function validationError(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: message,
  });
}

export function ensureObjectBody(value: unknown, message = "Request body must be an object"): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError(message);
  }

  return value as UnknownRecord;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationError(`${fieldName} is required`);
  }

  return value.trim();
}

export function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw validationError(`${fieldName} must be a string`);
  }

  return value.trim();
}

export function requireNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw validationError(`${fieldName} must be a valid number`);
  }

  return value;
}

export function requireDate(value: unknown, fieldName: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationError(`${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw validationError(`${fieldName} must be a valid ISO date`);
  }

  return parsed;
}

export function optionalDate(value: unknown, fieldName: string): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return requireDate(value, fieldName);
}

export function requireStringArrayOfObjects(
  value: unknown,
  fieldName: string,
  itemValidator: (item: unknown, index: number) => unknown
) {
  if (!Array.isArray(value)) {
    throw validationError(`${fieldName} must be an array`);
  }

  return value.map((item, index) => itemValidator(item, index));
}

export function requireUuidLikeId(value: unknown, fieldName: string): string {
  return requireString(value, fieldName);
}
