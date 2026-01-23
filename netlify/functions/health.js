exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        const response = {
            success: true,
            message: 'Server is healthy!',
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                MONGODB_URI_SET: !!process.env.MONGODB_URI,
                JWT_SECRET_SET: !!process.env.JWT_SECRET
            }
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Health check failed',
                error: error.message
            })
        };
    }
};