const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {

    getDashboardStats,

    getBusinessInsights,

} = require("../controllers/dashboardController");

const router = express.Router();

router.use(authMiddleware);

router.get(

    "/stats",

    getDashboardStats

);

router.get(

    "/insights",

    getBusinessInsights

);

module.exports = router;
