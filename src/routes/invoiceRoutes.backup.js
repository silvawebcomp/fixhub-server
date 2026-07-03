const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const {
    create,
    getAll,
    getOne,
    recordPayment,
    remove,
} = require("../controllers/invoiceController");

const router = express.Router();

router.use(authMiddleware);

// Permission groups
const invoiceUsers = requireRole([
    "Owner",
    "Admin",
    "Front Desk",
]);

const ownerOnly = requireRole([
    "Owner",
]);

// Invoice routes
router.get("/", invoiceUsers, getAll);

router.get("/:id", invoiceUsers, getOne);

router.post("/", invoiceUsers, create);

router.post("/:id/payments", invoiceUsers, recordPayment);

router.delete("/:id", ownerOnly, remove);

module.exports = router;
