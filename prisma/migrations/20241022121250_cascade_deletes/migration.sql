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
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "categoryId", "createdAt", "currency", "date", "description", "id", "location", "tripId", "updatedAt", "userId") SELECT "amount", "categoryId", "createdAt", "currency", "date", "description", "id", "location", "tripId", "updatedAt", "userId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE TABLE "new_TripShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "percentage" REAL NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "TripShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripShare_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TripShare" ("id", "percentage", "tripId", "userId") SELECT "id", "percentage", "tripId", "userId" FROM "TripShare";
DROP TABLE "TripShare";
ALTER TABLE "new_TripShare" RENAME TO "TripShare";
CREATE UNIQUE INDEX "TripShare_userId_tripId_key" ON "TripShare"("userId", "tripId");
CREATE TABLE "new_TripUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "TripUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripUser_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TripUser" ("id", "tripId", "userId") SELECT "id", "tripId", "userId" FROM "TripUser";
DROP TABLE "TripUser";
ALTER TABLE "new_TripUser" RENAME TO "TripUser";
CREATE UNIQUE INDEX "TripUser_userId_tripId_key" ON "TripUser"("userId", "tripId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
