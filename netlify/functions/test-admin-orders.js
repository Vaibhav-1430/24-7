const mongoose = require('mongoose');

// Order Schema - exactly matching orders.js
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
        transactionId: { type: String }
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
    estimatedDelivery: { type: Date }
}, { timestamps: true });

let cachedConnection = null;
let Order = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';
        
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            mongoose.models = {};
            mongoose.modelSchemas = {};
        }

        const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });

        Order = mongoose.model('Order', orderSchema, 'orders');

        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await connectDB();
        
        console.log('🧪 TEST: Fetching all orders...');
        
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        console.log(`🧪 TEST: Found ${orders.length} orders`);
        console.log('🧪 TEST: First order:', orders[0]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `TEST: Found ${orders.length} orders in database`,
                count: orders.length,
                orders: orders,
                firstOrder: orders[0] || null
            })
        };

    } catch (error) {
        console.error('🧪 TEST: Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'TEST failed',
                details: error.message 
            })
        };
    }
};