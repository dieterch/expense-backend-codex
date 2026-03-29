CREATE TABLE "SettlementPayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "amount" REAL NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "date" DATETIME NOT NULL,
  "tripId" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SettlementPayment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SettlementPayment_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SettlementPayment_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SettlementPayment_tripId_date_idx" ON "SettlementPayment"("tripId", "date");
