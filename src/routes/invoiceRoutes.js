const express = require("express");
const audit = require("../middleware/audit");

const authMiddleware = require("../middleware/authMiddleware");
const uploadInvoice = require("../middleware/uploadInvoice");
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

/*
|--------------------------------------------------------------------------
| Invoice Routes
|--------------------------------------------------------------------------
|
| Permissions are now centralized inside:
| src/middleware/permissions.js
|
*/

// Get all invoices
router.get(
    "/",
    invoiceUsers,
    getAll
);

// Get a single invoice
router.get(
    "/:id",
    invoiceUsers,
    getOne
);

// Create invoice
router.post(
    "/",
    invoiceUsers,
    uploadInvoice,
    audit("CREATE", "Invoice"),
    create
);

// Record payment
router.post(
    "/:id/payments",
    invoiceUsers,
    audit("PAYMENT", "Invoice"),
    recordPayment
);

// Delete invoice
router.delete(
    "/:id",
    ownerOnly,
    audit("DELETE", "Invoice"),
    remove
);

module.exports = router;
