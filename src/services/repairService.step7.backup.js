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

async function createRepair(body, userId) {
    const repairData = validateRepair(body);

    return prisma.repair.create({
        data: {
            ...repairData,
            ticketNumber: makeTicketNumber(),
            completedAt:
                repairData.status === "Collected"
                    ? new Date()
                    : null,
            userId,
            statusHistory: {
                create: {
                    status: repairData.status,
                    note:
                        repairData.notes ||
                        "Repair ticket created",
                },
            },
        },
        include: repairInclude(),
    });
}

module.exports = {
    validateRepair,
    makeTicketNumber,
    getRepairs,
    getRepair,
    repairExists,
    createRepair,
};