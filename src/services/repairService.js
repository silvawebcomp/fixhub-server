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

function isMissingSchemaError(error) {
    return (
        error?.code === "P2021" ||
        error?.code === "P2022" ||
        /table .* does not exist/i.test(error?.message || "") ||
        /column .* does not exist/i.test(error?.message || "")
    );
}

function normalizeLegacyRepair(repair) {
    if (!repair) {
        return null;
    }

    return {
        id: repair.id,
        ticketNumber: repair.ticketNumber || null,
        customer: repair.customer,
        customerPhone: repair.customerPhone || null,
        customerEmail: repair.customerEmail || null,
        device: repair.device,
        deviceBrand: repair.deviceBrand || null,
        deviceModel: repair.deviceModel || null,
        serialNumber: repair.serialNumber || null,
        issue: repair.issue || null,
        status: repair.status,
        priority: repair.priority || "Normal",
        assignedTechnician: repair.assignedTechnician || null,
        estimatedCost: repair.estimatedCost || null,
        finalCost: repair.finalCost || null,
        dueDate: repair.dueDate || null,
        completedAt: repair.completedAt || null,
        notes: repair.notes || null,
        attachment: repair.attachment || null,
        createdAt: repair.createdAt,
        updatedAt: repair.updatedAt || repair.createdAt,
        userId: repair.userId,
        branchId: repair.branchId || null,
        branch: null,
        statusHistory: [],
    };
}

async function getLegacyRepairs(userId) {
    const repairs = await prisma.$queryRaw`
        SELECT
            "id",
            "customer",
            "device",
            "status",
            "notes",
            "createdAt",
            "userId"
        FROM "Repair"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
    `;

    return repairs.map(normalizeLegacyRepair);
}

async function getLegacyRepair(id, userId) {
    const repairs = await prisma.$queryRaw`
        SELECT
            "id",
            "customer",
            "device",
            "status",
            "notes",
            "createdAt",
            "userId"
        FROM "Repair"
        WHERE "id" = ${id}
          AND "userId" = ${userId}
        LIMIT 1
    `;

    return normalizeLegacyRepair(repairs[0]);
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
    try {
        return await prisma.repair.findMany({
            where: {
                userId,
                ...branchFilter(filters.branchId),
            },
            include: repairInclude(),
            orderBy: {
                updatedAt: "desc",
            },
        });
    } catch (error) {
        if (!isMissingSchemaError(error)) {
            throw error;
        }

        return getLegacyRepairs(userId);
    }
}

async function getRepair(id, userId) {
    try {
        return await prisma.repair.findFirst({
            where: {
                id,
                userId,
            },
            include: repairInclude(),
        });
    } catch (error) {
        if (!isMissingSchemaError(error)) {
            throw error;
        }

        return getLegacyRepair(id, userId);
    }
}

async function repairExists(id, userId) {
    try {
        return await prisma.repair.findFirst({
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
    } catch (error) {
        if (!isMissingSchemaError(error)) {
            throw error;
        }

        const repair = await getLegacyRepair(id, userId);

        return repair
            ? {
                  id: repair.id,
                  status: repair.status,
                  completedAt: null,
              }
            : null;
    }
}

async function createRepair(body, userId) {
    const repairData = validateRepair(body);
    const branchId = await branchService.resolveBranchId(userId, body.branchId);

    return prisma.repair.create({
        data: {
            ...repairData,
            branchId,
            ticketNumber: makeTicketNumber(),
            attachment: body.attachment,
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
            ...(body.attachment
                ? {
                      attachment: body.attachment,
                  }
                : {}),
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
