const express = require("express");
const uploadCustomer = require("../middleware/uploadCustomer");

const authMiddleware = require("../middleware/authMiddleware");

const {
    customerManagers,
    managers,
} = require("../middleware/permissions");

const {

    getCustomers,

    createCustomer,

    updateCustomer,

    deleteCustomer,

} = require("../controllers/customerController");

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Customer Routes
|--------------------------------------------------------------------------
|
| Permissions are centralized in:
| src/middleware/permissions.js
|
*/

// View customers
router.get(
    "/",
    customerManagers,
    getCustomers
);

// Create customer
router.post(
    "/",
    customerManagers,
    uploadCustomer,
    createCustomer
);

// Update customer
router.put(
    "/:id",
    customerManagers,
    uploadCustomer,
    updateCustomer
);

// Delete customer
router.delete(
    "/:id",
    managers,
    deleteCustomer
);

module.exports = router;
