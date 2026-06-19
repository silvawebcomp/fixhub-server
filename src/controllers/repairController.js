const prisma = require("../lib/prisma");

async function getRepairs(req, res) {

    try {

        const repairs = await prisma.repair.findMany({

            orderBy: {

                createdAt: "desc",

            },

        });

        res.json(repairs);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch repairs",

        });

    }

}

async function createRepair(req, res) {

    try {

        const {

            customer,

            device,

            status,

            notes,

            userId,

        } = req.body;

        const repair = await prisma.repair.create({

            data: {

                customer,

                device,

                status,

                notes,

                userId,

            },

        });

        res.status(201).json(repair);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to create repair",

        });

    }

}

async function updateRepair(req, res) {

    try {

        const id = Number(req.params.id);

        const {

            customer,

            device,

            status,

            notes,

        } = req.body;

        const repair = await prisma.repair.update({

            where: {

                id,

            },

            data: {

                customer,

                device,

                status,

                notes,

            },

        });

        res.json(repair);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to update repair",

        });

    }

}

async function deleteRepair(req, res) {

    try {

        const id = Number(req.params.id);

        await prisma.repair.delete({

            where: {

                id,

            },

        });

        res.json({

            message: "Repair deleted",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete repair",

        });

    }

}

module.exports = {

    getRepairs,

    createRepair,

    updateRepair,

    deleteRepair,

};