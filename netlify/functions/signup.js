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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Global connection cache
let cachedConnection = null;
let User = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        // Working MongoDB Atlas connection
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
        console.log('🚀 Starting signup process...');
        
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        const { firstName, lastName, email, phone, hostel, roomNumber, password } = requestBody;

        console.log('📝 Signup request for:', email);

        // Validation
        if (!firstName || !lastName || !email || !phone || !hostel || !roomNumber || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Please provide all required fields'
                })
            };
        }

        if (password.length < 6) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                })
            };
        }

        // Connect to database
        console.log('🔧 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected');

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'User with this email already exists'
                })
            };
        }

        // Create new user
        console.log('🔧 Creating new user...');
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            hostel: hostel.trim(),
            roomNumber: roomNumber.trim(),
            password,
            isActive: true,
            isAdmin: email.includes('admin') || email === 'admin@cafe247.com' // Make admin users
        });

        const savedUser = await newUser.save();
        console.log('✅ User created with ID:', savedUser._id);

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'b0abcba6c167b5bedd1c212099fe54bbf0226afb36995bca3eae3bbcf0f3f999c88d6b76efc74bf452ba706806ee5e4758cc54241750b8e21719d96be2117fe4';
        const token = jwt.sign({ userId: savedUser._id.toString() }, jwtSecret, { expiresIn: '7d' });

        // Prepare user response (without password)
        const userResponse = {
            id: savedUser._id,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            phone: savedUser.phone,
            hostel: savedUser.hostel,
            roomNumber: savedUser.roomNumber,
            isActive: savedUser.isActive,
            isAdmin: savedUser.isAdmin,
            fullName: `${savedUser.firstName} ${savedUser.lastName}`,
            createdAt: savedUser.createdAt
        };

        console.log('✅ Signup successful for:', email);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Account created successfully',
                data: {
                    token,
                    user: userResponse
                }
            })
        };

    } catch (error) {
        console.error('❌ Signup error:', error);

        // Handle specific errors
        if (error.code === 11000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'User with this email already exists'
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error during signup. Please try again.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};