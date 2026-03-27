import type { ExpenseReferenceLike } from "./expense-reference";

export type EstimationSettings = {
  defaultMarkupBps: number;
  fixedFeeCents: number;
  weekendSurchargeBps: number;
  currencyMarkupOverrides: Record<string, number>;
};

export type EstimatedExpenseLike = ExpenseReferenceLike & {
  date: string;
};

export const DEFAULT_ESTIMATION_SETTINGS: EstimationSettings = {
  defaultMarkupBps: 75,
  fixedFeeCents: 109,
  weekendSurchargeBps: 0,
  currencyMarkupOverrides: {},
};

function isWeekend(dateValue: string) {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function centsToAmount(cents: number) {
  return cents / 100;
}

export function amountToCents(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function getEstimatedMarkupBps(expense: EstimatedExpenseLike, settings: EstimationSettings) {
  return (
    settings.currencyMarkupOverrides[expense.currency] ??
    settings.defaultMarkupBps
  ) + (isWeekend(expense.date) ? settings.weekendSurchargeBps : 0);
}

export function estimateExpenseEur(expense: EstimatedExpenseLike, settings: EstimationSettings) {
  if (expense.currency === "EUR" || typeof expense.referenceEurAmount !== "number") {
    return {
      estimatedBankMarkupBps: null,
      estimatedFixedFeeCents: null,
      estimatedTotalEurAmount: null,
      estimatedTotalEurAmountCents: null,
    };
  }

  const referenceCents = amountToCents(expense.referenceEurAmount);
  const estimatedBankMarkupBps = getEstimatedMarkupBps(expense, settings);
  const markupCents = Math.round(referenceCents * (estimatedBankMarkupBps / 10_000));
  const estimatedFixedFeeCents = settings.fixedFeeCents;
  const estimatedTotalEurAmountCents = referenceCents + markupCents + estimatedFixedFeeCents;

  return {
    estimatedBankMarkupBps,
    estimatedFixedFeeCents,
    estimatedTotalEurAmountCents,
    estimatedTotalEurAmount: centsToAmount(estimatedTotalEurAmountCents),
  };
}

export function estimateTripTotal(expenses: EstimatedExpenseLike[], settings: EstimationSettings) {
  return expenses.reduce((sum, expense) => {
    const estimate = estimateExpenseEur(expense, settings);
    if (typeof estimate.estimatedTotalEurAmount === "number") {
      return sum + estimate.estimatedTotalEurAmount;
    }

    if (expense.currency === "EUR") {
      return sum + expense.amount;
    }

    return sum + (expense.referenceEurAmount || 0);
  }, 0);
}
