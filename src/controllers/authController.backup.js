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

res.status(201).json(result);

return;

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

        const result = await authService.login({

    email,

    password,

});

res.json(result);

return;

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