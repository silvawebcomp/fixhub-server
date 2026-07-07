const prisma = require("../lib/prisma");

async function getRepairs(userId) {
    return prisma.repair.findMany({
        where: {
            userId,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });
}

async function getRepair(id, userId) {
    return prisma.repair.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            statusHistory: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });
}

module.exports = {
    getRepairs,
    getRepair,
};