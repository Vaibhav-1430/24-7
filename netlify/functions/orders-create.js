const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');
const Order = require('./models/Order');
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
        // Validate environment variables first
        const envError = validateEnvironmentForFunction();
        if (envError) {
            return envError;
        }

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

        const { items, delivery, contact, payment, pricing } = requestBody;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse('Order must contain at least one item', 400);
        }

        if (!delivery || !contact || !payment || !pricing) {
            return errorResponse('Please provide all required order information', 400);
        }

        // Generate sequential order ID
        const orderCount = await Order.countDocuments();
        const nextOrderNumber = orderCount + 1;
        const orderId = `001${nextOrderNumber.toString().padStart(3, '0')}`;

        // Create new order
        const newOrder = new Order({
            orderId: orderId,
            user: userId,
            items: items.map(item => ({
                menuItem: item.menuItemId || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions || ''
            })),
            delivery: delivery,
            contact: contact,
            payment: payment,
            pricing: pricing,
            status: 'received',
            estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });

        await newOrder.save();

        // Clear user's cart after successful order
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return successResponse(newOrder, 'Order placed successfully');

    } catch (error) {
        console.error('Create order error:', error);
        return errorResponse('Server error while creating order', 500, error.message);
    }
};