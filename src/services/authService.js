const bcrypt = require("bcryptjs");

const prisma = require("../lib/prisma");

async function register(name, email, password) {

    const existingUser = await prisma.user.findUnique({

        where: {

            email,

        },

    });

    if (existingUser) {

        throw new Error("User already exists");

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({

        data: {

            name,

            email,

            password: hashedPassword,

        },

    });

    return user;

}

async function login(email, password) {

    const user = await prisma.user.findUnique({

        where: {

            email,

        },

    });

    if (!user) {

        throw new Error("Invalid credentials");

    }

    const validPassword = await bcrypt.compare(

        password,

        user.password

    );

    if (!validPassword) {

        throw new Error("Invalid credentials");

    }

    return user;

}

module.exports = {

    register,

    login,

};