const prisma = require("../lib/prisma");

async function getCustomers(userId) {
    return prisma.customer.findMany({
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
    userId,
    profilePhoto
) {
    return prisma.customer.create({
        data: {
            name,
            email,
            phone,
            profilePhoto,
            userId,
        },
    });
}

async function updateCustomer(
    id,
    userId,
    name,
    email,
    phone,
    profilePhoto
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
            ...(profilePhoto
                ? {
                      profilePhoto,
                  }
                : {}),
        },
    });

    if (updated.count === 0) {
        return null;
    }

    return prisma.customer.findFirst({
        where: {
            id,
            userId,
        },
    });
}

async function deleteCustomer(id, userId) {
    return prisma.customer.deleteMany({
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
