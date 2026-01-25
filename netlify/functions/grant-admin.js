const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    hostel: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let User = null;

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

        // Create User model if it doesn't exist
        if (!User) {
            try {
                User = mongoose.model('User');
            } catch {
                User = mongoose.model('User', userSchema);
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Connect to database
        await connectDB();

        // Get the current user's token using JWT
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

        // Check if user's email contains 'admin' or if they should be granted admin access
        const shouldBeAdmin = user.email.includes('admin') || user.email === 'admin@cafe247.com';
        
        if (shouldBeAdmin && !user.isAdmin) {
            // Grant admin privileges
            await User.updateOne(
                { _id: user._id },
                { $set: { isAdmin: true } }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `Admin privileges granted to ${user.email}`,
                    user: {
                        email: user.email,
                        isAdmin: true
                    }
                })
            };
        } else if (user.isAdmin) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `User ${user.email} already has admin privileges`,
                    user: {
                        email: user.email,
                        isAdmin: true
                    }
                })
            };
        } else {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    error: 'Admin privileges cannot be granted',
                    message: 'Only users with email containing "admin" can be granted admin privileges',
                    suggestion: 'Create a new account with an email containing "admin" (e.g., admin@cafe247.com)'
                })
            };
        }

    } catch (error) {
        console.error('Grant admin error:', error);
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