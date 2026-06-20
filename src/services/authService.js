const bcrypt = require("bcryptjs");

const prisma = require("../lib/prisma");

const {

    generateToken,

} = require("../utils/jwt");

async function register({

    name,

    email,

    password,

}) {

    const existingUser = await prisma.user.findUnique({

        where: {

            email,

        },

    });

    if (existingUser) {

        throw new Error(

            "User already exists"

        );

    }

    const hashedPassword = await bcrypt.hash(

        password,

        10

    );

    const user = await prisma.user.create({

        data: {

            name,

            email,

            password: hashedPassword,

        },

    });

    const token = generateToken({

        id: user.id,

        email: user.email,

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

        },

    };

}

async function login({

    email,

    password,

}) {

    const user = await prisma.user.findUnique({

        where: {

            email,

        },

    });

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

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

        },

    };

}

module.exports = {

    register,

    login,

};