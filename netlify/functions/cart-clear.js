const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
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

    if (event.httpMethod !== 'DELETE') {
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

        let cart = await Cart.findOne({ user: userId });
        
        if (cart) {
            cart.items = [];
            await cart.save();
        } else {
            cart = new Cart({
                user: userId,
                items: []
            });
            await cart.save();
        }

        return successResponse(cart, 'Cart cleared');

    } catch (error) {
        console.error('Clear cart error:', error);
        return errorResponse('Error clearing cart', 500, error.message);
    }
};