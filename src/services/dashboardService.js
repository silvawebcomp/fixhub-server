const prisma = require("../lib/prisma");

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

        prisma.invoice.aggregate({

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

        }),

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
