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
    isVeg: { type: Boolean, default: true },
    createdBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let User = null;
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

        if (event.httpMethod === 'GET') {
            // Get all menu items for admin
            const menuItems = await MenuItem.find({})
                .sort({ category: 1, name: 1 })
                .lean();

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
            const existingItem = await MenuItem.findOne({ 
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

            // Generate new ID
            const lastItem = await MenuItem.findOne().sort({ id: -1 });
            const newId = lastItem ? lastItem.id + 1 : 1;

            const newItem = new MenuItem({
                ...itemData,
                id: newId,
                createdBy: user.email,
                available: itemData.available !== false, // Default to true
                popular: itemData.popular || false
            });

            const savedItem = await newItem.save();

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Menu item added successfully',
                    itemId: savedItem._id
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
            updateData.updatedBy = user.email;

            const result = await MenuItem.updateOne(
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

            const result = await MenuItem.deleteOne({ id: parseInt(itemId) });

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
    }
};