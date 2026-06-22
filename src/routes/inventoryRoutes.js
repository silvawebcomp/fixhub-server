const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {

    getInventory,

    createInventoryItem,

    updateInventoryItem,

    deleteInventoryItem,

} = require("../controllers/inventoryController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getInventory);

router.post("/", createInventoryItem);

router.put("/:id", updateInventoryItem);

router.delete("/:id", deleteInventoryItem);

module.exports = router;
