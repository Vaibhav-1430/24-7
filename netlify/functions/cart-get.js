const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');
const Cart = require('./models/Cart');

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
        // Validate environment variables first
        const envError = validateEnvironmentForFunction();
        if (envError) {
            return envError;
        }

        // Verify authentication
        const authResult = verifyToken(event);
        if (authResult.error) {
            return errorResponse(authResult.error, authResult.status);
        }

        await connectDB();

        // Find user's cart
        let cart = await Cart.findOne({ userId: authResult.userId });
        
        if (!cart) {
            // Create empty cart if none exists
            cart = new Cart({
                userId: authResult.userId,
                items: []
            });
            await cart.save();
        }

        // Return cart with calculated totals
        const cartData = {
            items: cart.items,
            total: cart.total,
            itemCount: cart.itemCount
        };

        return successResponse(cartData, 'Cart retrieved successfully');

    } catch (error) {
        console.error('Cart get error:', error);
        return errorResponse('Server error while retrieving cart', 500, error.message);
    }
};