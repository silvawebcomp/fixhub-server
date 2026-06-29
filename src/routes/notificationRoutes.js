const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    createLog,
    getDraft,
    getLogs,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getLogs);
router.post("/", createLog);
router.get("/repairs/:repairId/draft", getDraft);

module.exports = router;
