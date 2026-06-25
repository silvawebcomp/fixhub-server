/*
  Warnings:

  - You are about to drop the column `assignedTechnician` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `deviceBrand` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `deviceModel` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedCost` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `finalCost` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `issue` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the `RepairStatusHistory` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "RepairStatusHistory" DROP CONSTRAINT "RepairStatusHistory_repairId_fkey";

-- DropIndex
DROP INDEX "Repair_ticketNumber_key";

-- AlterTable
ALTER TABLE "Repair"
DROP COLUMN "assignedTechnician",
DROP COLUMN "completedAt",
DROP COLUMN "customerEmail",
DROP COLUMN "customerPhone",
DROP COLUMN "deviceBrand",
DROP COLUMN "deviceModel",
DROP COLUMN "dueDate",
DROP COLUMN "estimatedCost",
DROP COLUMN "finalCost",
DROP COLUMN "issue",
DROP COLUMN "priority",
DROP COLUMN "serialNumber",
DROP COLUMN "ticketNumber",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "RepairStatusHistory";