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

module.exports = {

    getDashboardStats,

};
