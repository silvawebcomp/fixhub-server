const prisma = require("../lib/prisma");

async function logAction({
    userId,
    action,
    entity,
    entityId = null,
    details = null,
}) {
    return prisma.auditLog.create({
        data: {
            userId,
            action,
            entity,
            entityId,
            details,
        },
    });
}

module.exports = {
    logAction,
};