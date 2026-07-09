const asyncHandler = require("../middleware/asyncHandler");
const branchService = require("../services/branchService");

async function getBranches(req, res) {
    const branches = await branchService.listBranches(req.user.id);
    return res.json(branches);
}

async function createBranch(req, res) {
    try {
        const branch = await branchService.createBranch(req.user.id, req.body);
        return res.status(201).json(branch);
    } catch (error) {
        return res.status(400).json({
            message: error.message || "Unable to create branch.",
        });
    }
}

async function updateBranch(req, res) {
    try {
        const branch = await branchService.updateBranch(
            req.user.id,
            req.params.id,
            req.body
        );

        if (!branch) {
            return res.status(404).json({
                message: "Branch not found",
            });
        }

        return res.json(branch);
    } catch (error) {
        return res.status(400).json({
            message: error.message || "Unable to update branch.",
        });
    }
}

async function deleteBranch(req, res) {
    try {
        const deleted = await branchService.deleteBranch(
            req.user.id,
            req.params.id
        );

        if (!deleted) {
            return res.status(404).json({
                message: "Branch not found",
            });
        }

        return res.json({
            message: "Branch deleted",
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message || "Unable to delete branch.",
        });
    }
}

module.exports = {
    getBranches: asyncHandler(getBranches),
    createBranch: asyncHandler(createBranch),
    updateBranch: asyncHandler(updateBranch),
    deleteBranch: asyncHandler(deleteBranch),
};
