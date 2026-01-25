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
    orderTime: { type: Date, default: Date.now },
    deliveredAt: { type: Date }, // Track when order was actually delivered
    estimatedDelivery: { type: Date }
}, { timestamps: true });

// Menu Item Schema - matching the actual menu items
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    fullPrice: { type: Number, required: true, min: 0 },
    halfPrice: { type: Number, min: 0 },
    image: { type: String, default: 'images/default-food.jpg' },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    isVeg: { type: Boolean, default: true },
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Spicy'], default: 'Medium' }
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let User = null;
let Order = null;
let MenuItem = null;

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

        if (!MenuItem) {
            try {
                MenuItem = mongoose.model('MenuItem');
            } catch {
                MenuItem = mongoose.model('MenuItem', menuItemSchema);
            }
        }

        cachedConnection = connection;
        console.log('✅ Analytics: Connected to MongoDB Atlas');
        return connection;
    } catch (error) {
        console.error('❌ Analytics: MongoDB connection failed:', error.message);
        throw error;
    }
};

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
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
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                    error: 'Admin access required',
                    message: `User ${user.email} does not have admin privileges.`
                })
            };
        }

        // Get date range (default to last 30 days)
        const { days = '30' } = event.queryStringParameters || {};
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Dashboard stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's delivered orders and revenue (based on delivery completion)
        const todayDeliveredOrders = await Order.find({
            status: 'delivered',
            deliveredAt: { $gte: today, $lt: tomorrow }
        }).lean();

        console.log(`📊 Analytics: Found ${todayDeliveredOrders.length} orders delivered today`);
        console.log('📊 Analytics: Today date range:', { today, tomorrow });

        const todayRevenue = todayDeliveredOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
        console.log(`📊 Analytics: Today's revenue from delivered orders: ₹${todayRevenue}`);

        // All orders placed today (for comparison)
        const todayPlacedOrders = await Order.find({
            orderTime: { $gte: today, $lt: tomorrow }
        }).lean();
        console.log(`📊 Analytics: ${todayPlacedOrders.length} orders were placed today`);

        // Pending orders (using correct status values)
        const pendingOrders = await Order.countDocuments({
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
        });
        console.log(`📊 Analytics: Pending orders: ${pendingOrders}`);

        // Delivered orders (all-time)
        const deliveredOrders = await Order.countDocuments({
            status: 'delivered'
        });
        console.log(`📊 Analytics: Delivered orders: ${deliveredOrders}`);

        // Total orders (all-time)
        const totalOrders = await Order.countDocuments({});
        console.log(`📊 Analytics: Total orders: ${totalOrders}`);

        // Total revenue (all-time, only from delivered orders)
        const totalRevenueResult = await Order.aggregate([
            { $match: { status: 'delivered', deliveredAt: { $exists: true } } },
            { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
        console.log(`📊 Analytics: Total revenue from delivered orders: ₹${totalRevenue}`);

        // Total menu items
        const totalMenuItems = await MenuItem.countDocuments({});
        console.log(`📊 Analytics: Total menu items: ${totalMenuItems}`);

        // Popular items analysis (based on order placement time)
        const popularItemsAggregation = await Order.aggregate([
            { $match: { orderTime: { $gte: startDate } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        // Sales by day (last 7 days, based on delivery completion)
        const salesByDay = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    deliveredAt: { 
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        $exists: true 
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' }
                    },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Order status distribution (based on order placement time)
        const statusDistribution = await Order.aggregate([
            { $match: { orderTime: { $gte: startDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Peak hours analysis (based on order placement time)
        const peakHours = await Order.aggregate([
            { $match: { orderTime: { $gte: startDate } } },
            {
                $group: {
                    _id: { $hour: '$orderTime' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { orderCount: -1 } }
        ]);

        // Customer insights (based on order placement time)
        const customerInsights = await Order.aggregate([
            { $match: { orderTime: { $gte: startDate } } },
            {
                $group: {
                    _id: '$contact.phone',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$pricing.total' },
                    lastOrder: { $max: '$orderTime' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analytics: {
                    dashboard: {
                        todayOrders: todayDeliveredOrders.length, // Orders delivered today
                        todayRevenue: todayRevenue, // Revenue from orders delivered today
                        pendingOrders: pendingOrders,
                        totalMenuItems: totalMenuItems,
                        deliveredOrders: deliveredOrders,
                        totalOrders: totalOrders,
                        totalRevenue: totalRevenue, // Revenue from all delivered orders
                        todayPlacedOrders: todayPlacedOrders.length // Additional metric for placed orders
                    },
                    popularItems: popularItemsAggregation,
                    salesByDay: salesByDay,
                    statusDistribution: statusDistribution,
                    peakHours: peakHours,
                    customerInsights: customerInsights,
                    period: {
                        days: parseInt(days),
                        startDate: startDate,
                        endDate: new Date()
                    }
                }
            })
        };

    } catch (error) {
        console.error('Admin analytics error:', error);
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