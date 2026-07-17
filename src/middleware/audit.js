const auditService = require("../services/auditService");

function audit(action, entity) {
    return (req, res, next) => {
        res.on("finish", async () => {
            if (res.statusCode >= 400) {
                return;
            }

            try {
                await auditService.logAction({
                    userId: req.user?.id,
                    action,
                    entity,
                    entityId: Number(req.params.id) || null,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        ip: req.ip,
                    },
                });
            } catch (error) {
                console.error("Audit Log Error:", error.message);
            }
        });

        next();
    };
}

module.exports = audit;