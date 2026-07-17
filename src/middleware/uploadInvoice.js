const upload = require("../config/multer");

module.exports = (req, res, next) => {
    req.uploadFolder = "invoices";

    upload.single("attachment")(req, res, next);
};