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

export function centsToAmount(amountCents: number): number {
  return amountCents / 100;
}

export function normalizeExpenseMoney<T extends { amount: number; amountCents?: number | null }>(expense: T) {
  const amountCents = typeof expense.amountCents === "number" ? expense.amountCents : amountToCents(expense.amount);

  return {
    ...expense,
    amount: centsToAmount(amountCents),
    amountCents,
  };
}

export function normalizeExpenseReference<T extends {
  referenceEurAmountCents?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
}>(expense: T) {
  const referenceEurAmountCents =
    typeof expense.referenceEurAmountCents === "number" ? expense.referenceEurAmountCents : null;

  return {
    ...expense,
    referenceEurAmountCents,
    referenceEurAmount: typeof referenceEurAmountCents === "number" ? centsToAmount(referenceEurAmountCents) : null,
    referenceRate: typeof expense.referenceRate === "number" ? expense.referenceRate : null,
    referenceRateDate: expense.referenceRateDate || null,
    referenceRateProvider: expense.referenceRateProvider || null,
  };
}

export function normalizeExpenseRecord<T extends {
  amount: number;
  amountCents?: number | null;
  referenceEurAmountCents?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
}>(expense: T) {
  return normalizeExpenseReference(normalizeExpenseMoney(expense));
}
