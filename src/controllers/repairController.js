const asyncHandler = require("../middleware/asyncHandler");
const repairService = require("../services/repairService");

async function getRepairs(req, res) {
    const repairs = await repairService.getRepairs(
        req.user.id
    );

    return res.json(repairs);
}

async function getRepair(req, res) {
    const repair = await repairService.getRepair(
        Number(req.params.id),
        req.user.id
    );

    if (!repair) {
        return res.status(404).json({
            message: "Repair not found",
        });
    }

    return res.json(repair);
}

async function createRepair(req, res) {
    const repair = await repairService.createRepair(
        req.body,
        req.user.id
    );

    return res.status(201).json(repair);
}

async function updateRepair(req, res) {
    const repair = await repairService.updateRepair(
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
}

async function deleteRepair(req, res) {
    const deleted = await repairService.deleteRepair(
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
}

module.exports = {
    getRepairs: asyncHandler(getRepairs),
    getRepair: asyncHandler(getRepair),
    createRepair: asyncHandler(createRepair),
    updateRepair: asyncHandler(updateRepair),
    deleteRepair: asyncHandler(deleteRepair),
};
