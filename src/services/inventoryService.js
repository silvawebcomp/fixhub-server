const prisma = require("../lib/prisma");
const branchService = require("./branchService");

const MOVEMENT_TYPES = ["Stock In", "Stock Out", "Adjustment", "Used for Repair"];

function cleanText(value) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();
    return cleaned || null;
}

function parseNumber(value, fieldName, options = {}) {
    const parsed = Number(value);
    const minimum = options.minimum ?? 0;

    if (!Number.isFinite(parsed) || parsed < minimum) {
        throw new Error(`${fieldName} must be ${minimum > 0 ? "above" : "at least"} ${minimum}.`);
    }

    return parsed;
}

function parseInteger(value, fieldName, options = {}) {
    const parsed = parseNumber(value, fieldName, options);

    if (!Number.isInteger(parsed)) {
        throw new Error(`${fieldName} must be a whole number.`);
    }

    return parsed;
}

function itemInclude() {
    return {
        branch: true,
        movements: {
            orderBy: {
                createdAt: "desc",
            },
            take: 8,
        },
    };
}

async function ensureInventorySchema() {
    await branchService.ensureBranchSchema();

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "sku" TEXT
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "category" TEXT
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "supplier" TEXT
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "location" TEXT
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "reorderLevel" INTEGER NOT NULL DEFAULT 0
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Inventory_userId_category_idx"
        ON "Inventory"("userId", "category")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Inventory_userId_sku_idx"
        ON "Inventory"("userId", "sku")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StockMovement" (
            "id" SERIAL PRIMARY KEY,
            "inventoryId" INTEGER NOT NULL,
            "userId" INTEGER NOT NULL,
            "type" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL,
            "previousQty" INTEGER NOT NULL,
            "newQty" INTEGER NOT NULL,
            "unitCost" DOUBLE PRECISION,
            "reason" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "StockMovement_inventoryId_createdAt_idx"
        ON "StockMovement"("inventoryId", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "StockMovement_userId_createdAt_idx"
        ON "StockMovement"("userId", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        DELETE FROM "StockMovement" AS sm
        WHERE NOT EXISTS (
            SELECT 1
            FROM "Inventory" AS i
            WHERE i."id" = sm."inventoryId"
        )
    `);

    await prisma.$executeRawUnsafe(`
        DELETE FROM "StockMovement" AS sm
        WHERE NOT EXISTS (
            SELECT 1
            FROM "User" AS u
            WHERE u."id" = sm."userId"
        )
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'StockMovement_inventoryId_fkey'
                  AND conrelid = '"StockMovement"'::regclass
            ) THEN
                ALTER TABLE "StockMovement"
                ADD CONSTRAINT "StockMovement_inventoryId_fkey"
                FOREIGN KEY ("inventoryId")
                REFERENCES "Inventory"("id")
                ON DELETE CASCADE
                ON UPDATE CASCADE;
            END IF;
        END $$;
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'StockMovement_userId_fkey'
                  AND conrelid = '"StockMovement"'::regclass
            ) THEN
                ALTER TABLE "StockMovement"
                ADD CONSTRAINT "StockMovement_userId_fkey"
                FOREIGN KEY ("userId")
                REFERENCES "User"("id")
                ON DELETE RESTRICT
                ON UPDATE CASCADE;
            END IF;
        END $$;
    `);
}

function branchFilter(branchId) {
    if (branchId === "" || branchId === null || branchId === undefined) {
        return {};
    }

    const parsed = Number(branchId);

    return Number.isInteger(parsed)
        ? {
              branchId: parsed,
          }
        : {};
}

function normalizeItem(data) {
    const name = cleanText(data.name);

    if (!name) {
        throw new Error("Item name is required.");
    }

    return {
        name,
        quantity: parseInteger(data.quantity, "Quantity"),
        price: parseNumber(data.price, "Unit price"),
        sku: cleanText(data.sku),
        category: cleanText(data.category),
        supplier: cleanText(data.supplier),
        location: cleanText(data.location),
        reorderLevel: parseInteger(data.reorderLevel ?? 0, "Reorder level"),
    };
}

async function getInventory(userId, filters = {}) {
    await ensureInventorySchema();

    return prisma.inventory.findMany({
        where: {
            userId,
            ...branchFilter(filters.branchId),
        },
        include: itemInclude(),
        orderBy: {
            updatedAt: "desc",
        },
    });
}

async function getInventorySummary(userId, filters = {}) {
    await ensureInventorySchema();

    const items = await prisma.inventory.findMany({
        where: {
            userId,
            ...branchFilter(filters.branchId),
        },
        select: {
            quantity: true,
            price: true,
            reorderLevel: true,
            category: true,
        },
    });

    const categories = new Set(items.map((item) => item.category).filter(Boolean));

    return items.reduce(
        (summary, item) => ({
            totalItems: summary.totalItems + 1,
            stockUnits: summary.stockUnits + item.quantity,
            inventoryValue: summary.inventoryValue + item.quantity * item.price,
            lowStockItems:
                summary.lowStockItems +
                (item.quantity <= item.reorderLevel ? 1 : 0),
            categories: categories.size,
        }),
        {
            totalItems: 0,
            stockUnits: 0,
            inventoryValue: 0,
            lowStockItems: 0,
            categories: 0,
        }
    );
}

async function createInventoryItem(data, userId) {
    await ensureInventorySchema();

    const item = normalizeItem(data);
    const branchId = await branchService.resolveBranchId(userId, data.branchId);

    return prisma.$transaction(async (tx) => {
        const created = await tx.inventory.create({
            data: {
                ...item,
                branchId,
                userId,
            },
        });

        await tx.stockMovement.create({
            data: {
                inventoryId: created.id,
                userId,
                type: "Stock In",
                quantity: created.quantity,
                previousQty: 0,
                newQty: created.quantity,
                unitCost: created.price,
                reason: "Initial stock",
            },
        });

        return tx.inventory.findUnique({
            where: {
                id: created.id,
            },
            include: itemInclude(),
        });
    });
}

async function updateInventoryItem(id, userId, data) {
    await ensureInventorySchema();

    const item = normalizeItem(data);
    const branchId = await branchService.resolveBranchId(userId, data.branchId);

    const existing = await prisma.inventory.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!existing) {
        return null;
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.inventory.update({
            where: {
                id,
            },
            data: {
                ...item,
                branchId,
            },
        });

        if (existing.quantity !== updated.quantity) {
            await tx.stockMovement.create({
                data: {
                    inventoryId: id,
                    userId,
                    type: "Adjustment",
                    quantity: updated.quantity - existing.quantity,
                    previousQty: existing.quantity,
                    newQty: updated.quantity,
                    unitCost: updated.price,
                    reason: "Inventory item edited",
                },
            });
        }

        return tx.inventory.findUnique({
            where: {
                id,
            },
            include: itemInclude(),
        });
    });
}

async function adjustInventoryItem(id, userId, data) {
    await ensureInventorySchema();

    const type = cleanText(data.type);
    const quantity = parseInteger(data.quantity, "Movement quantity", {
        minimum: 1,
    });

    if (!type || !MOVEMENT_TYPES.includes(type)) {
        throw new Error("Select a valid stock movement type.");
    }

    const existing = await prisma.inventory.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!existing) {
        return null;
    }

    let newQty = existing.quantity;

    if (type === "Stock In") {
        newQty += quantity;
    } else if (type === "Stock Out" || type === "Used for Repair") {
        newQty -= quantity;
    } else {
        newQty = quantity;
    }

    if (newQty < 0) {
        throw new Error("Stock quantity cannot go below zero.");
    }

    return prisma.$transaction(async (tx) => {
        await tx.inventory.update({
            where: {
                id,
            },
            data: {
                quantity: newQty,
                ...(data.unitCost !== undefined && data.unitCost !== ""
                    ? {
                          price: parseNumber(data.unitCost, "Unit cost"),
                      }
                    : {}),
            },
        });

        await tx.stockMovement.create({
            data: {
                inventoryId: id,
                userId,
                type,
                quantity: type === "Adjustment" ? newQty - existing.quantity : quantity,
                previousQty: existing.quantity,
                newQty,
                unitCost:
                    data.unitCost !== undefined && data.unitCost !== ""
                        ? parseNumber(data.unitCost, "Unit cost")
                        : null,
                reason: cleanText(data.reason),
            },
        });

        return tx.inventory.findUnique({
            where: {
                id,
            },
            include: itemInclude(),
        });
    });
}

async function deleteInventoryItem(id, userId) {
    await ensureInventorySchema();

    return prisma.inventory.deleteMany({
        where: {
            id,
            userId,
        },
    });
}

module.exports = {
    MOVEMENT_TYPES,
    getInventory,
    getInventorySummary,
    createInventoryItem,
    updateInventoryItem,
    adjustInventoryItem,
    deleteInventoryItem,
    ensureInventorySchema,
};
