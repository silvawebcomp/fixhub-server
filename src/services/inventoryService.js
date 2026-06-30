const prisma = require("../lib/prisma");

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
        movements: {
            orderBy: {
                createdAt: "desc",
            },
            take: 8,
        },
    };
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

async function getInventory(userId) {
    return prisma.inventory.findMany({
        where: {
            userId,
        },
        include: itemInclude(),
        orderBy: {
            updatedAt: "desc",
        },
    });
}

async function getInventorySummary(userId) {
    const items = await prisma.inventory.findMany({
        where: {
            userId,
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
    const item = normalizeItem(data);

    return prisma.$transaction(async (tx) => {
        const created = await tx.inventory.create({
            data: {
                ...item,
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
    const item = normalizeItem(data);

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
            data: item,
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
};
