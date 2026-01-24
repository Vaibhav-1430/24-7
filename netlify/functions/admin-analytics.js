const mongoose = require('mongoose');

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
        enum: ['received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'], 
        default: 'received' 
    },
    orderTime: { type: Date, default: Date.now },
    estimatedDelivery: { type: Date }
}, { timestamps: true });

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    halfPrice: { type: Number, min: 0 },
    category: { type: String, required: true },
    image: { type: String, default: 'images/placeholder.jpg' },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    isVeg: { type: Boolean, default: true }
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
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('🔧 Connecting to MongoDB...');
        cachedConnection = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        // Initialize models
        User = mongoose.models.User || mongoose.model('User', userSchema);
        Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
        MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

        console.log('✅ MongoDB connected successfully');
        return cachedConnection;
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

        // Verify admin token
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Authorization token required' })
            };
        }

        const token = authHeader.substring(7);
        
        // Verify token and check admin status
        const user = await User.findOne({ 
            authToken: token,
            isAdmin: true 
        });
        
        if (!user) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Admin access required' })
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

        // Today's orders and revenue
        const todayOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).lean();

        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

        // Pending orders
        const pendingOrders = await Order.countDocuments({
            status: { $in: ['received', 'preparing', 'ready'] }
        });

        // Total menu items
        const totalMenuItems = await MenuItem.countDocuments({});

        // Popular items analysis
        const popularItemsAggregation = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
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

        // Sales by day (last 7 days)
        const salesByDay = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Order status distribution
        const statusDistribution = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Peak hours analysis
        const peakHours = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { orderCount: -1 } }
        ]);

        // Customer insights
        const customerInsights = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$contact.phone',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$pricing.total' },
                    lastOrder: { $max: '$createdAt' }
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
                        todayOrders: todayOrders.length,
                        todayRevenue: todayRevenue,
                        pendingOrders: pendingOrders,
                        totalMenuItems: totalMenuItems
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