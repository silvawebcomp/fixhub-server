const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

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

router.get("/", getInventory);

router.get("/summary", getInventorySummary);

router.post("/", createInventoryItem);

router.put("/:id", updateInventoryItem);

router.post("/:id/adjust", adjustInventoryItem);

router.delete("/:id", deleteInventoryItem);

module.exports = router;
