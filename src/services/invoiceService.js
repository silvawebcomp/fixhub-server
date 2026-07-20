const crypto = require("crypto");
const prisma = require("../lib/prisma");
const repairService = require("./repairService");

const PAYMENT_METHODS = [
    "Cash",
    "Bank Transfer",
    "Card",
    "POS",
    "Mobile Money",
    "Other",
];

function generateInvoiceNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `FH-INV-${date}-${suffix}`;
}

function toMoney(value, fallback = 0) {
    if (value === "" || value === null || value === undefined) {
        return fallback;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function cleanText(value) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();
    return cleaned || null;
}

function normalizeItems(items) {
    if (typeof items === "string") {
        try {
            items = JSON.parse(items);
        } catch (error) {
            throw new Error("Invoice items must be valid JSON.");
        }
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("At least one invoice item is required.");
    }

    return items.map((item) => {
        const description =
            typeof item.description === "string" ? item.description.trim() : "";
        const quantity = Number(item.quantity);
        const unitPrice = toMoney(item.unitPrice);

        if (!description) {
            throw new Error("Every invoice item needs a description.");
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Item quantities must be whole numbers above zero.");
        }

        if (Number.isNaN(unitPrice)) {
            throw new Error("Item prices must be valid positive numbers.");
        }

        return {
            description,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
        };
    });
}

function paymentStatusFor(total, amountPaid) {
    if (amountPaid <= 0) {
        return "Pending";
    }

    if (amountPaid >= total) {
        return "Paid";
    }

    return "Partially Paid";
}

function calculateTotals(data, items, previousAmountPaid = 0) {
    const labourCost = toMoney(data.labourCost);
    const discount = toMoney(data.discount);
    const tax = toMoney(data.tax);
    const initialPayment = toMoney(data.amountPaid);

    if (
        Number.isNaN(labourCost) ||
        Number.isNaN(discount) ||
        Number.isNaN(tax) ||
        Number.isNaN(initialPayment)
    ) {
        throw new Error("Invoice amounts must be valid positive numbers.");
    }

    const partsCost = items.reduce((sum, item) => sum + item.total, 0);
    const subtotal = labourCost + partsCost;
    const total = Math.max(subtotal - discount + tax, 0);
    const amountPaid = previousAmountPaid + initialPayment;
    const balance = Math.max(total - amountPaid, 0);

    return {
        labourCost,
        partsCost,
        subtotal,
        total,
        balance,
        amountPaid,
        discount,
        tax,
        paymentStatus: paymentStatusFor(total, amountPaid),
    };
}

function invoiceInclude() {
    return {
        repair: true,
        items: {
            orderBy: {
                id: "asc",
            },
        },
        payments: {
            orderBy: {
                paidAt: "desc",
            },
        },
    };
}

async function ensureInvoiceSchema() {
    await repairService.ensureRepairSchema();

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Invoice" (
            "id" SERIAL PRIMARY KEY,
            "invoiceNumber" TEXT NOT NULL,
            "repairId" INTEGER NOT NULL,
            "userId" INTEGER NOT NULL,
            "labourCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "paymentMethod" TEXT,
            "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
            "notes" TEXT,
            "attachment" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Invoice"
        ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "repairId" INTEGER,
        ADD COLUMN IF NOT EXISTS "userId" INTEGER,
        ADD COLUMN IF NOT EXISTS "labourCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
        ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
        ADD COLUMN IF NOT EXISTS "notes" TEXT,
        ADD COLUMN IF NOT EXISTS "attachment" TEXT,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InvoiceItem" (
            "id" SERIAL PRIMARY KEY,
            "invoiceId" INTEGER NOT NULL,
            "description" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL,
            "unitPrice" DOUBLE PRECISION NOT NULL,
            "total" DOUBLE PRECISION NOT NULL
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Payment" (
            "id" SERIAL PRIMARY KEY,
            "invoiceId" INTEGER NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "method" TEXT NOT NULL,
            "reference" TEXT,
            "notes" TEXT,
            "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key"
        ON "Invoice"("invoiceNumber")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_repairId_key"
        ON "Invoice"("repairId")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Invoice_userId_createdAt_idx"
        ON "Invoice"("userId", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx"
        ON "InvoiceItem"("invoiceId")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Payment_invoiceId_paidAt_idx"
        ON "Payment"("invoiceId", "paidAt")
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'Invoice_repairId_fkey'
                  AND conrelid = '"Invoice"'::regclass
            ) THEN
                ALTER TABLE "Invoice"
                ADD CONSTRAINT "Invoice_repairId_fkey"
                FOREIGN KEY ("repairId") REFERENCES "Repair"("id")
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'InvoiceItem_invoiceId_fkey'
                  AND conrelid = '"InvoiceItem"'::regclass
            ) THEN
                ALTER TABLE "InvoiceItem"
                ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
                FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'Payment_invoiceId_fkey'
                  AND conrelid = '"Payment"'::regclass
            ) THEN
                ALTER TABLE "Payment"
                ADD CONSTRAINT "Payment_invoiceId_fkey"
                FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END
        $$;
    `);
}

async function createInvoice(userId, data) {
    await ensureInvoiceSchema();

    const repairId = Number(data.repairId);

    if (!Number.isInteger(repairId)) {
        throw new Error("A valid repair ID is required.");
    }

    const items = normalizeItems(data.items);
    const totals = calculateTotals(data, items);

    const repair = await prisma.repair.findFirst({
        where: {
            id: repairId,
            userId,
        },
    });

    if (!repair) {
        throw new Error("Repair not found.");
    }

    const existingInvoice = await prisma.invoice.findFirst({
        where: {
            repairId,
            userId,
        },
    });

    if (existingInvoice) {
        throw new Error("An invoice already exists for this repair.");
    }

    const paymentMethod = cleanText(data.paymentMethod);

    if (totals.amountPaid > 0 && !paymentMethod) {
        throw new Error("Select a payment method for the first payment.");
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
        throw new Error("Select a valid payment method.");
    }

    return prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
            data: {
                invoiceNumber: generateInvoiceNumber(),
                repairId,
                userId,
                labourCost: totals.labourCost,
                partsCost: totals.partsCost,
                subtotal: totals.subtotal,
                discount: totals.discount,
                tax: totals.tax,
                total: totals.total,
                amountPaid: totals.amountPaid,
                balance: totals.balance,
                paymentStatus: totals.paymentStatus,
                paymentMethod,
                attachment: cleanText(data.attachment),
                notes: cleanText(data.notes),
                items: {
                    create: items,
                },
                ...(totals.amountPaid > 0
                    ? {
                          payments: {
                              create: {
                                  amount: totals.amountPaid,
                                  method: paymentMethod,
                                  reference: cleanText(data.paymentReference),
                                  notes: "Initial invoice payment",
                              },
                          },
                      }
                    : {}),
            },
            include: invoiceInclude(),
        });

        return invoice;
    });
}

async function getInvoices(userId) {
    await ensureInvoiceSchema();

    try {
        return await prisma.invoice.findMany({
            where: {
                userId,
            },
            include: invoiceInclude(),
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        if (error.code === "P2021" || error.code === "P2022") {
            return [];
        }

        throw error;
    }
}

async function getInvoice(userId, id) {
    await ensureInvoiceSchema();

    return prisma.invoice.findFirst({
        where: {
            id: Number(id),
            userId,
        },
        include: invoiceInclude(),
    });
}

async function addPayment(userId, invoiceId, data) {
    await ensureInvoiceSchema();

    const amount = toMoney(data.amount);
    const method = cleanText(data.method);
    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

    if (Number.isNaN(amount) || amount <= 0) {
        throw new Error("Payment amount must be above zero.");
    }

    if (!method || !PAYMENT_METHODS.includes(method)) {
        throw new Error("Select a valid payment method.");
    }

    if (Number.isNaN(paidAt.getTime())) {
        throw new Error("Payment date is invalid.");
    }

    const invoice = await prisma.invoice.findFirst({
        where: {
            id: Number(invoiceId),
            userId,
        },
    });

    if (!invoice) {
        throw new Error("Invoice not found.");
    }

    const amountPaid = Math.min(invoice.amountPaid + amount, invoice.total);
    const balance = Math.max(invoice.total - amountPaid, 0);

    return prisma.$transaction(async (tx) => {
        await tx.payment.create({
            data: {
                invoiceId: invoice.id,
                amount,
                method,
                reference: cleanText(data.reference),
                notes: cleanText(data.notes),
                paidAt,
            },
        });

        return tx.invoice.update({
            where: {
                id: invoice.id,
            },
            data: {
                amountPaid,
                balance,
                paymentStatus: paymentStatusFor(invoice.total, amountPaid),
                paymentMethod: method,
            },
            include: invoiceInclude(),
        });
    });
}

async function deleteInvoice(userId, id) {
    await ensureInvoiceSchema();

    const deleted = await prisma.invoice.deleteMany({
        where: {
            id: Number(id),
            userId,
        },
    });

    return deleted.count;
}

module.exports = {
    PAYMENT_METHODS,
    createInvoice,
    getInvoices,
    getInvoice,
    addPayment,
    deleteInvoice,
    ensureInvoiceSchema,
};
