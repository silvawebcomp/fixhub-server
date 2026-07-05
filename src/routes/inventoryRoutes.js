const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    inventoryUsers,
    inventoryManagers,
    ownerOnly,
} = require("../middleware/permissions");

const {

    getInventory,

    getInventorySummary,

    createInventoryItem,

    updateInventoryItem,

    adjustInventoryItem,

    deleteInventoryItem,

} = require("../controllers/inventoryController");

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Inventory Routes
|--------------------------------------------------------------------------
|
| Permissions are centralized in:
| src/middleware/permissions.js
|
*/

// View inventory
router.get(
    "/",
    inventoryUsers,
    getInventory
);

// View inventory summary
router.get(
    "/summary",
    inventoryUsers,
    getInventorySummary
);

// Create inventory item
router.post(
    "/",
    inventoryManagers,
    createInventoryItem
);

// Update inventory item
router.put(
    "/:id",
    inventoryManagers,
    updateInventoryItem
);

// Adjust inventory quantity
router.post(
    "/:id/adjust",
    inventoryManagers,
    adjustInventoryItem
);

// Delete inventory item
router.delete(
    "/:id",
    ownerOnly,
    deleteInventoryItem
);

module.exports = router;