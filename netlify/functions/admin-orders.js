const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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

        if (event.httpMethod === 'GET') {
            // Get all orders with optional status filter
            const { status, limit = '50' } = event.queryStringParameters || {};
            
            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            }

            const orders = await ordersCollection
                .find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .toArray();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    orders: orders
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

            const validStatuses = ['received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid status' })
                };
            }

            const updateData = {
                status: status,
                updatedAt: new Date(),
                updatedBy: user.email
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

            const result = await ordersCollection.updateOne(
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
    } finally {
        await client.close();
    }
};