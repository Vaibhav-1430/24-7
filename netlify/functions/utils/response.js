// Helper function to create consistent API responses
const createResponse = (statusCode, body, headers = {}) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            ...headers
        },
        body: JSON.stringify(body)
    };
};

const successResponse = (data, message = 'Success') => {
    return createResponse(200, {
        success: true,
        message,
        data
    });
};

const errorResponse = (message, statusCode = 400, error = null) => {
    return createResponse(statusCode, {
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined
    });
};

module.exports = { createResponse, successResponse, errorResponse };