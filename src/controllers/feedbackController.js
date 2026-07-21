const asyncHandler = require("../middleware/asyncHandler");
const feedbackService = require("../services/feedbackService");

async function createFeedback(req, res) {
    const feedback = await feedbackService.createFeedback(
        req.user.workspaceOwnerId,
        req.user,
        req.body,
        req.get("user-agent")
    );

    return res.status(201).json(feedback);
}

async function listFeedback(req, res) {
    const feedback = await feedbackService.listFeedback(
        req.user.workspaceOwnerId,
        {
            status: req.query.status,
            category: req.query.category,
        }
    );

    return res.json(feedback);
}

async function updateFeedbackStatus(req, res) {
    const feedback = await feedbackService.updateFeedbackStatus(
        req.user.workspaceOwnerId,
        req.params.id,
        req.body.status
    );

    if (!feedback) {
        return res.status(404).json({
            message: "Feedback not found.",
        });
    }

    return res.json(feedback);
}

module.exports = {
    createFeedback: asyncHandler(createFeedback),
    listFeedback: asyncHandler(listFeedback),
    updateFeedbackStatus: asyncHandler(updateFeedbackStatus),
};
