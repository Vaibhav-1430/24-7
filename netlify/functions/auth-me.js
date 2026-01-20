const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const User = require('./models/User');

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

    if (event.httpMethod !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        await connectDB();

        // Verify token
        const authResult = verifyToken(event);
        if (authResult.error) {
            return errorResponse(authResult.error, authResult.status);
        }

        const user = await User.findById(authResult.userId);
        if (!user) {
            return errorResponse('User not found', 404);
        }

        const userResponse = user.toJSON();

        return successResponse({
            user: userResponse
        });

    } catch (error) {
        console.error('Auth verification error:', error);
        return errorResponse('Invalid token', 401, error.message);
    }
};