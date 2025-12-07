const successResponse = (res, statusCode, message, data = null, meta = null) => {
    const response = {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message, error = null) => {
    const response = {
        success: false,
        statusCode,
        message,
        error,
        timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse
};
