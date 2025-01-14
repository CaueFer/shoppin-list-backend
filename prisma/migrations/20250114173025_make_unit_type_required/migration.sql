/*
  Warnings:

  - Made the column `unitType` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "unitType" SET NOT NULL,
ALTER COLUMN "unitType" SET DEFAULT 'UN';
