export type ExpenseReferenceLike = {
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
  manualReferenceEurAmount?: number | null;
  manualRate?: number | null;
  manualRateProvider?: string | null;
};

export function getExpenseDisplayAmount(expense: ExpenseReferenceLike) {
  if (expense.currency === "EUR") {
    return expense.amount;
  }

  if (typeof expense.referenceEurAmount === "number") {
    return expense.referenceEurAmount;
  }

  if (typeof expense.manualReferenceEurAmount === "number") {
    return expense.manualReferenceEurAmount;
  }

  return expense.amount;
}

export function buildExpenseReferenceSummary(expense: ExpenseReferenceLike) {
  if (expense.currency === "EUR") {
    return null;
  }

  if (
    typeof expense.manualReferenceEurAmount === "number" &&
    typeof expense.manualRate === "number" &&
    Number.isFinite(expense.manualRate) &&
    expense.manualRate > 0
  ) {
    return {
      headline: `(${expense.currency} = ${expense.manualRate.toFixed(4)} EUR)`,
      detail: "",
    };
  }

  if (
    typeof expense.referenceEurAmount !== "number" ||
    typeof expense.referenceRate !== "number" ||
    !expense.referenceRateDate
  ) {
    return {
      headline: "No exchange rate",
      detail: "",
    };
  }

  return {
    headline: `(${expense.currency} = ${expense.referenceRate.toFixed(4)} EUR)`,
    detail: "",
  };
}
