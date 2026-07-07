const teamService = require("../services/teamService");

async function getTeam(req, res) {
    try {
        const team = await teamService.listTeam(req.user.workspaceOwnerId);

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to load team.",
        });
    }
}

async function createMember(req, res) {
    try {
        const member = await teamService.createTeamMember(
            req.user.workspaceOwnerId,
            req.body
        );

        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
}

async function updateMember(req, res) {
    try {
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
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}

async function deleteMember(req, res) {
    try {
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to remove team member.",
        });
    }
}

module.exports = {
    getTeam,
    createMember,
    updateMember,
    deleteMember,
};
