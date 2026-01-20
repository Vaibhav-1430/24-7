const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Middleware to verify JWT token for Netlify Functions
const verifyToken = (event) => {
    try {
        if (!process.env.JWT_SECRET) {
            return { error: 'Server configuration error', status: 500 };
        }

        const authHeader = event.headers.authorization || event.headers.Authorization;
        
        if (!authHeader) {
            return { error: 'No token provided', status: 401 };
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        return { userId: decoded.userId };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { error: 'Token expired', status: 401 };
        }
        return { error: 'Invalid token', status: 401 };
    }
};

module.exports = { generateToken, verifyToken };