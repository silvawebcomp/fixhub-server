const {
    getNotificationDraft,
    createNotificationLog,
    getNotificationLogs,
    buildLaunchUrls,
} = require("../services/notificationService");

const asyncHandler = require("../middleware/asyncHandler");

async function getDraft(req, res) {
    const draft = await getNotificationDraft(
        req.user.id,
        req.params.repairId,
        req.query.template
    );

    return res.json(draft);
}

async function getLogs(req, res) {
    const logs = await getNotificationLogs(
        req.user.id,
        req.query.repairId
    );

    return res.json(logs);
}

async function createLog(req, res) {
    const log = await createNotificationLog(
        req.user.id,
        req.body
    );

    return res.status(201).json({
        ...log,
        launchUrl: buildLaunchUrls(log),
    });
}

module.exports = {
    getDraft: asyncHandler(getDraft),
    getLogs: asyncHandler(getLogs),
    createLog: asyncHandler(createLog),
};
