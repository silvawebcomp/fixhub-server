const prisma = require("../lib/prisma");

async function getInventory(userId) {

    return await prisma.inventory.findMany({

        where: {

            userId,

        },

        orderBy: {

            createdAt: "desc",

        },

    });

}

async function createInventoryItem(

    name,

    quantity,

    price,

    userId

) {

    return await prisma.inventory.create({

        data: {

            name,

            quantity,

            price,

            userId,

        },

    });

}

async function updateInventoryItem(

    id,

    userId,

    name,

    quantity,

    price

) {

    const updated = await prisma.inventory.updateMany({

        where: {

            id,

            userId,

        },

        data: {

            name,

            quantity,

            price,

        },

    });

    if (updated.count === 0) {

        return null;

    }

    return await prisma.inventory.findFirst({

        where: {

            id,

            userId,

        },

    });

}

async function deleteInventoryItem(id, userId) {

    return await prisma.inventory.deleteMany({

        where: {

            id,

            userId,

        },

    });

}

module.exports = {

    getInventory,

    createInventoryItem,

    updateInventoryItem,

    deleteInventoryItem,

};
