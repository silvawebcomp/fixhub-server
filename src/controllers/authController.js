const authService = require("../services/authService");

const { generateToken } = require("../utils/jwt");

async function register(req, res) {

    try {

        const {

            name,

            email,

            password,

        } = req.body;

        const user = await authService.register(

            name,

            email,

            password

        );

        const token = generateToken(user);

        res.status(201).json({

            token,

            user,

        });

    } catch (error) {

        res.status(400).json({

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

        const user = await authService.login(

            email,

            password

        );

        const token = generateToken(user);

        res.json({

            token,

            user,

        });

    } catch (error) {

        res.status(401).json({

            message: error.message,

        });

    }

}

module.exports = {

    register,

    login,

};