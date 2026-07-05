const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    managers,
} = require("../middleware/permissions");

const {
    createMember,
    deleteMember,
    getTeam,
    updateMember,
} = require("../controllers/teamController");

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Team Routes
|--------------------------------------------------------------------------
|
| Permissions are centralized in:
| src/middleware/permissions.js
|
| Permission Matrix
|
| View Team ............. Any authenticated user
| Create Member ......... Owner, Admin
| Update Member ......... Owner, Admin
| Delete Member ......... Owner, Admin
|
|--------------------------------------------------------------------------
*/

// View team members
router.get(
    "/",
    getTeam
);

// Create team member
router.post(
    "/",
    managers,
    createMember
);

// Update team member
router.put(
    "/:id",
    managers,
    updateMember
);

// Delete team member
router.delete(
    "/:id",
    managers,
    deleteMember
);

module.exports = router;