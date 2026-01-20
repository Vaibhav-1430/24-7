const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// Middleware to verify JWT token for Netlify Functions
const verifyToken = (event) => {
    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        
        if (!authHeader) {
            return { error: 'No token provided', status: 401 };
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        return { userId: decoded.userId };
    } catch (error) {
        return { error: 'Invalid token', status: 401 };
    }
};

module.exports = { generateToken, verifyToken };