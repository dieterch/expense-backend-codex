/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trip_name_key" ON "Trip"("name");
