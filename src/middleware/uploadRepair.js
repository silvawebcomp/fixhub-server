const upload = require("../config/multer");

module.exports = (req, res, next) => {
    req.uploadFolder = "repairs";

    upload.single("attachment")(req, res, next);
};