const prisma = require("../lib/prisma");
const branchService = require("./branchService");

const {
    validateRepair,
} = require("../validators/repairValidation");

const {
    makeTicketNumber,
} = require("../utils/repairUtils");

function repairInclude() {
    return {
        branch: true,
        statusHistory: {
            orderBy: {
                createdAt: "desc",
            },
        },
    };
}

function branchFilter(branchId) {
    if (branchId === "" || branchId === null || branchId === undefined) {
        return {};
    }

    const parsed = Number(branchId);

    return Number.isInteger(parsed)
        ? {
              branchId: parsed,
          }
        : {};
}

async function getRepairs(userId, filters = {}) {
    return prisma.repair.findMany({
        where: {
            userId,
            ...branchFilter(filters.branchId),
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
    const branchId = await branchService.resolveBranchId(userId, body.branchId);

    return prisma.repair.create({
        data: {
            ...repairData,
            branchId,
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
                        body.statusNote?.trim() ||
                        "Repair ticket created",
                },
            },
        },
        include: repairInclude(),
    });
}

async function updateRepair(id, body, userId) {
    const repairData = validateRepair(body);
    const branchId = await branchService.resolveBranchId(userId, body.branchId);

    const existing = await repairExists(id, userId);

    if (!existing) {
        return null;
    }

    const statusChanged =
        existing.status !== repairData.status;

    const completedAt =
        repairData.status === "Collected"
            ? existing.completedAt || new Date()
            : null;

    return prisma.repair.update({
        where: {
            id,
        },
        data: {
            ...repairData,
            branchId,
            completedAt,
            ...(statusChanged
                ? {
                      statusHistory: {
                          create: {
                              status: repairData.status,
                              note:
                                  body.statusNote?.trim() ||
                                  null,
                          },
                      },
                  }
                : {}),
        },
        include: repairInclude(),
    });
}

async function deleteRepair(id, userId) {
    const existing = await repairExists(id, userId);

    if (!existing) {
        return null;
    }

    await prisma.repair.delete({
        where: {
            id,
        },
    });

    return true;
}

module.exports = {
    getRepairs,
    getRepair,
    repairExists,
    createRepair,
    updateRepair,
    deleteRepair,
};
