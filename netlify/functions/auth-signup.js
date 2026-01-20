const { connectDB } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');
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
        
        // Validate environment variables first
        console.log('🔧 Validating environment...');
        const envError = validateEnvironmentForFunction();
        if (envError) {
            console.error('❌ Environment validation failed:', envError);
            return envError;
        }
        console.log('✅ Environment validation passed');

        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
            console.log('📝 Request body parsed:', { 
                email: requestBody.email, 
                firstName: requestBody.firstName,
                lastName: requestBody.lastName 
            });
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            return errorResponse('Invalid JSON in request body', 400);
        }

        const { firstName, lastName, email, phone, hostel, roomNumber, password } = requestBody;

        // Validation
        if (!firstName || !lastName || !email || !phone || !hostel || !roomNumber || !password) {
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
        console.log('✅ Database connected successfully');

        // Check if user already exists
        console.log('🔧 Checking if user exists...');
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.error('❌ User already exists:', email);
            return errorResponse('User with this email already exists', 400);
        }
        console.log('✅ User does not exist, proceeding with creation');

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
            isAdmin: false
        });

        const savedUser = await newUser.save();
        console.log('✅ User created successfully:', savedUser._id);

        // Generate token
        console.log('🔧 Generating JWT token...');
        const token = generateToken(savedUser._id.toString());
        console.log('✅ JWT token generated');

        // Return user without password
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
        console.error('❌ Signup error:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            console.error('❌ Duplicate key error');
            return errorResponse('User with this email already exists', 400);
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            console.error('❌ Validation error:', validationErrors);
            return errorResponse(`Validation error: ${validationErrors.join(', ')}`, 400);
        }

        if (error.message.includes('JWT_SECRET')) {
            console.error('❌ JWT Secret missing');
            return errorResponse('Server configuration error', 500);
        }

        if (error.message.includes('MONGODB_URI')) {
            console.error('❌ MongoDB URI missing');
            return errorResponse('Database configuration error', 500);
        }

        // Generic server error
        return errorResponse('Server error during signup. Please try again.', 500, {
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};