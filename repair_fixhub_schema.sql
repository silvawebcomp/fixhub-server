BEGIN;

-- =====================================================
-- STEP 1: Add the missing Invoice.userId column
-- =====================================================

ALTER TABLE "Invoice"
ADD COLUMN "userId" INTEGER;

-- =====================================================
-- STEP 2: Populate userId from the related Repair
-- =====================================================

UPDATE "Invoice" AS i
SET "userId" = r."userId"
FROM "Repair" AS r
WHERE i."repairId" = r."id";

-- =====================================================
-- STEP 3: Verify every invoice has a userId
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Invoice"
        WHERE "userId" IS NULL
    ) THEN
        RAISE EXCEPTION
        'Unable to populate Invoice.userId for all existing invoices.';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Make userId required
-- =====================================================

ALTER TABLE "Invoice"
ALTER COLUMN "userId" SET NOT NULL;

-- =====================================================
-- STEP 5: Create the missing Payment table
-- =====================================================

CREATE TABLE "Payment" (

    "id" SERIAL PRIMARY KEY,

    "invoiceId" INTEGER NOT NULL,

    "amount" DOUBLE PRECISION NOT NULL,

    "method" TEXT NOT NULL,

    "reference" TEXT,

    "notes" TEXT,

    "paidAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "createdAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP

);

-- =====================================================
-- STEP 6: Restore indexes
-- =====================================================

CREATE INDEX "Invoice_userId_createdAt_idx"
ON "Invoice"
(
    "userId",
    "createdAt"
);

CREATE INDEX "Payment_invoiceId_paidAt_idx"
ON "Payment"
(
    "invoiceId",
    "paidAt"
);

-- =====================================================
-- STEP 7: Restore foreign keys
-- =====================================================

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_invoiceId_fkey"
FOREIGN KEY ("invoiceId")
REFERENCES "Invoice"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMIT;