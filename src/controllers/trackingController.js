const prisma = require("../lib/prisma");

const TRACKING_REPAIR_COLUMNS = [
    ["id", "NULL::integer"],
    ["ticketNumber", "NULL::text"],
    ["customer", "NULL::text"],
    ["device", "NULL::text"],
    ["deviceBrand", "NULL::text"],
    ["deviceModel", "NULL::text"],
    ["issue", "NULL::text"],
    ["status", "NULL::text"],
    ["estimatedCost", "NULL::double precision"],
    ["finalCost", "NULL::double precision"],
    ["dueDate", "NULL::timestamp"],
    ["completedAt", "NULL::timestamp"],
    ["createdAt", "NULL::timestamp"],
    ["updatedAt", "NULL::timestamp"],
    ["customerPhone", "NULL::text"],
    ["customerEmail", "NULL::text"],
];

function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function contactMatches(repair, contact) {
    const suppliedEmail = normalizeEmail(contact);
    const storedEmail = normalizeEmail(repair.customerEmail);

    if (suppliedEmail.includes("@")) {
        return Boolean(storedEmail && suppliedEmail === storedEmail);
    }

    const suppliedPhone = normalizePhone(contact);
    const storedPhone = normalizePhone(repair.customerPhone);

    if (!suppliedPhone || !storedPhone) {
        return false;
    }

    const comparisonLength = Math.min(10, suppliedPhone.length, storedPhone.length);

    return (
        comparisonLength >= 7 &&
        suppliedPhone.slice(-comparisonLength) === storedPhone.slice(-comparisonLength)
    );
}

function isMissingSchemaError(error) {
    return (
        error?.code === "P2021" ||
        error?.code === "P2022" ||
        /table .* does not exist/i.test(error?.message || "") ||
        /column .* does not exist/i.test(error?.message || "")
    );
}

function selectExpression(columns, column, fallback) {
    return columns.has(column) ? `"${column}"` : `${fallback} AS "${column}"`;
}

async function getTableColumns(tableName) {
    const rows = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
    `;

    return new Set(rows.map((row) => row.column_name));
}

async function tableExists(tableName) {
    const rows = await prisma.$queryRaw`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
        ) AS "exists"
    `;

    return Boolean(rows[0]?.exists);
}

async function getLegacyStatusHistory(repairId) {
    if (!repairId || !(await tableExists("RepairStatusHistory"))) {
        return [];
    }

    const columns = await getTableColumns("RepairStatusHistory");

    if (!columns.has("repairId")) {
        return [];
    }

    const selectList = [
        selectExpression(columns, "id", "NULL::integer"),
        selectExpression(columns, "status", "NULL::text"),
        selectExpression(columns, "createdAt", "NULL::timestamp"),
    ].join(", ");

    const orderBy = columns.has("createdAt") ? '"createdAt" ASC' : '"id" ASC';

    return prisma.$queryRawUnsafe(
        `SELECT ${selectList}
         FROM "RepairStatusHistory"
         WHERE "repairId" = $1
         ORDER BY ${orderBy}`,
        repairId
    );
}

async function getLegacyRepair(ticketNumber) {
    const columns = await getTableColumns("Repair");

    if (!columns.has("ticketNumber")) {
        return null;
    }

    const selectList = TRACKING_REPAIR_COLUMNS.map(([column, fallback]) =>
        selectExpression(columns, column, fallback)
    ).join(", ");

    const repairs = await prisma.$queryRawUnsafe(
        `SELECT ${selectList}
         FROM "Repair"
         WHERE "ticketNumber" = $1
         LIMIT 1`,
        ticketNumber
    );

    const repair = repairs[0];

    if (!repair) {
        return null;
    }

    return {
        ...repair,
        statusHistory: await getLegacyStatusHistory(repair.id),
    };
}

async function findRepairForTracking(ticketNumber) {
    try {
        return await prisma.repair.findUnique({
            where: {
                ticketNumber,
            },
            include: {
                statusHistory: {
                    orderBy: {
                        createdAt: "asc",
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });
    } catch (error) {
        if (!isMissingSchemaError(error)) {
            throw error;
        }

        return getLegacyRepair(ticketNumber);
    }
}

async function trackRepair(req, res) {
    try {
        const ticketNumber = String(req.body.ticketNumber || "")
            .trim()
            .toUpperCase();
        const contact = String(req.body.contact || "").trim();

        if (!ticketNumber || !contact) {
            return res.status(400).json({
                message: "Enter your ticket number and phone number or email.",
            });
        }

        const repair = await findRepairForTracking(ticketNumber);

        if (!repair || !contactMatches(repair, contact)) {
            return res.status(404).json({
                message:
                    "We could not match that ticket and contact detail. Check both entries and try again.",
            });
        }

        res.json({
            ticketNumber: repair.ticketNumber,
            customer: repair.customer,
            device: repair.device,
            deviceBrand: repair.deviceBrand,
            deviceModel: repair.deviceModel,
            issue: repair.issue,
            status: repair.status,
            estimatedCost: repair.estimatedCost,
            finalCost: repair.finalCost,
            dueDate: repair.dueDate,
            completedAt: repair.completedAt,
            createdAt: repair.createdAt,
            updatedAt: repair.updatedAt || repair.createdAt,
            statusHistory: repair.statusHistory || [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to check this repair right now. Please try again.",
        });
    }
}

module.exports = {
    trackRepair,
};
