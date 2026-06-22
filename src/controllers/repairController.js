const prisma = require("../lib/prisma");

async function getRepairs(req, res) {

    try {

        const repairs = await prisma.repair.findMany({

            where: {

                userId: req.user.id,

            },

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

        } = req.body;

        const repair = await prisma.repair.create({

            data: {

                customer,

                device,

                status,

                notes,

                userId: req.user.id,

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

        const updated = await prisma.repair.updateMany({

            where: {

                id,

                userId: req.user.id,

            },

            data: {

                customer,

                device,

                status,

                notes,

            },

        });

        if (updated.count === 0) {

            return res.status(404).json({

                message: "Repair not found",

            });

        }

        const repair = await prisma.repair.findFirst({

            where: {

                id,

                userId: req.user.id,

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

        const deleted = await prisma.repair.deleteMany({

            where: {

                id,

                userId: req.user.id,

            },

        });

        if (deleted.count === 0) {

            return res.status(404).json({

                message: "Repair not found",

            });

        }

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
