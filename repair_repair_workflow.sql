ALTER TABLE "Repair"
ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT,
ADD COLUMN IF NOT EXISTS "customerPhone" TEXT,
ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
ADD COLUMN IF NOT EXISTS "deviceBrand" TEXT,
ADD COLUMN IF NOT EXISTS "deviceModel" TEXT,
ADD COLUMN IF NOT EXISTS "serialNumber" TEXT,
ADD COLUMN IF NOT EXISTS "issue" TEXT,
ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'Normal',
ADD COLUMN IF NOT EXISTS "assignedTechnician" TEXT,
ADD COLUMN IF NOT EXISTS "estimatedCost" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "finalCost" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Repair"
SET "status" = CASE
    WHEN "status" = 'Pending' THEN 'Received'
    WHEN "status" = 'In Progress' THEN 'Repairing'
    WHEN "status" = 'Waiting Parts' THEN 'Awaiting Parts'
    WHEN "status" = 'Completed' THEN 'Ready'
    ELSE "status"
END;

CREATE TABLE IF NOT EXISTS "RepairStatusHistory" (

    "id" SERIAL PRIMARY KEY,

    "status" TEXT NOT NULL,

    "note" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "repairId" INTEGER NOT NULL

);

CREATE INDEX IF NOT EXISTS
"RepairStatusHistory_repairId_createdAt_idx"

ON "RepairStatusHistory"

("repairId","createdAt");

DO $$

BEGIN

IF NOT EXISTS (

SELECT 1

FROM pg_constraint

WHERE conname='RepairStatusHistory_repairId_fkey'

)

THEN

ALTER TABLE "RepairStatusHistory"

ADD CONSTRAINT "RepairStatusHistory_repairId_fkey"

FOREIGN KEY ("repairId")

REFERENCES "Repair"("id")

ON DELETE CASCADE

ON UPDATE CASCADE;

END IF;

END $$;

CREATE UNIQUE INDEX IF NOT EXISTS

"Repair_ticketNumber_key"

ON "Repair"("ticketNumber");

INSERT INTO "RepairStatusHistory"

("status","createdAt","repairId")

SELECT

r."status",

r."createdAt",

r."id"

FROM "Repair" r

WHERE NOT EXISTS (

SELECT 1

FROM "RepairStatusHistory" h

WHERE h."repairId"=r."id"

);