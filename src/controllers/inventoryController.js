const inventoryService = require("../services/inventoryService");
const asyncHandler = require("../middleware/asyncHandler");

async function getInventory(req, res) {
    try {
        const items = await inventoryService.getInventory(req.user.id, {
            branchId: req.query.branchId,
        });

        res.json(items);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch inventory",
        });
    }
}

async function getInventorySummary(req, res) {
    try {
        const summary = await inventoryService.getInventorySummary(req.user.id, {
            branchId: req.query.branchId,
        });

        res.json(summary);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch inventory summary",
        });
    }
}

async function createInventoryItem(req, res) {
    try {
        const item = await inventoryService.createInventoryItem(
            req.body,
            req.user.id
        );

        res.status(201).json(item);
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || "Failed to create inventory item",
        });
    }
}

async function updateInventoryItem(req, res) {
    try {
        const id = Number(req.params.id);

        const item = await inventoryService.updateInventoryItem(
            id,
            req.user.id,
            req.body
        );

        if (!item) {
            return res.status(404).json({
                message: "Inventory item not found",
            });
        }

        res.json(item);
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || "Failed to update inventory item",
        });
    }
}

async function adjustInventoryItem(req, res) {
    try {
        const id = Number(req.params.id);

        const item = await inventoryService.adjustInventoryItem(
            id,
            req.user.id,
            req.body
        );

        if (!item) {
            return res.status(404).json({
                message: "Inventory item not found",
            });
        }

        res.json(item);
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || "Failed to adjust inventory item",
        });
    }
}

async function deleteInventoryItem(req, res) {
    try {
        const id = Number(req.params.id);
        const deleted = await inventoryService.deleteInventoryItem(id, req.user.id);

        if (deleted.count === 0) {
            return res.status(404).json({
                message: "Inventory item not found",
            });
        }

        res.json({
            message: "Inventory item deleted",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete inventory item",
        });
    }
}

module.exports = {
    getInventory: asyncHandler(getInventory),
    getInventorySummary: asyncHandler(getInventorySummary),
    createInventoryItem: asyncHandler(createInventoryItem),
    updateInventoryItem: asyncHandler(updateInventoryItem),
    adjustInventoryItem: asyncHandler(adjustInventoryItem),
    deleteInventoryItem: asyncHandler(deleteInventoryItem),
};
