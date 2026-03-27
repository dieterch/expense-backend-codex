-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_currency_fkey" FOREIGN KEY ("currency") REFERENCES "Currency" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "categoryId", "createdAt", "currency", "date", "description", "id", "location", "tripId", "updatedAt", "userId") SELECT "amount", "categoryId", "createdAt", "currency", "date", "description", "id", "location", "tripId", "updatedAt", "userId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
