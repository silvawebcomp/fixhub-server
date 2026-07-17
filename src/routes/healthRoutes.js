const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return res.json({
            success: true,
            status: "healthy",
            database: "connected",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: "1.0.0",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

module.exports = router;