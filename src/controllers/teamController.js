const asyncHandler = require("../middleware/asyncHandler");
const teamService = require("../services/teamService");

async function getTeam(req, res) {
    const team = await teamService.listTeam(
        req.user.workspaceOwnerId
    );

    return res.json(team);
}

async function createMember(req, res) {
    const member = await teamService.createTeamMember(
        req.user.workspaceOwnerId,
        req.body
    );

    return res.status(201).json(member);
}

async function updateMember(req, res) {
    const member = await teamService.updateTeamMember(
        req.user.workspaceOwnerId,
        req.params.id,
        req.body
    );

    if (!member) {
        return res.status(404).json({
            message: "Team member not found.",
        });
    }

    return res.json(member);
}

async function deleteMember(req, res) {
    const deleted = await teamService.deleteTeamMember(
        req.user.workspaceOwnerId,
        req.params.id
    );

    if (deleted.count === 0) {
        return res.status(404).json({
            message: "Team member not found.",
        });
    }

    return res.json({
        message: "Team member removed.",
    });
}

module.exports = {
    getTeam: asyncHandler(getTeam),
    createMember: asyncHandler(createMember),
    updateMember: asyncHandler(updateMember),
    deleteMember: asyncHandler(deleteMember),
};
