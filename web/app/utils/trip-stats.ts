export type TripExpenseStatsItem = {
  id: string;
  amount: number;
  date: string;
  currency: string;
  category?: { name: string } | null;
  user?: { id: string; name: string } | null;
};

export function calculateTripStats(expenses: TripExpenseStatsItem[], startDate?: string | null) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const uniquePayers = new Set(expenses.map((expense) => expense.user?.id).filter(Boolean)).size;

  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    const key = expense.category?.name || "Uncategorized";
    totals[key] = (totals[key] || 0) + expense.amount;
    return totals;
  }, {});

  const sortedCategoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((left, right) => right.amount - left.amount);

  const effectiveDates = expenses.map((expense) => expense.date).filter(Boolean);
  if (startDate) {
    effectiveDates.push(startDate);
  }

  const sortedDates = effectiveDates
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  let durationDays = 1;
  if (sortedDates.length > 1) {
    const first = sortedDates[0].getTime();
    const last = sortedDates[sortedDates.length - 1].getTime();
    durationDays = Math.max(1, Math.round((last - first) / 86_400_000) + 1);
  }

  return {
    totalAmount,
    expenseCount: expenses.length,
    uniquePayers,
    durationDays,
    averagePerDay: totalAmount / durationDays,
    categoryBreakdown: sortedCategoryBreakdown,
  };
}
