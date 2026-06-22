const dashboardService = require("../services/dashboardService");

async function getDashboardStats(req, res) {

    try {

        const stats = await dashboardService.getDashboardStats(req.user.id);

        res.json(stats);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to load dashboard statistics",

        });

    }

}

module.exports = {

    getDashboardStats,

};
