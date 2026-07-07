function apiResponse(req, res, next) {
    res.success = function (
        data = null,
        message = "Success",
        statusCode = 200
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    };

    res.fail = function (
        message = "Request failed",
        statusCode = 400
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
        });
    };

    next();
}

module.exports = apiResponse;