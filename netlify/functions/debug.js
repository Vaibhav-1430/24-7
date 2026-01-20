const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction, getEnvironmentInfo } = require('./utils/environment');

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
        // Validate environment variables first
        const envError = validateEnvironmentForFunction();
        if (envError) {
            return envError;
        }

        // Get comprehensive environment information
        const environmentInfo = getEnvironmentInfo();

        const debugInfo = {
            timestamp: new Date().toISOString(),
            httpMethod: event.httpMethod,
            path: event.path,
            headers: event.headers,
            queryStringParameters: event.queryStringParameters,
            body: event.body,
            environment: environmentInfo,
            context: {
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                memoryLimitInMB: context.memoryLimitInMB,
                remainingTimeInMillis: context.getRemainingTimeInMillis()
            }
        };

        return successResponse(debugInfo, 'Debug information retrieved');

    } catch (error) {
        console.error('Debug error:', error);
        return errorResponse('Debug function error', 500, error.message);
    }
};