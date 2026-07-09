const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    managers,
    repairUsers,
} = require("../middleware/permissions");
const {
    createBranch,
    deleteBranch,
    getBranches,
    updateBranch,
} = require("../controllers/branchController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", repairUsers, getBranches);
router.post("/", managers, createBranch);
router.put("/:id", managers, updateBranch);
router.delete("/:id", managers, deleteBranch);

module.exports = router;
