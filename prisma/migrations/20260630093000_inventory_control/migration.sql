ALTER TABLE "Inventory"
ADD COLUMN "sku" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "supplier" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "reorderLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Inventory_userId_category_idx"
ON "Inventory"("userId", "category");

CREATE INDEX "Inventory_userId_sku_idx"
ON "Inventory"("userId", "sku");

CREATE TABLE "StockMovement" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockMovement_inventoryId_createdAt_idx"
ON "StockMovement"("inventoryId", "createdAt");

CREATE INDEX "StockMovement_userId_createdAt_idx"
ON "StockMovement"("userId", "createdAt");

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_inventoryId_fkey"
FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
