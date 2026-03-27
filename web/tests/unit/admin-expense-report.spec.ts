import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  writeFileXLSX,
  bookNew,
  jsonToSheet,
  bookAppendSheet,
} = vi.hoisted(() => ({
  writeFileXLSX: vi.fn(),
  bookNew: vi.fn(() => ({ sheets: [] })),
  jsonToSheet: vi.fn((rows) => ({ rows })),
  bookAppendSheet: vi.fn(),
}));

vi.mock("xlsx", () => ({
  utils: {
    book_new: bookNew,
    json_to_sheet: jsonToSheet,
    book_append_sheet: bookAppendSheet,
  },
  writeFileXLSX,
}));

import { buildAdminExpenseExportRows, exportAdminExpensesToWorkbook } from "../../app/utils/admin-expense-report";

describe("admin expense report helpers", () => {
  beforeEach(() => {
    writeFileXLSX.mockReset();
    bookNew.mockClear();
    jsonToSheet.mockClear();
    bookAppendSheet.mockClear();
  });

  it("maps expenses into export rows", () => {
    const rows = buildAdminExpenseExportRows([
      {
        id: "expense-1",
        amount: 12.5,
        amountCents: 1250,
        currency: "EUR",
        date: "2026-03-27T12:00:00.000Z",
        location: "Vienna",
        description: "Lunch",
        trip: { id: "trip-1", name: "Codex Demo Trip" },
        user: { id: "user-1", name: "Developer Admin", email: "dev-admin@example.com" },
        category: { id: "cat-1", name: "Meals", icon: "mdi-food" },
      },
    ]);

    expect(rows).toEqual([
      {
        Date: "2026-03-27",
        Trip: "Codex Demo Trip",
        Payer: "Developer Admin",
        PayerEmail: "dev-admin@example.com",
        Category: "Meals",
        Description: "Lunch",
        Location: "Vienna",
        Currency: "EUR",
        Amount: 12.5,
        AmountCents: 1250,
      },
    ]);
  });

  it("writes an xlsx workbook with the expected filename", () => {
    exportAdminExpensesToWorkbook([], "custom-report.xlsx");

    expect(bookNew).toHaveBeenCalled();
    expect(jsonToSheet).toHaveBeenCalledWith([]);
    expect(bookAppendSheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), "Expenses");
    expect(writeFileXLSX).toHaveBeenCalledWith(expect.anything(), "custom-report.xlsx");
  });
});
