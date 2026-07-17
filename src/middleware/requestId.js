const createRequestId = require("../utils/requestId");

module.exports = (req, res, next) => {
    req.requestId = createRequestId();

    res.setHeader(
        "X-Request-Id",
        req.requestId
    );

    next();
};