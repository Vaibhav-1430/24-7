const { connectDB } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const User = require('./models/User');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        console.log('🚀 Auth signup function started');
        
        // Check environment variables
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not set');
            return errorResponse('Database configuration missing', 500);
        }
        
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not set');
            return errorResponse('Authentication configuration missing', 500);
        }
        
        console.log('✅ Environment variables present');

        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
            console.log('📝 Request received for email:', requestBody.email);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            return errorResponse('Invalid request format', 400);
        }

        const { firstName, lastName, email, phone, hostel, roomNumber, password } = requestBody;

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            console.error('❌ Missing required fields');
            return errorResponse('Please provide all required fields', 400);
        }

        if (password.length < 6) {
            console.error('❌ Password too short');
            return errorResponse('Password must be at least 6 characters long', 400);
        }

        // Connect to database
        console.log('🔧 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected');

        // Check if user exists
        console.log('🔧 Checking if user exists...');
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.error('❌ User already exists:', email);
            return errorResponse('User with this email already exists', 400);
        }
        console.log('✅ User does not exist, creating new user');

        // Create new user
        console.log('🔧 Creating user...');
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            hostel: hostel?.trim() || '',
            roomNumber: roomNumber?.trim() || '',
            password,
            isActive: true,
            isAdmin: false
        });

        const savedUser = await newUser.save();
        console.log('✅ User created with ID:', savedUser._id);

        // Generate token
        console.log('🔧 Generating token...');
        const token = generateToken(savedUser._id.toString());
        console.log('✅ Token generated');

        // Prepare response
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
        return successResponse({
            token,
            user: userResponse
        }, 'Account created successfully');

    } catch (error) {
        console.error('❌ Signup error:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Handle specific errors
        if (error.code === 11000) {
            return errorResponse('User with this email already exists', 400);
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return errorResponse(`Validation error: ${validationErrors.join(', ')}`, 400);
        }

        if (error.message.includes('Database connection failed')) {
            return errorResponse('Database connection error. Please try again.', 500);
        }

        if (error.message.includes('JWT_SECRET')) {
            return errorResponse('Authentication system error', 500);
        }

        // Generic error
        return errorResponse('Server error during signup. Please try again.', 500);
    }
};