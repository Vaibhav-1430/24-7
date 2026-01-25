const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// User Schema for admin verification
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    hostel: { type: String, required: true },
    roomNumber: { type: String, required: true },
    password: { type: String, required: true },
    authToken: { type: String },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

// Order Schema
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
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: String,
        notes: String
    }],
    adminNotes: { type: String, default: '' },
    orderTime: { type: Date, default: Date.now },
    estimatedDelivery: { type: Date }
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let User = null;
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

        // Create models if they don't exist
        if (!User) {
            try {
                User = mongoose.model('User');
            } catch {
                User = mongoose.model('User', userSchema);
            }
        }

        if (!Order) {
            try {
                Order = mongoose.model('Order');
            } catch {
                Order = mongoose.model('Order', orderSchema, 'orders');
            }
        }

        cachedConnection = connection;
        console.log('✅ Connected to MongoDB Atlas');
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Connect to database
        await connectDB();

        // Verify admin token using JWT
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No token provided' })
            };
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify JWT token
        const jwtSecret = process.env.JWT_SECRET || 'b0abcba6c167b5bedd1c212099fe54bbf0226afb36995bca3eae3bbcf0f3f999c88d6b76efc74bf452ba706806ee5e4758cc54241750b8e21719d96be2117fe4';
        
        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (jwtError) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid or expired token' })
            };
        }

        // Find user by ID from JWT
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        // Check if user has admin privileges
        if (!user.isAdmin) {
            console.log(`❌ Admin access denied for user: ${user.email}, isAdmin: ${user.isAdmin}`);
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                    error: 'Admin access required',
                    message: `User ${user.email} does not have admin privileges.`,
                    userEmail: user.email,
                    isAdmin: user.isAdmin,
                    debug: 'Check if user account has admin privileges set to true'
                })
            };
        }

        console.log(`✅ Admin access granted for user: ${user.email}`);

        if (event.httpMethod === 'GET') {
            // Get all orders with optional status filter
            const { status, limit = '50' } = event.queryStringParameters || {};
            
            console.log('🔍 Admin: Fetching orders...');
            console.log('🔍 Admin: Status filter:', status);
            console.log('🔍 Admin: Limit:', limit);
            
            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            }

            console.log('🔍 Admin: Query:', query);

            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .lean();

            console.log(`🔍 Admin: Found ${orders.length} orders in database`);
            console.log('🔍 Admin: First order:', orders[0]);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    orders: orders,
                    count: orders.length
                })
            };
        }

        if (event.httpMethod === 'PUT') {
            // Update order status
            const { orderId, status, notes } = JSON.parse(event.body);
            
            if (!orderId || !status) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Order ID and status are required' })
                };
            }

            const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid status' })
                };
            }

            const updateData = {
                status: status,
                updatedAt: new Date()
            };

            if (notes) {
                updateData.adminNotes = notes;
            }

            // Add status history
            const statusHistory = {
                status: status,
                timestamp: new Date(),
                updatedBy: user.email,
                notes: notes || ''
            };

            const result = await Order.updateOne(
                { orderNumber: orderId },
                { 
                    $set: updateData,
                    $push: { statusHistory: statusHistory }
                }
            );

            if (result.matchedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Order not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Order status updated successfully'
                })
            };
        }

        if (event.httpMethod === 'DELETE') {
            // Delete order
            const { orderId } = event.queryStringParameters || {};
            
            if (!orderId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Order ID is required' })
                };
            }

            console.log(`🗑️ Admin: Deleting order ${orderId} by ${user.email}`);

            const result = await Order.deleteOne({ orderNumber: orderId });

            if (result.deletedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Order not found' })
                };
            }

            console.log(`✅ Admin: Order ${orderId} deleted successfully`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Order deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Admin orders error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};