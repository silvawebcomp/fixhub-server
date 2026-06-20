require("dotenv").config();

const express = require("express");
const cors = require("cors");

const repairRoutes = require("./routes/repairRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {

    res.json({

        message: "FixHub API is running",

    });

});

app.use("/api/auth", authRoutes);

app.use("/api/repairs", repairRoutes);

app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(

        `🚀 FixHub API running on http://localhost:${PORT}`

    );

});