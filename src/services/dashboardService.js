const prisma = require("../lib/prisma");

async function getDashboardStats(userId) {

    const [

        totalRepairs,

        customers,

        inventoryItems,

        activeRepairs,

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

    ]);

    return {

        totalRepairs,

        activeRepairs,

        customers,

        inventoryItems,

    };

}

module.exports = {

    getDashboardStats,

};
