const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const Order = require('./models/Order');

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

        const userId = authResult.userId;
        const { status } = event.queryStringParameters || {};
        
        let query = { user: userId };
        
        // Filter by status if provided
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Sort by creation date (newest first)
        const orders = await Order.find(query).sort({ createdAt: -1 });

        return successResponse(orders, `Found ${orders.length} orders`);

    } catch (error) {
        console.error('Get orders error:', error);
        return errorResponse('Server error while fetching orders', 500, error.message);
    }
};