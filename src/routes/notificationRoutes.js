const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    notificationUsers,
} = require("../middleware/permissions");

const {
    createLog,
    getDraft,
    getLogs,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
|
| Permissions are centralized in:
| src/middleware/permissions.js
|
| Permission Matrix
|
| View Notification Logs .... Owner, Admin, Front Desk
| Create Notification ....... Owner, Admin, Front Desk
| Generate Draft ............ Owner, Admin, Front Desk
|
|--------------------------------------------------------------------------
*/

// View notification history
router.get(
    "/",
    notificationUsers,
    getLogs
);

// Create a notification log
router.post(
    "/",
    notificationUsers,
    createLog
);

// Generate a notification draft
router.get(
    "/repairs/:repairId/draft",
    notificationUsers,
    getDraft
);

module.exports = router;