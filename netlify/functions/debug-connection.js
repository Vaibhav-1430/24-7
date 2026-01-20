const { connectDB } = require('./utils/db');
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
        console.log('🔧 Debug: Starting connection test...');
        
        // Check environment variables
        const envInfo = getEnvironmentInfo();
        console.log('🔧 Environment info:', envInfo);
        
        // Validate environment
        const envError = validateEnvironmentForFunction();
        if (envError) {
            console.error('❌ Environment validation failed:', envError);
            return envError;
        }
        
        console.log('✅ Environment validation passed');
        
        // Test database connection
        console.log('🔧 Testing database connection...');
        await connectDB();
        console.log('✅ Database connection successful');
        
        return successResponse({
            message: 'All systems working!',
            environment: envInfo,
            timestamp: new Date().toISOString(),
            mongodbConnected: true
        }, 'Debug test successful');
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
        
        return errorResponse(
            `Debug test failed: ${error.message}`,
            500,
            {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                timestamp: new Date().toISOString()
            }
        );
    }
};