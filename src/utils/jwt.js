const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "fixhub-secret-key";

function generateToken(user) {

    return jwt.sign(

        {

            id: user.id,

            email: user.email,

            role: user.role,

        },

        SECRET,

        {

            expiresIn: "7d",

        }

    );

}

function verifyToken(token) {

    return jwt.verify(token, SECRET);

}

module.exports = {

    generateToken,

    verifyToken,

};
