const prisma = require("../lib/prisma");

async function getInvoiceSummary(userId) {

    try {

        return await prisma.invoice.aggregate({

            where: {

                userId,

            },

            _count: {

                _all: true,

            },

            _sum: {

                total: true,

                amountPaid: true,

                balance: true,

            },

        });

    } catch (error) {

        if (error.code === "P2021" || error.code === "P2022") {

            return {

                _count: {

                    _all: 0,

                },

                _sum: {

                    total: 0,

                    amountPaid: 0,

                    balance: 0,

                },

            };

        }

        throw error;

    }

}

async function getDashboardStats(userId) {

    const [

        totalRepairs,

        customers,

        inventoryItems,

        activeRepairs,

        invoiceSummary,

    ] = await Promise.all([

        prisma.repair.count({

            where: {

                userId,

            },

        }),

        prisma.customer.count({

            where: {

                userId,

            },

        }),

        prisma.inventory.count({

            where: {

                userId,

            },

        }),

        prisma.repair.count({

            where: {

                userId,

                status: {

                    in: [

                        "Received",

                        "Diagnosing",

                        "Awaiting Approval",

                        "Awaiting Parts",

                        "Repairing",

                        "Ready",

                    ],

                },

            },

        }),

        getInvoiceSummary(userId),

    ]);

    return {

        totalRepairs,

        activeRepairs,

        customers,

        inventoryItems,

        totalInvoices: invoiceSummary._count._all,

        invoiceRevenue: invoiceSummary._sum.total || 0,

        paymentsReceived: invoiceSummary._sum.amountPaid || 0,

        outstandingBalance: invoiceSummary._sum.balance || 0,

    };

}

function emptyInsightData() {
    return {
        repairStatus: [],
        repairPriority: [],
        revenueTrend: [],
        inventoryHealth: {
            totalItems: 0,
            lowStockItems: 0,
            stockUnits: 0,
            inventoryValue: 0,
        },
        communicationTotals: {
            WhatsApp: 0,
            SMS: 0,
            Email: 0,
        },
        kpis: {
            totalRepairs: 0,
            activeRepairs: 0,
            completedRepairs: 0,
            totalRevenue: 0,
            collectedRevenue: 0,
            outstandingBalance: 0,
            collectionRate: 0,
        },
    };
}

function isMissingFeatureTable(error) {
    return error.code === "P2021" || error.code === "P2022";
}

function monthKey(date) {
    return new Date(date).toISOString().slice(0, 7);
}

async function safeQuery(query, fallback) {
    try {
        return await query();
    } catch (error) {
        if (isMissingFeatureTable(error)) {
            return fallback;
        }

        throw error;
    }
}

function groupCount(rows, key) {
    return rows.map((row) => ({
        label: row[key],
        value: row._count._all,
    }));
}

function buildRevenueTrend(invoices) {
    const monthly = new Map();

    invoices.forEach((invoice) => {
        const key = monthKey(invoice.createdAt);
        const existing = monthly.get(key) || {
            month: key,
            billed: 0,
            collected: 0,
            outstanding: 0,
        };

        existing.billed += invoice.total;
        existing.collected += invoice.amountPaid;
        existing.outstanding += invoice.balance;
        monthly.set(key, existing);
    });

    return Array.from(monthly.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);
}

async function getBusinessInsights(userId) {
    const empty = emptyInsightData();

    const [
        repairStatus,
        repairPriority,
        completedRepairs,
        invoiceRows,
        inventoryRows,
        communicationRows,
    ] = await Promise.all([
        prisma.repair.groupBy({
            by: ["status"],
            where: {
                userId,
            },
            _count: {
                _all: true,
            },
        }),
        prisma.repair.groupBy({
            by: ["priority"],
            where: {
                userId,
            },
            _count: {
                _all: true,
            },
        }),
        prisma.repair.count({
            where: {
                userId,
                status: "Collected",
            },
        }),
        safeQuery(
            () =>
                prisma.invoice.findMany({
                    where: {
                        userId,
                    },
                    select: {
                        total: true,
                        amountPaid: true,
                        balance: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                }),
            []
        ),
        safeQuery(
            () =>
                prisma.inventory.findMany({
                    where: {
                        userId,
                    },
                    select: {
                        quantity: true,
                        price: true,
                        reorderLevel: true,
                    },
                }),
            []
        ),
        safeQuery(
            () =>
                prisma.notificationLog.groupBy({
                    by: ["channel"],
                    where: {
                        userId,
                    },
                    _count: {
                        _all: true,
                    },
                }),
            []
        ),
    ]);

    const stats = await getDashboardStats(userId);
    const totalRevenue = invoiceRows.reduce((sum, invoice) => sum + invoice.total, 0);
    const collectedRevenue = invoiceRows.reduce(
        (sum, invoice) => sum + invoice.amountPaid,
        0
    );
    const outstandingBalance = invoiceRows.reduce(
        (sum, invoice) => sum + invoice.balance,
        0
    );
    const communicationTotals = communicationRows.reduce(
        (totals, row) => ({
            ...totals,
            [row.channel]: row._count._all,
        }),
        empty.communicationTotals
    );

    return {
        repairStatus: groupCount(repairStatus, "status"),
        repairPriority: groupCount(repairPriority, "priority"),
        revenueTrend: buildRevenueTrend(invoiceRows),
        inventoryHealth: inventoryRows.reduce(
            (summary, item) => ({
                totalItems: summary.totalItems + 1,
                lowStockItems:
                    summary.lowStockItems +
                    (item.quantity <= item.reorderLevel ? 1 : 0),
                stockUnits: summary.stockUnits + item.quantity,
                inventoryValue: summary.inventoryValue + item.quantity * item.price,
            }),
            empty.inventoryHealth
        ),
        communicationTotals,
        kpis: {
            totalRepairs: stats.totalRepairs,
            activeRepairs: stats.activeRepairs,
            completedRepairs,
            totalRevenue,
            collectedRevenue,
            outstandingBalance,
            collectionRate:
                totalRevenue > 0
                    ? Math.round((collectedRevenue / totalRevenue) * 100)
                    : 0,
        },
    };
}

module.exports = {

    getDashboardStats,

    getBusinessInsights,

};
