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

// Menu Item Schema - matching existing menu.js schema with stock management
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
    // Stock Management Fields
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 100, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    stockStatus: { 
        type: String, 
        enum: ['in-stock', 'low-stock', 'out-of-stock'], 
        default: 'in-stock' 
    },
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
                    message: `User ${user.email} does not have admin privileges. Please contact administrator or create account with email containing 'admin'.`,
                    userEmail: user.email,
                    isAdmin: user.isAdmin
                })
            };
        }

        if (event.httpMethod === 'GET') {
            // Get all menu items for admin
            console.log('🔍 Admin: Fetching all menu items...');
            
            const menuItems = await MenuItem.find({})
                .sort({ category: 1, name: 1 })
                .lean();

            console.log(`🔍 Admin: Found ${menuItems.length} menu items in database`);

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
                // Stock Management Fields
                inStock: item.inStock !== undefined ? item.inStock : true,
                stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 100,
                lowStockThreshold: item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10,
                stockStatus: item.stockStatus || 'in-stock',
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

            console.log(`✅ Admin: Returning ${transformedItems.length} transformed menu items`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    menuItems: transformedItems,
                    count: transformedItems.length
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

            // Check if item already exists (unless force add is enabled)
            if (!itemData.forceAdd) {
                const existingItem = await MenuItem.findOne({ 
                    name: { $regex: new RegExp(`^${itemData.name.trim()}$`, 'i') }, // Case-insensitive exact match
                    category: itemData.category 
                });
                
                if (existingItem) {
                    return {
                        statusCode: 409,
                        headers,
                        body: JSON.stringify({ 
                            error: `Menu item "${itemData.name}" already exists in "${itemData.category}" category`,
                            suggestion: 'Try using a different name, modify the existing item, or enable "Force add" option',
                            existingItem: {
                                id: existingItem._id,
                                name: existingItem.name,
                                description: existingItem.description,
                                price: existingItem.fullPrice
                            }
                        })
                    };
                }
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
                // Stock Management Fields
                inStock: itemData.inStock !== false,
                stockQuantity: itemData.stockQuantity || 100,
                lowStockThreshold: itemData.lowStockThreshold || 10,
                stockStatus: itemData.stockStatus || 'in-stock',
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
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Item ID is required' 
                    })
                };
            }

            console.log('🔄 Updating menu item:', itemId);
            console.log('📝 Update data:', updateData);

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(itemId)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Invalid item ID format' 
                    })
                };
            }

            // Transform update data to match database schema
            const dbUpdateData = {
                updatedBy: user.email,
                updatedAt: new Date()
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
            // Stock Management Fields
            if (updateData.inStock !== undefined) dbUpdateData.inStock = updateData.inStock;
            if (updateData.stockQuantity !== undefined) dbUpdateData.stockQuantity = updateData.stockQuantity;
            if (updateData.lowStockThreshold !== undefined) dbUpdateData.lowStockThreshold = updateData.lowStockThreshold;
            if (updateData.stockStatus) dbUpdateData.stockStatus = updateData.stockStatus;

            console.log('💾 Database update data:', dbUpdateData);

            try {
                const result = await MenuItem.updateOne(
                    { _id: new mongoose.Types.ObjectId(itemId) },
                    { $set: dbUpdateData }
                );

                console.log('✅ Update result:', result);

                if (result.matchedCount === 0) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ 
                            success: false,
                            error: 'Menu item not found' 
                        })
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
            } catch (updateError) {
                console.error('❌ Update error:', updateError);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Failed to update menu item: ' + updateError.message 
                    })
                };
            }
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