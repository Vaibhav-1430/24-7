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

// Menu Item Schema - matching existing menu.js schema
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
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Spicy'], default: 'Medium' },
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
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';
        
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
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

        if (!MenuItem) {
            try {
                MenuItem = mongoose.model('MenuItem');
            } catch {
                MenuItem = mongoose.model('MenuItem', menuItemSchema);
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
            authToken: token
        });
        
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid authentication token' })
            };
        }

        // Check if user has admin privileges
        if (!user.isAdmin) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                    error: 'Admin access required',
                    message: `User ${user.email} does not have admin privileges. Please contact administrator or create account with email containing 'admin'.`,
                    userEmail: user.email,
                    isAdmin: user.isAdmin
                })
            };
        }

        if (event.httpMethod === 'GET') {
            // Get all menu items for admin
            const menuItems = await MenuItem.find({})
                .sort({ category: 1, name: 1 })
                .lean();

            // Transform data to match admin interface expectations
            const transformedItems = menuItems.map(item => ({
                id: item._id.toString(),
                name: item.name,
                description: item.description,
                price: item.fullPrice, // Map fullPrice to price for admin interface
                halfPrice: item.halfPrice,
                category: item.category,
                image: item.image,
                available: item.available,
                popular: item.popular,
                isVeg: item.isVeg,
                spiceLevel: item.spiceLevel,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    menuItems: transformedItems
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

            const newItem = new MenuItem({
                name: itemData.name,
                description: itemData.description,
                fullPrice: itemData.price, // Map price to fullPrice for database
                halfPrice: itemData.halfPrice || null,
                category: itemData.category,
                image: itemData.image || 'images/default-food.jpg',
                available: itemData.available !== false,
                popular: itemData.popular || false,
                isVeg: itemData.isVeg !== false,
                spiceLevel: itemData.spiceLevel || 'Medium',
                createdBy: user.email
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

            // Transform update data to match database schema
            const dbUpdateData = {
                updatedBy: user.email
            };

            // Map admin interface fields to database fields
            if (updateData.name) dbUpdateData.name = updateData.name;
            if (updateData.description) dbUpdateData.description = updateData.description;
            if (updateData.price) dbUpdateData.fullPrice = updateData.price;
            if (updateData.halfPrice !== undefined) dbUpdateData.halfPrice = updateData.halfPrice;
            if (updateData.category) dbUpdateData.category = updateData.category;
            if (updateData.image) dbUpdateData.image = updateData.image;
            if (updateData.available !== undefined) dbUpdateData.available = updateData.available;
            if (updateData.popular !== undefined) dbUpdateData.popular = updateData.popular;
            if (updateData.isVeg !== undefined) dbUpdateData.isVeg = updateData.isVeg;
            if (updateData.spiceLevel) dbUpdateData.spiceLevel = updateData.spiceLevel;

            const result = await MenuItem.updateOne(
                { _id: itemId },
                { $set: dbUpdateData }
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

            const result = await MenuItem.deleteOne({ _id: itemId });

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