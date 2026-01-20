const { connectDB } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

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

        const { email, password } = JSON.parse(event.body);

        // Validation
        if (!email || !password) {
            return errorResponse('Please provide email and password', 400);
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse('Invalid email or password', 400);
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse('Invalid email or password', 400);
        }

        // Check if user is active
        if (!user.isActive) {
            return errorResponse('Account is deactivated. Please contact support.', 400);
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user without password
        const userResponse = user.toJSON();

        return successResponse({
            token,
            user: userResponse
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Server error during login', 500, error.message);
    }
};