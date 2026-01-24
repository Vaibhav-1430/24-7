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

        const menuCollection = db.collection('menu_items');

        if (event.httpMethod === 'GET') {
            // Get all menu items for admin
            const menuItems = await menuCollection
                .find({})
                .sort({ category: 1, name: 1 })
                .toArray();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    menuItems: menuItems
                })
            };
        }

        if (event.httpMethod === 'POST') {
            // Add new menu item
            const itemData = JSON.parse(event.body);
            
            // Validate required fields
            if (!itemData.name || !itemData.price || !itemData.category) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Name, price, and category are required' })
                };
            }

            // Check if item already exists
            const existingItem = await menuCollection.findOne({ 
                name: itemData.name,
                category: itemData.category 
            });
            
            if (existingItem) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Menu item with this name already exists in this category' })
                };
            }

            const newItem = {
                ...itemData,
                id: Date.now(),
                createdAt: new Date(),
                createdBy: user.email,
                available: itemData.available !== false, // Default to true
                popular: itemData.popular || false
            };

            const result = await menuCollection.insertOne(newItem);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Menu item added successfully',
                    itemId: result.insertedId
                })
            };
        }

        if (event.httpMethod === 'PUT') {
            // Update menu item
            const { itemId, ...updateData } = JSON.parse(event.body);
            
            if (!itemId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Item ID is required' })
                };
            }

            // Add update metadata
            updateData.updatedAt = new Date();
            updateData.updatedBy = user.email;

            const result = await menuCollection.updateOne(
                { id: parseInt(itemId) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Menu item not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Menu item updated successfully'
                })
            };
        }

        if (event.httpMethod === 'DELETE') {
            // Delete menu item
            const { itemId } = event.queryStringParameters || {};
            
            if (!itemId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Item ID is required' })
                };
            }

            const result = await menuCollection.deleteOne({ id: parseInt(itemId) });

            if (result.deletedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Menu item not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Menu item deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Admin menu error:', error);
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