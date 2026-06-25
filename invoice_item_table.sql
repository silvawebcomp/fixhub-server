CREATE TABLE IF NOT EXISTS "InvoiceItem" (

    "id" SERIAL PRIMARY KEY,

    "invoiceId" INTEGER NOT NULL,

    "description" TEXT NOT NULL,

    "quantity" INTEGER NOT NULL,

    "unitPrice" DOUBLE PRECISION NOT NULL,

    "total" DOUBLE PRECISION NOT NULL

);

ALTER TABLE "InvoiceItem"
DROP CONSTRAINT IF EXISTS "InvoiceItem_invoiceId_fkey";

ALTER TABLE "InvoiceItem"
ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"

FOREIGN KEY ("invoiceId")

REFERENCES "Invoice"("id")

ON DELETE CASCADE

ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS
"InvoiceItem_invoiceId_idx"

ON "InvoiceItem"

("invoiceId");