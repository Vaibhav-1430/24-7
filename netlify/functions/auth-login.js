const { connectDB } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');
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
        // Validate environment variables first
        const envError = validateEnvironmentForFunction();
        if (envError) {
            return envError;
        }

        await connectDB();

        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return errorResponse('Invalid JSON in request body', 400);
        }

        const { email, password } = requestBody;

        // Validation
        if (!email || !password) {
            return errorResponse('Please provide email and password', 400);
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
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
        const token = generateToken(user._id.toString());

        // Return user without password
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

        return successResponse({
            token,
            user: userResponse
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Server error during login. Please try again.', 500, error.message);
    }
};