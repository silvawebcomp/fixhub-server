const bcrypt = require("bcryptjs");

const prisma = require("../lib/prisma");

const {

    generateToken,

} = require("../utils/jwt");

function isMissingColumnError(error) {
    return error?.code === "P2022" ||
        /column .* does not exist/i.test(error?.message || "");
}

function normalizeUser(user) {
    if (!user) {
        return null;
    }

    return {
        ...user,
        role: user.role || "Owner",
        workspaceOwnerId: user.workspaceOwnerId || null,
    };
}

async function findUserByEmail(email) {
    try {
        return normalizeUser(
            await prisma.user.findUnique({
                where: {
                    email,
                },
            })
        );
    } catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }

        const rows = await prisma.$queryRaw`
            SELECT "id", "name", "email", "password", "createdAt"
            FROM "User"
            WHERE "email" = ${email}
            LIMIT 1
        `;

        return normalizeUser(rows[0]);
    }
}

async function createOwnerUser({
    name,
    email,
    password,
}) {
    try {
        return normalizeUser(
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    role: "Owner",
                },
            })
        );
    } catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }

        const rows = await prisma.$queryRaw`
            INSERT INTO "User" ("name", "email", "password", "createdAt")
            VALUES (${name}, ${email}, ${password}, CURRENT_TIMESTAMP)
            RETURNING "id", "name", "email", "password", "createdAt"
        `;

        return normalizeUser(rows[0]);
    }
}

async function register({

    name,

    email,

    password,

}) {

    const existingUser = await findUserByEmail(email);

    if (existingUser) {

        throw new Error(

            "User already exists"

        );

    }

    const hashedPassword = await bcrypt.hash(

        password,

        10

    );

    const user = await createOwnerUser({
        name,
        email,
        password: hashedPassword,
    });

    const token = generateToken({

        id: user.id,

        email: user.email,

        role: user.role,

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role,

        },

    };

}

async function login({

    email,

    password,

}) {

    const user = await findUserByEmail(email);

    if (!user) {

        throw new Error(

            "Invalid email or password"

        );

    }

    const validPassword = await bcrypt.compare(

        password,

        user.password

    );

    if (!validPassword) {

        throw new Error(

            "Invalid email or password"

        );

    }

    const token = generateToken({

        id: user.id,

        email: user.email,

        role: user.role,

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role,

        },

    };

}

module.exports = {

    register,

    login,

};
