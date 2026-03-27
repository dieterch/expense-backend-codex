import { createError } from "h3";

export function amountToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw createError({
      statusCode: 400,
      statusMessage: "amount must be a valid number",
    });
  }

  return Math.round((amount + Number.EPSILON) * 100);
}
