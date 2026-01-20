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

        const { firstName, lastName, email, phone, hostel, roomNumber, password } = requestBody;

        // Validation
        if (!firstName || !lastName || !email || !phone || !hostel || !roomNumber || !password) {
            return errorResponse('Please provide all required fields', 400);
        }

        if (password.length < 6) {
            return errorResponse('Password must be at least 6 characters long', 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return errorResponse('User with this email already exists', 400);
        }

        // Create new user
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

        // Generate token
        const token = generateToken(savedUser._id.toString());

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

        return successResponse({
            token,
            user: userResponse
        }, 'Account created successfully');

    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return errorResponse('User with this email already exists', 400);
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return errorResponse(`Validation error: ${validationErrors.join(', ')}`, 400);
        }

        return errorResponse('Server error during signup. Please try again.', 500, error.message);
    }
};