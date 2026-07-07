const prisma = require("../lib/prisma");

const {
    validateRepair,
} = require("../validators/repairValidation");

const {
    makeTicketNumber,
} = require("../utils/repairUtils");

function repairInclude() {
    return {
        statusHistory: {
            orderBy: {
                createdAt: "desc",
            },
        },
    };
}

async function getRepairs(userId) {
    return prisma.repair.findMany({
        where: {
            userId,
        },
        include: repairInclude(),
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
        include: repairInclude(),
    });
}

async function repairExists(id, userId) {
    return prisma.repair.findFirst({
        where: {
            id,
            userId,
        },
        select: {
            id: true,
            status: true,
            completedAt: true,
        },
    });
}

module.exports = {
    validateRepair,
    makeTicketNumber,
    getRepairs,
    getRepair,
    repairExists,
};