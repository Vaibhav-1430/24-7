const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Self-contained Order Schema
const orderItemSchema = new mongoose.Schema({
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    contact: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    delivery: {
        hostel: { type: String, required: true },
        roomNumber: { type: String, required: true },
        instructions: { type: String, default: '' }
    },
    payment: {
        method: { type: String, required: true, enum: ['cod', 'upi'] },
        transactionId: { type: String },
        screenshot: { type: String }, // Base64 encoded screenshot for UPI payments
        screenshotName: { type: String }, // Original filename
        verified: { type: Boolean, default: false } // Payment verification status
    },
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        deliveryFee: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 }
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    orderTime: { type: Date, default: Date.now },
    estimatedDelivery: { type: Date },
    paymentVerificationNotes: { type: String } // Admin notes for payment verification
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let Order = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';
        
        // Completely disconnect and clear models if connection exists
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            // Clear all models
            mongoose.models = {};
            mongoose.modelSchemas = {};
        }

        const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });

        // Create Order model with explicit collection name
        Order = mongoose.model('Order', orderSchema, 'orders');

        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

// Helper function to verify JWT token
const verifyToken = (token) => {
    try {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        return jwt.verify(token, jwtSecret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Helper function to generate order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp.slice(-6)}${random}`;
};

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        // Verify authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Authentication required' })
            };
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        const userId = decoded.userId;

        console.log(`📋 Order request: ${event.httpMethod} for user ${userId}`);

        // Connect to database
        await connectDB();

        // Handle different HTTP methods
        switch (event.httpMethod) {
            case 'GET':
                return await getOrders(userId, headers);
            case 'POST':
                return await createOrder(userId, JSON.parse(event.body || '{}'), headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Method not allowed' })
                };
        }

    } catch (error) {
        console.error('❌ Order error:', error);

        if (error.message === 'Invalid token') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Invalid or expired token' })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error while processing order request',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

// Create new order
async function createOrder(userId, orderData, headers) {
    try {
        const { items, contact, delivery, payment, pricing } = orderData;

        // Validate required fields
        if (!items || !items.length) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Order must contain at least one item'
                })
            };
        }

        if (!contact || !contact.name || !contact.phone) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Contact information is required'
                })
            };
        }

        if (!delivery || !delivery.hostel || !delivery.roomNumber) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Delivery information is required'
                })
            };
        }

        if (!payment || !payment.method) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Payment method is required'
                })
            };
        }

        if (!pricing || !pricing.subtotal || !pricing.total) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Pricing information is required'
                })
            };
        }

        // Validate UPI payment requirements
        if (payment.method === 'upi') {
            if (!payment.screenshot) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Payment screenshot is required for UPI payments'
                    })
                };
            }
            
            // Validate screenshot data
            if (!payment.screenshot.startsWith('data:image/')) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Invalid screenshot format'
                    })
                };
            }
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Calculate estimated delivery time (30 minutes from now)
        const estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000);

        // Set initial status based on payment method
        let initialStatus = 'pending';
        if (payment.method === 'upi' && !payment.verified) {
            initialStatus = 'pending'; // UPI orders stay pending until payment is verified
        }

        // Create order
        const order = new Order({
            userId,
            orderNumber,
            items,
            contact,
            delivery,
            payment: {
                method: payment.method,
                transactionId: payment.transactionId || null,
                screenshot: payment.screenshot || null,
                screenshotName: payment.screenshotName || null,
                verified: payment.verified || false
            },
            pricing,
            status: initialStatus,
            orderTime: new Date(),
            estimatedDelivery
        });

        await order.save();

        console.log(`✅ Order created successfully: ${orderNumber} for user ${userId} (Payment: ${payment.method}${payment.method === 'upi' ? ', Screenshot: ' + (payment.screenshot ? 'Yes' : 'No') : ''})`);

        // Return order data (exclude screenshot from response for size)
        const orderResponse = {
            id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            contact: order.contact,
            delivery: order.delivery,
            payment: {
                method: order.payment.method,
                transactionId: order.payment.transactionId,
                verified: order.payment.verified,
                hasScreenshot: !!order.payment.screenshot
            },
            pricing: order.pricing,
            status: order.status,
            orderTime: order.orderTime,
            estimatedDelivery: order.estimatedDelivery
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Order created successfully',
                data: orderResponse
            })
        };

    } catch (error) {
        console.error('❌ Error creating order:', error);
        throw error;
    }
}

// Get user's orders
async function getOrders(userId, headers) {
    try {
        const orders = await Order.find({ userId }).sort({ orderTime: -1 });

        console.log(`✅ Retrieved ${orders.length} orders for user ${userId}`);

        const ordersResponse = orders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            contact: order.contact,
            delivery: order.delivery,
            payment: {
                method: order.payment.method,
                transactionId: order.payment.transactionId,
                verified: order.payment.verified,
                hasScreenshot: !!order.payment.screenshot
            },
            pricing: order.pricing,
            status: order.status,
            orderTime: order.orderTime,
            estimatedDelivery: order.estimatedDelivery
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Orders retrieved successfully',
                data: ordersResponse
            })
        };

    } catch (error) {
        console.error('❌ Error getting orders:', error);
        throw error;
    }
}