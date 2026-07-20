const prisma = require("../lib/prisma");

const CUSTOMER_SELECT = {
    id: true,
    name: true,
    phone: true,
    email: true,
    createdAt: true,
    userId: true,
};

function isMissingSchemaError(error) {
    return (
        error?.code === "P2021" ||
        error?.code === "P2022" ||
        /table .* does not exist/i.test(error?.message || "") ||
        /column .* does not exist/i.test(error?.message || "")
    );
}

function publicCustomer(customer) {
    return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        profilePhoto: customer.profilePhoto || null,
        createdAt: customer.createdAt,
        userId: customer.userId,
    };
}

async function getCustomers(userId) {
    const customers = await prisma.customer.findMany({
        where: {
            userId,
        },
        select: CUSTOMER_SELECT,
        orderBy: {
            createdAt: "desc",
        },
    });

    return customers.map(publicCustomer);
}

async function createCustomer(
    name,
    email,
    phone,
    userId,
    profilePhoto
) {
    const data = {
        name,
        email,
        phone,
        userId,
        ...(profilePhoto
            ? {
                  profilePhoto,
              }
            : {}),
    };

    try {
        return publicCustomer(
            await prisma.customer.create({
                data,
                select: CUSTOMER_SELECT,
            })
        );
    } catch (error) {
        if (!profilePhoto || !isMissingSchemaError(error)) {
            throw error;
        }

        return publicCustomer(
            await prisma.customer.create({
                data: {
                    name,
                    email,
                    phone,
                    userId,
                },
                select: CUSTOMER_SELECT,
            })
        );
    }
}

function customerUpdateData(name, email, phone, profilePhoto) {
    return {
        name,
        email,
        phone,
        ...(profilePhoto
            ? {
                  profilePhoto,
              }
            : {}),
    };
}

async function updateCustomer(
    id,
    userId,
    name,
    email,
    phone,
    profilePhoto
) {
    const operation = (data) =>
        prisma.customer.updateMany({
            where: {
                id,
                userId,
            },
            data,
        });

    let updated;

    try {
        updated = await operation(
            customerUpdateData(name, email, phone, profilePhoto)
        );
    } catch (error) {
        if (!profilePhoto || !isMissingSchemaError(error)) {
            throw error;
        }

        updated = await operation(customerUpdateData(name, email, phone));
    }

    if (updated.count === 0) {
        return null;
    }

    const customer = await prisma.customer.findFirst({
        where: {
            id,
            userId,
        },
        select: CUSTOMER_SELECT,
    });

    return publicCustomer(customer);
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
