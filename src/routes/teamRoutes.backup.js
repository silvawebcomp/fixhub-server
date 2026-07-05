const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const {
    createMember,
    deleteMember,
    getTeam,
    updateMember,
} = require("../controllers/teamController");

const router = express.Router();
const canManageTeam = requireRole(["Owner", "Admin"]);

router.use(authMiddleware);

router.get("/", getTeam);
router.post("/", canManageTeam, createMember);
router.put("/:id", canManageTeam, updateMember);
router.delete("/:id", canManageTeam, deleteMember);

module.exports = router;
