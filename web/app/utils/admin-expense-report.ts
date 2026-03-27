import * as XLSX from "xlsx";

type ExpenseRecord = {
  id: string;
  amount: number;
  amountCents?: number;
  currency: string;
  date: string;
  location: string;
  description?: string | null;
  trip?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
  category?: { id: string; name: string; icon: string };
};

export function buildAdminExpenseExportRows(expenses: ExpenseRecord[]) {
  return expenses.map((expense) => ({
    Date: new Date(expense.date).toISOString().slice(0, 10),
    Trip: expense.trip?.name || "",
    Payer: expense.user?.name || "",
    PayerEmail: expense.user?.email || "",
    Category: expense.category?.name || "",
    Description: expense.description || "",
    Location: expense.location,
    Currency: expense.currency,
    Amount: expense.amount,
    AmountCents: expense.amountCents ?? Math.round(expense.amount * 100),
  }));
}

export function exportAdminExpensesToWorkbook(expenses: ExpenseRecord[], fileName = "expense-admin-report.xlsx") {
  const workbook = XLSX.utils.book_new();
  const rows = buildAdminExpenseExportRows(expenses);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
  XLSX.writeFileXLSX(workbook, fileName);
}
