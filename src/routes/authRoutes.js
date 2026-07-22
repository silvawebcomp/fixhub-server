const express = require("express");

const {

    login,

    requestPasswordReset,

    register,

    resetPassword,

} = require("../controllers/authController");

const router = express.Router();
const resetLimiter = require("express-rate-limit")({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many password reset attempts. Please try again later.",
    },
});

router.post("/login", login);

router.post("/register", register);

router.post("/forgot-password", resetLimiter, requestPasswordReset);

router.post("/reset-password", resetLimiter, resetPassword);

module.exports = router;
