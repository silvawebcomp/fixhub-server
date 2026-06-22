const prisma = require("../lib/prisma");

async function getCustomers(userId) {

    return await prisma.customer.findMany({

        where: {

            userId,

        },

        orderBy: {

            createdAt: "desc",

        },

    });

}

async function createCustomer(

    name,

    email,

    phone,

    userId

) {

    return await prisma.customer.create({

        data: {

            name,

            email,

            phone,

            userId,

        },

    });

}

async function updateCustomer(

    id,

    userId,

    name,

    email,

    phone

) {

    const updated = await prisma.customer.updateMany({

        where: {

            id,

            userId,

        },

        data: {

            name,

            email,

            phone,

        },

    });

    if (updated.count === 0) {

        return null;

    }

    return await prisma.customer.findFirst({

        where: {

            id,

            userId,

        },

    });

}

async function deleteCustomer(id, userId) {

    return await prisma.customer.deleteMany({

        where: {

            id,

            userId,

        },

    });

}

module.exports = {

    getCustomers,

    createCustomer,

    updateCustomer,

    deleteCustomer,

};
