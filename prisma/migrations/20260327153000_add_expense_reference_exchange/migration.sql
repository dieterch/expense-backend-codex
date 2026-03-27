-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "referenceRate" REAL;
ALTER TABLE "Expense" ADD COLUMN "referenceRateProvider" TEXT;
ALTER TABLE "Expense" ADD COLUMN "referenceRateDate" TEXT;
ALTER TABLE "Expense" ADD COLUMN "referenceEurAmountCents" INTEGER;
