const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

    const existingUser = await prisma.user.findUnique({

        where: {

            email: "admin@fixhub.com",

        },

    });

    if (!existingUser) {

        await prisma.user.create({

            data: {

                name: "Administrator",

                email: "admin@fixhub.com",

                password: "password123",

            },

        });

    }

    console.log("✅ Database seeded successfully.");

}

main()

    .catch((error) => {

        console.error(error);

        process.exit(1);

    })

    .finally(async () => {

        await prisma.$disconnect();

    });