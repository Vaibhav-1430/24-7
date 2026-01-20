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
        await connectDB();

        const { firstName, lastName, email, phone, hostel, roomNumber, password } = JSON.parse(event.body);

        // Validation
        if (!firstName || !lastName || !email || !phone || !hostel || !roomNumber || !password) {
            return errorResponse('Please provide all required fields', 400);
        }

        if (password.length < 6) {
            return errorResponse('Password must be at least 6 characters long', 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse('User with this email already exists', 400);
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            phone,
            hostel,
            roomNumber,
            password,
            isActive: true,
            isAdmin: false
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        // Return user without password
        const userResponse = newUser.toJSON();

        return successResponse({
            token,
            user: userResponse
        }, 'Account created successfully');

    } catch (error) {
        console.error('Signup error:', error);
        return errorResponse('Server error during signup', 500, error.message);
    }
};