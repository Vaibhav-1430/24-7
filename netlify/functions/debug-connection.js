const { connectDB } = require('./utils/db');
const { successResponse, errorResponse } = require('./utils/response');

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
        console.log('🔧 Debug: Starting simple connection test...');
        
        // Check environment variables
        const envCheck = {
            MONGODB_URI_SET: !!process.env.MONGODB_URI,
            MONGODB_URI_LENGTH: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
            JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
            NODE_ENV: process.env.NODE_ENV || 'not set'
        };
        
        console.log('🔧 Environment check:', envCheck);
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        
        console.log('✅ Environment variables are set');
        
        // Test database connection
        console.log('🔧 Testing database connection...');
        await connectDB();
        console.log('✅ Database connection successful');
        
        return successResponse({
            message: 'All systems working!',
            environment: envCheck,
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
                timestamp: new Date().toISOString()
            }
        );
    }
};