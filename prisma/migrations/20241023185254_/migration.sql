/*
  Warnings:

  - A unique constraint covering the columns `[date,amount,tripId,userId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Expense_date_amount_tripId_userId_key" ON "Expense"("date", "amount", "tripId", "userId");
