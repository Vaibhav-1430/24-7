const { successResponse } = require('./utils/response');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            }
        };
    }

    return successResponse({
        status: 'OK',
        message: '24x7 Cafe Backend is running on Netlify Functions!',
        timestamp: new Date().toISOString(),
        environment: 'netlify-functions'
    });
};