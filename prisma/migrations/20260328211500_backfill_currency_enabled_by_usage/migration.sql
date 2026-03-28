UPDATE "Currency"
SET "enabled" = EXISTS (
  SELECT 1
  FROM "Expense"
  WHERE "Expense"."currency" = "Currency"."name"
);
