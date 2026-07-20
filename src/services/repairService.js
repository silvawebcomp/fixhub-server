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

async function ensureRepairSchema() {
    await branchService.ensureBranchSchema();

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Repair"
        ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "customerPhone" TEXT,
        ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
        ADD COLUMN IF NOT EXISTS "deviceBrand" TEXT,
        ADD COLUMN IF NOT EXISTS "deviceModel" TEXT,
        ADD COLUMN IF NOT EXISTS "serialNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "issue" TEXT,
        ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'Normal',
        ADD COLUMN IF NOT EXISTS "assignedTechnician" TEXT,
        ADD COLUMN IF NOT EXISTS "estimatedCost" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "finalCost" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "attachment" TEXT
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Repair_ticketNumber_key"
        ON "Repair"("ticketNumber")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Repair_userId_branchId_idx"
        ON "Repair"("userId", "branchId")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RepairStatusHistory" (
            "id" SERIAL PRIMARY KEY,
            "status" TEXT NOT NULL,
            "note" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "repairId" INTEGER NOT NULL
        )
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "RepairStatusHistory"
        ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Received',
        ADD COLUMN IF NOT EXISTS "note" TEXT,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "repairId" INTEGER
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "RepairStatusHistory_repairId_createdAt_idx"
        ON "RepairStatusHistory"("repairId", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'RepairStatusHistory_repairId_fkey'
                  AND conrelid = '"RepairStatusHistory"'::regclass
            ) THEN
                ALTER TABLE "RepairStatusHistory"
                ADD CONSTRAINT "RepairStatusHistory_repairId_fkey"
                FOREIGN KEY ("repairId") REFERENCES "Repair"("id")
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END
        $$;
    `);

    await prisma.$executeRawUnsafe(`
        INSERT INTO "RepairStatusHistory" ("status", "createdAt", "repairId")
        SELECT COALESCE("status", 'Received'), COALESCE("createdAt", CURRENT_TIMESTAMP), "id"
        FROM "Repair" repair
        WHERE NOT EXISTS (
            SELECT 1
            FROM "RepairStatusHistory" history
            WHERE history."repairId" = repair."id"
        )
    `);
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
    await ensureRepairSchema();

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
    await ensureRepairSchema();

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
    await ensureRepairSchema();

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
    await ensureRepairSchema();

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
    await ensureRepairSchema();

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
    await ensureRepairSchema();

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
    ensureRepairSchema,
};
