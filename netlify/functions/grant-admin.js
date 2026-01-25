const mongoose = require('mongoose');

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

        // Get the current user's token
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Authorization token required' })
            };
        }

        const token = authHeader.substring(7);
        
        // Find the user by token
        const user = await User.findOne({ authToken: token });
        
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid authentication token' })
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