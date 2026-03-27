export type ExpenseReferenceLike = {
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
};

export function getExpenseDisplayAmount(expense: ExpenseReferenceLike) {
  if (expense.currency === "EUR") {
    return expense.amount;
  }

  return typeof expense.referenceEurAmount === "number" ? expense.referenceEurAmount : expense.amount;
}

export function buildExpenseReferenceSummary(expense: ExpenseReferenceLike) {
  if (expense.currency === "EUR") {
    return null;
  }

  if (
    typeof expense.referenceEurAmount !== "number" ||
    typeof expense.referenceRate !== "number" ||
    !expense.referenceRateDate
  ) {
    return {
      headline: "Reference EUR unavailable",
      detail: "Historical conversion has not been loaded for this expense yet.",
    };
  }

  const provider = expense.referenceRateProvider || "Reference rate";

  return {
    headline: `Reference EUR ${expense.referenceEurAmount.toFixed(2)}`,
    detail: `${provider} · ${expense.referenceRateDate} · 1 ${expense.currency} = ${expense.referenceRate.toFixed(4)} EUR`,
  };
}
