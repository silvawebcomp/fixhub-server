function health(req, res) {
    return res.success(
        {
            status: "OK",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
        "FixHub API is healthy"
    );
}

module.exports = {
    health,
};