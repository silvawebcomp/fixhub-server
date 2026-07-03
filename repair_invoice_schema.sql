BEGIN;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE "Invoice" AS i
SET "userId" = r."userId"
FROM "Repair" AS r
WHERE i."repairId" = r."id"
  AND i."userId" IS NULL;

ALTER TABLE "Invoice"
ALTER COLUMN "userId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Invoice_userId_fkey'
    ) THEN
        ALTER TABLE "Invoice"
        ADD CONSTRAINT "Invoice_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS
"Invoice_userId_createdAt_idx"
ON "Invoice" ("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "Payment" (

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Payment_invoiceId_fkey'
    ) THEN

        ALTER TABLE "Payment"
        ADD CONSTRAINT "Payment_invoiceId_fkey"
        FOREIGN KEY ("invoiceId")
        REFERENCES "Invoice"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;

    END IF;
END $$;

CREATE INDEX IF NOT EXISTS
"Payment_invoiceId_paidAt_idx"
ON "Payment" ("invoiceId", "paidAt");

COMMIT;