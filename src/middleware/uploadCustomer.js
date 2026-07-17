const upload = require("../config/multer");

module.exports = (req, res, next) => {
    req.uploadFolder = "customers";

    upload.single("photo")(req, res, next);
};