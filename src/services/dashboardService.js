const prisma = require("../lib/prisma");

async function getDashboardStats() {

    const [

        totalRepairs,

        customers,

        inventoryItems,

        activeRepairs,

    ] = await Promise.all([

        prisma.repair.count(),

        prisma.customer.count(),

        prisma.inventory.count(),

        prisma.repair.count({

            where: {

                status: {

                    in: [

                        "Pending",

                        "In Progress",

                        "Waiting Parts",

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