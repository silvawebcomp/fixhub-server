CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "managerName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_userId_name_key" ON "Branch"("userId", "name");
CREATE INDEX "Branch_userId_isDefault_idx" ON "Branch"("userId", "isDefault");

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Repair" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Inventory" ADD COLUMN "branchId" INTEGER;

INSERT INTO "Branch" ("name", "userId", "isDefault", "createdAt", "updatedAt")
SELECT 'Main Branch', "id", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
WHERE "workspaceOwnerId" IS NULL
ON CONFLICT ("userId", "name") DO NOTHING;

UPDATE "Repair" AS r
SET "branchId" = b."id"
FROM "Branch" AS b
WHERE r."userId" = b."userId"
  AND b."isDefault" = true;

UPDATE "Inventory" AS i
SET "branchId" = b."id"
FROM "Branch" AS b
WHERE i."userId" = b."userId"
  AND b."isDefault" = true;

CREATE INDEX "Repair_userId_branchId_idx" ON "Repair"("userId", "branchId");
CREATE INDEX "Inventory_userId_branchId_idx" ON "Inventory"("userId", "branchId");

ALTER TABLE "Repair" ADD CONSTRAINT "Repair_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
