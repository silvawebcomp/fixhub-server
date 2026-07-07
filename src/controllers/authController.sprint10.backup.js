const authService = require("../services/authService");

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

module.exports = {
    register,
    login,
};