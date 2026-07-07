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

async function getBusinessInsights(req, res) {
    try {
        const insights = await dashboardService.getBusinessInsights(req.user.id);

        res.json(insights);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load business insights",
        });
    }
}

module.exports = {

    getDashboardStats,

    getBusinessInsights,

};
