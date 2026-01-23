const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Self-contained User Schema
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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        console.log('🚀 Starting login process...');
        
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        const { email, password } = requestBody;

        console.log('📝 Login request for:', email);

        // Validation
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Please provide email and password'
                })
            };
        }

        // Connect to database
        console.log('🔧 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected');

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid email or password'
                })
            };
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid email or password'
                })
            };
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'b0abcba6c167b5bedd1c212099fe54bbf0226afb36995bca3eae3bbcf0f3f999c88d6b76efc74bf452ba706806ee5e4758cc54241750b8e21719d96be2117fe4';
        const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: '7d' });

        // Prepare user response (without password)
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            hostel: user.hostel,
            roomNumber: user.roomNumber,
            isActive: user.isActive,
            isAdmin: user.isAdmin,
            fullName: `${user.firstName} ${user.lastName}`,
            createdAt: user.createdAt
        };

        console.log('✅ Login successful for:', email);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: userResponse
                }
            })
        };

    } catch (error) {
        console.error('❌ Login error:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error during login. Please try again.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};