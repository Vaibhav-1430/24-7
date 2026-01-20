const { connectDB } = require('./utils/db');
const { verifyToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
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

    try {
        await connectDB();

        // Verify token for all order operations
        const authResult = verifyToken(event);
        if (authResult.error) {
            return errorResponse(authResult.error, authResult.status);
        }

        const userId = authResult.userId;

        switch (event.httpMethod) {
            case 'GET':
                return await getOrders(userId, event.queryStringParameters);
            case 'POST':
                return await createOrder(userId, JSON.parse(event.body));
            case 'PUT':
                return await updateOrder(userId, event.path, JSON.parse(event.body));
            default:
                return errorResponse('Method not allowed', 405);
        }

    } catch (error) {
        console.error('Order operation error:', error);
        return errorResponse('Server error', 500, error.message);
    }
};

async function createOrder(userId, orderData) {
    try {
        const { items, delivery, contact, payment, pricing } = orderData;

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
}

async function getOrders(userId, queryParams) {
    try {
        const { status } = queryParams || {};
        
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
}

async function updateOrder(userId, path, updateData) {
    try {
        const pathParts = path.split('/');
        const orderId = pathParts[pathParts.length - 2]; // orders/123/cancel
        const action = pathParts[pathParts.length - 1];

        if (action === 'cancel') {
            const order = await Order.findOne({ 
                $or: [{ orderId: orderId }, { _id: orderId }],
                user: userId 
            });

            if (!order) {
                return errorResponse('Order not found', 404);
            }

            // Check if order can be cancelled
            if (order.status === 'delivered' || order.status === 'cancelled') {
                return errorResponse('Order cannot be cancelled', 400);
            }

            // Update order status
            order.status = 'cancelled';
            await order.save();

            return successResponse(order, 'Order cancelled successfully');
        }

        return errorResponse('Invalid action', 400);

    } catch (error) {
        console.error('Update order error:', error);
        return errorResponse('Server error while updating order', 500, error.message);
    }
}