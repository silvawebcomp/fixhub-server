ALTER TABLE "Repair"
ADD COLUMN "ticketNumber" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "deviceBrand" TEXT,
ADD COLUMN "deviceModel" TEXT,
ADD COLUMN "serialNumber" TEXT,
ADD COLUMN "issue" TEXT,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'Normal',
ADD COLUMN "assignedTechnician" TEXT,
ADD COLUMN "estimatedCost" DOUBLE PRECISION,
ADD COLUMN "finalCost" DOUBLE PRECISION,
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Repair"
SET "status" = CASE
  WHEN "status" = 'Pending' THEN 'Received'
  WHEN "status" = 'In Progress' THEN 'Repairing'
  WHEN "status" = 'Waiting Parts' THEN 'Awaiting Parts'
  WHEN "status" = 'Completed' THEN 'Ready'
  ELSE "status"
END;

CREATE TABLE "RepairStatusHistory" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repairId" INTEGER NOT NULL,
    CONSTRAINT "RepairStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Repair_ticketNumber_key" ON "Repair"("ticketNumber");
CREATE INDEX "RepairStatusHistory_repairId_createdAt_idx"
ON "RepairStatusHistory"("repairId", "createdAt");

ALTER TABLE "RepairStatusHistory"
ADD CONSTRAINT "RepairStatusHistory_repairId_fkey"
FOREIGN KEY ("repairId") REFERENCES "Repair"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "RepairStatusHistory" ("status", "createdAt", "repairId")
SELECT "status", "createdAt", "id" FROM "Repair";
