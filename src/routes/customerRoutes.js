const express = require("express");

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
    createCustomer
);

// Update customer
router.put(
    "/:id",
    customerManagers,
    updateCustomer
);

// Delete customer
router.delete(
    "/:id",
    managers,
    deleteCustomer
);

module.exports = router;