require("dotenv").config();
require("./config/env");
require("./config/validateEnv");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimiter");
const apiResponse = require("./middleware/apiResponse");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const repairRoutes = require("./routes/repairRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const teamRoutes = require("./routes/teamRoutes");
const branchRoutes = require("./routes/branchRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const healthRoutes = require("./routes/healthRoutes");
const requestId = require("./middleware/requestId");
const gracefulShutdown = require("./middleware/gracefulShutdown");
const path = require("path");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fixhub-client.vercel.app",
].filter(Boolean);

app.use(helmet());

app.use(requestLogger);
app.use(requestId);

app.use(rateLimiter);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.use(apiResponse);

app.get("/", (req, res) => {
    return res.success({
        name: "FixHub API",
        status: "online",
        version: "1.0.0",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/health", healthRoutes);
app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    const server = app.listen(PORT, () => {
    console.log(
        `FixHub API running on http://localhost:${PORT}`
    );
});

gracefulShutdown(server);
}

module.exports = app;
