const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Self-contained Cart Schema
const cartItemSchema = new mongoose.Schema({
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: '' }
});

const cartSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    items: [cartItemSchema],
    total: { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    collection: 'user_carts' // Use a different collection name to avoid conflicts
});

// Global connection cache
let cachedConnection = null;
let Cart = null;

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

        // Create Cart model with explicit collection name
        Cart = mongoose.model('UserCart', cartSchema, 'user_carts');

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

// Helper function to calculate cart totals
const calculateCartTotals = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, itemCount };
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

        console.log(`🛒 Cart request: ${event.httpMethod} for user ${userId}`);

        // Connect to database
        await connectDB();

        // Handle different HTTP methods
        switch (event.httpMethod) {
            case 'GET':
                return await getCart(userId, headers);
            case 'POST':
                return await addToCart(userId, JSON.parse(event.body || '{}'), headers);
            case 'PUT':
                return await updateCartItem(userId, JSON.parse(event.body || '{}'), headers);
            case 'DELETE':
                return await clearCart(userId, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Method not allowed' })
                };
        }

    } catch (error) {
        console.error('❌ Cart error:', error);

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
                message: 'Server error while processing cart request',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

// Get user's cart
async function getCart(userId, headers) {
    try {
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            // Create empty cart if doesn't exist
            cart = new Cart({
                user: userId,
                items: [],
                total: 0,
                itemCount: 0
            });
            await cart.save();
        }

        console.log(`✅ Cart retrieved for user ${userId}: ${cart.items.length} items`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Cart retrieved successfully',
                data: {
                    items: cart.items,
                    total: cart.total,
                    itemCount: cart.itemCount
                }
            })
        };

    } catch (error) {
        console.error('❌ Error getting cart:', error);
        throw error;
    }
}

// Add item to cart
async function addToCart(userId, itemData, headers) {
    try {
        const { menuItemId, name, price, quantity, instructions } = itemData;

        // Validate required fields
        if (!menuItemId || !name || !price || !quantity) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Missing required fields: menuItemId, name, price, quantity'
                })
            };
        }

        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.menuItemId === menuItemId && item.name === name
        );

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].instructions = instructions || cart.items[existingItemIndex].instructions;
        } else {
            // Add new item
            cart.items.push({
                menuItemId,
                name,
                price,
                quantity,
                instructions: instructions || ''
            });
        }

        // Calculate totals
        const { total, itemCount } = calculateCartTotals(cart.items);
        cart.total = total;
        cart.itemCount = itemCount;
        cart.updatedAt = new Date();

        await cart.save();

        console.log(`✅ Item added to cart for user ${userId}: ${name} x${quantity}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Item added to cart successfully',
                data: {
                    items: cart.items,
                    total: cart.total,
                    itemCount: cart.itemCount
                }
            })
        };

    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        throw error;
    }
}

// Update cart item quantity
async function updateCartItem(userId, updateData, headers) {
    try {
        const { itemId, quantity } = updateData;

        if (!itemId || quantity === undefined) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Missing required fields: itemId, quantity'
                })
            };
        }

        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, message: 'Cart not found' })
            };
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        } else {
            // Update quantity
            const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Item not found in cart' })
                };
            }
            cart.items[itemIndex].quantity = quantity;
        }

        // Calculate totals
        const { total, itemCount } = calculateCartTotals(cart.items);
        cart.total = total;
        cart.itemCount = itemCount;
        cart.updatedAt = new Date();

        await cart.save();

        console.log(`✅ Cart updated for user ${userId}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Cart updated successfully',
                data: {
                    items: cart.items,
                    total: cart.total,
                    itemCount: cart.itemCount
                }
            })
        };

    } catch (error) {
        console.error('❌ Error updating cart:', error);
        throw error;
    }
}

// Clear cart
async function clearCart(userId, headers) {
    try {
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, message: 'Cart not found' })
            };
        }

        cart.items = [];
        cart.total = 0;
        cart.itemCount = 0;
        cart.updatedAt = new Date();

        await cart.save();

        console.log(`✅ Cart cleared for user ${userId}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Cart cleared successfully',
                data: {
                    items: [],
                    total: 0,
                    itemCount: 0
                }
            })
        };

    } catch (error) {
        console.error('❌ Error clearing cart:', error);
        throw error;
    }
}