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

module.exports = {
    getRepairs,
};