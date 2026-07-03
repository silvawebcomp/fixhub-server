const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    invoiceUsers,
    ownerOnly,
} = require("../middleware/permissions");

const {
    create,
    getAll,
    getOne,
    recordPayment,
    remove,
} = require("../controllers/invoiceController");

const router = express.Router();

router.use(authMiddleware);

// View invoices
router.get(
    "/",
    invoiceUsers,
    getAll
);

// View one invoice
router.get(
    "/:id",
    invoiceUsers,
    getOne
);

// Create invoice
router.post(
    "/",
    invoiceUsers,
    create
);

// Record payment
router.post(
    "/:id/payments",
    invoiceUsers,
    recordPayment
);

// Delete invoice
router.delete(
    "/:id",
    ownerOnly,
    remove
);

module.exports = router;