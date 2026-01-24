const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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
        
        await client.connect();
        const db = client.db('cafe247');
        const usersCollection = db.collection('users');
        
        // Verify token and check admin status
        const user = await usersCollection.findOne({ 
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

        const ordersCollection = db.collection('orders');
        const menuCollection = db.collection('menu_items');

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
        const todayOrders = await ordersCollection.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).toArray();

        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

        // Pending orders
        const pendingOrders = await ordersCollection.countDocuments({
            status: { $in: ['received', 'preparing', 'ready'] }
        });

        // Total menu items
        const totalMenuItems = await menuCollection.countDocuments({});

        // Popular items analysis
        const popularItemsAggregation = await ordersCollection.aggregate([
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
        ]).toArray();

        // Sales by day (last 7 days)
        const salesByDay = await ordersCollection.aggregate([
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
        ]).toArray();

        // Order status distribution
        const statusDistribution = await ordersCollection.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // Peak hours analysis
        const peakHours = await ordersCollection.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { orderCount: -1 } }
        ]).toArray();

        // Customer insights
        const customerInsights = await ordersCollection.aggregate([
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
        ]).toArray();

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
    } finally {
        await client.close();
    }
};