const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const uploadRepair = require("../middleware/uploadRepair");

const {
    repairUsers,
    repairEditors,
    customerManagers,
    ownerOnly,
} = require("../middleware/permissions");

const {
    getRepairs,
    getRepair,
    createRepair,
    updateRepair,
    deleteRepair,
} = require("../controllers/repairController");

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Repair Routes
|--------------------------------------------------------------------------
|
| Permissions are centralized in:
| src/middleware/permissions.js
|
| Permission Matrix
|
| View Repairs ........ Owner, Admin, Technician, Front Desk
| View Repair ......... Owner, Admin, Technician, Front Desk
| Create Repair ....... Owner, Admin, Front Desk
| Update Repair ....... Owner, Admin, Technician
| Delete Repair ....... Owner only
|
|--------------------------------------------------------------------------
*/

// View all repairs
router.get(
    "/",
    repairUsers,
    getRepairs
);

// View one repair
router.get(
    "/:id",
    repairUsers,
    getRepair
);

// Create repair
router.post(
    "/",
    customerManagers,
    uploadRepair,
    createRepair
);

// Update repair
router.put(
    "/:id",
    repairEditors,
    uploadRepair,
    updateRepair
);

// Delete repair
router.delete(
    "/:id",
    ownerOnly,
    deleteRepair
);

module.exports = router;
