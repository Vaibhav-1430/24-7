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

    try {
        console.log('🧪 Test function called');
        
        const response = {
            success: true,
            message: 'Test function working!',
            data: {
                timestamp: new Date().toISOString(),
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    MONGODB_URI_SET: !!process.env.MONGODB_URI,
                    JWT_SECRET_SET: !!process.env.JWT_SECRET,
                    MONGODB_URI_LENGTH: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
                    JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
                },
                netlify: {
                    functionName: context.functionName,
                    functionVersion: context.functionVersion,
                    memoryLimitInMB: context.memoryLimitInMB,
                    remainingTimeInMillis: context.getRemainingTimeInMillis()
                }
            }
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('❌ Test function error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Test function failed',
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};