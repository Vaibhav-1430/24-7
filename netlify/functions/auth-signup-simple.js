const jwt = require('jsonwebtoken');
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
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Method not allowed'
            })
        };
    }

    try {
        console.log('🚀 Simple auth signup started');
        
        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
            console.log('📝 Request for email:', requestBody.email);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid request format'
                })
            };
        }

        const { firstName, lastName, email, phone, hostel, roomNumber, password } = requestBody;

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            console.error('❌ Missing required fields');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Please provide all required fields'
                })
            };
        }

        if (password.length < 6) {
            console.error('❌ Password too short');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                })
            };
        }

        // For now, create a mock user (no database required)
        console.log('🔧 Creating mock user...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create mock user object
        const mockUser = {
            id: 'user_' + Date.now(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            hostel: hostel?.trim() || '',
            roomNumber: roomNumber?.trim() || '',
            isActive: true,
            isAdmin: false,
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            createdAt: new Date().toISOString()
        };

        // Generate JWT token
        console.log('🔧 Generating token...');
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing-only';
        const token = jwt.sign({ userId: mockUser.id }, jwtSecret, { expiresIn: '7d' });
        console.log('✅ Token generated');

        console.log('✅ Mock signup successful for:', email);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Account created successfully',
                data: {
                    token,
                    user: mockUser
                }
            })
        };

    } catch (error) {
        console.error('❌ Simple signup error:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Server error during signup. Please try again.',
                error: error.message
            })
        };
    }
};