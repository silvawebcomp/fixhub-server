const {
    getNotificationDraft,
    createNotificationLog,
    getNotificationLogs,
    buildLaunchUrls,
} = require("../services/notificationService");

async function getDraft(req, res) {
    try {
        const draft = await getNotificationDraft(
            req.user.id,
            req.params.repairId,
            req.query.template
        );

        return res.json(draft);
    } catch (error) {
        console.error(error);

        return res.status(404).json({
            message: error.message,
        });
    }
}

async function getLogs(req, res) {
    try {
        const logs = await getNotificationLogs(req.user.id, req.query.repairId);

        return res.json(logs);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to fetch notification logs.",
        });
    }
}

async function createLog(req, res) {
    try {
        const log = await createNotificationLog(req.user.id, req.body);

        return res.status(201).json({
            ...log,
            launchUrl: buildLaunchUrls(log),
        });
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message,
        });
    }
}

module.exports = {
    getDraft,
    getLogs,
    createLog,
};
