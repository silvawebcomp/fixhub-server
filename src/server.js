require("dotenv").config();

const express = require("express");
const cors = require("cors");

const repairRoutes = require("./routes/repairRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fixhub-client.vercel.app",
].filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "FixHub API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`FixHub API running on http://localhost:${PORT}`);
    });
}

module.exports = app;
