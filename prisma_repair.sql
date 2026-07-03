BEGIN;

-- =====================================================
-- STEP 1: Add Invoice.userId
-- =====================================================

ALTER TABLE "public"."Invoice"
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

-- =====================================================
-- STEP 2: Populate userId
-- =====================================================

UPDATE "public"."Invoice" AS i
SET "userId" = r."userId"
FROM "public"."Repair" AS r
WHERE i."repairId" = r."id"
  AND i."userId" IS NULL;

-- =====================================================
-- STEP 3: Verify backfill
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."Invoice"
        WHERE "userId" IS NULL
    ) THEN
        RAISE EXCEPTION
        'Invoice.userId could not be populated.';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Make required
-- =====================================================

ALTER TABLE "public"."Invoice"
ALTER COLUMN "userId" SET NOT NULL;

-- =====================================================
-- STEP 5: Create Payment table
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."Payment" (

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
-- STEP 6: Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS
"Payment_invoiceId_paidAt_idx"
ON "public"."Payment"
(
    "invoiceId",
    "paidAt"
);

CREATE INDEX IF NOT EXISTS
"Invoice_userId_createdAt_idx"
ON "public"."Invoice"
(
    "userId",
    "createdAt"
);

-- =====================================================
-- STEP 7: Invoice foreign key
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Invoice_userId_fkey'
    ) THEN

        ALTER TABLE "public"."Invoice"

        ADD CONSTRAINT "Invoice_userId_fkey"

        FOREIGN KEY ("userId")

        REFERENCES "public"."User"("id")

        ON DELETE RESTRICT

        ON UPDATE CASCADE;

    END IF;
END $$;

-- =====================================================
-- STEP 8: Payment foreign key
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Payment_invoiceId_fkey'
    ) THEN

        ALTER TABLE "public"."Payment"

        ADD CONSTRAINT "Payment_invoiceId_fkey"

        FOREIGN KEY ("invoiceId")

        REFERENCES "public"."Invoice"("id")

        ON DELETE CASCADE

        ON UPDATE CASCADE;

    END IF;
END $$;

COMMIT;