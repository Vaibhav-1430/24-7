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

    if (event.httpMethod !== 'POST') {
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

        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            return errorResponse('Invalid JSON in request body', 400);
        }

        const { menuItemId, name, price, quantity, instructions } = requestBody;

        // Validation
        if (!menuItemId || !name || !price || !quantity) {
            return errorResponse('Please provide all required fields: menuItemId, name, price, quantity', 400);
        }

        if (quantity < 1 || quantity > 10) {
            return errorResponse('Quantity must be between 1 and 10', 400);
        }

        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.menuItem.toString() === menuItemId && 
            item.instructions === (instructions || '')
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
            if (cart.items[existingItemIndex].quantity > 10) {
                cart.items[existingItemIndex].quantity = 10;
            }
        } else {
            // Add new item
            cart.items.push({
                menuItem: menuItemId,
                name,
                price,
                quantity,
                instructions: instructions || ''
            });
        }

        await cart.save();

        return successResponse(cart, 'Item added to cart');

    } catch (error) {
        console.error('Add to cart error:', error);
        return errorResponse('Error adding to cart', 500, error.message);
    }
};