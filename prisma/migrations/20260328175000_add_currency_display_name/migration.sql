ALTER TABLE "Currency" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';

UPDATE "Currency"
SET "displayName" = CASE "name"
  WHEN 'EUR' THEN 'Euro'
  WHEN 'USD' THEN 'United States Dollar'
  ELSE "name"
END
WHERE "displayName" = '';
