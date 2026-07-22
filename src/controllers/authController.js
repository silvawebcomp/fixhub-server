const authService = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");
async function register(req, res) {
    try {
        const {
            name,
            email,
            password,
        } = req.body;

        const result = await authService.register({
            name,
            email,
            password,
        });

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}

async function login(req, res) {
    try {
        const {
            email,
            password,
        } = req.body;

        const result = await authService.login({
            email,
            password,
        });

        return res.json(result);
    } catch (error) {
        return res.status(401).json({
            message: error.message,
        });
    }
}

async function requestPasswordReset(req, res) {
    try {
        const {
            email,
        } = req.body;

        const result = await authService.requestPasswordReset({
            email,
        });

        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}

async function resetPassword(req, res) {
    try {
        const {
            email,
            code,
            password,
        } = req.body;

        const result = await authService.resetPassword({
            email,
            code,
            password,
        });

        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}

module.exports = {
    register: asyncHandler(register),
    login: asyncHandler(login),
    requestPasswordReset: asyncHandler(requestPasswordReset),
    resetPassword: asyncHandler(resetPassword),
};
