const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    managers,
} = require("../middleware/permissions");
const {
    createFeedback,
    listFeedback,
    updateFeedbackStatus,
} = require("../controllers/feedbackController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createFeedback);
router.get("/", managers, listFeedback);
router.patch("/:id", managers, updateFeedbackStatus);

module.exports = router;
