const repairService = require("../services/repairService");

async function getRepairs(req, res) {
    try {
        const repairs =
            await repairService.getRepairs(req.user.id);

        return res.json(repairs);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch repairs",
        });
    }
}

async function getRepair(req, res) {
    try {
        const repair =
            await repairService.getRepair(
                Number(req.params.id),
                req.user.id
            );

        if (!repair) {
            return res.status(404).json({
                message: "Repair not found",
            });
        }

        return res.json(repair);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch repair",
        });
    }
}

async function createRepair(req, res) {
    try {
        const repair =
            await repairService.createRepair(
                req.body,
                req.user.id
            );

        return res.status(201).json(repair);
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message,
        });
    }
}

async function updateRepair(req, res) {
    try {
        const repair =
            await repairService.updateRepair(
                Number(req.params.id),
                req.body,
                req.user.id
            );

        if (!repair) {
            return res.status(404).json({
                message: "Repair not found",
            });
        }

        return res.json(repair);
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message,
        });
    }
}

async function deleteRepair(req, res) {
    try {
        const deleted =
            await repairService.deleteRepair(
                Number(req.params.id),
                req.user.id
            );

        if (!deleted) {
            return res.status(404).json({
                message: "Repair not found",
            });
        }

        return res.json({
            message: "Repair deleted",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to delete repair",
        });
    }
}

module.exports = {
    getRepairs,
    getRepair,
    createRepair,
    updateRepair,
    deleteRepair,
};