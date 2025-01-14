-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('KG', 'UN');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "qty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "unitType" "UnitType";
