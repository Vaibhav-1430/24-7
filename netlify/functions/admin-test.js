const mongoose = require('mongoose');

// Simple test function to check admin functionality
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Check if we can connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';
        
        console.log('Testing MongoDB connection...');
        const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });

        console.log('MongoDB connected successfully');

        // Check auth token
        const authHeader = event.headers.authorization;
        const hasAuthHeader = !!authHeader;
        const token = authHeader ? authHeader.substring(7) : null;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Admin test endpoint working',
                data: {
                    mongodbConnected: true,
                    hasAuthHeader: hasAuthHeader,
                    tokenLength: token ? token.length : 0,
                    timestamp: new Date().toISOString()
                }
            })
        };

    } catch (error) {
        console.error('Admin test error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Test failed',
                details: error.message,
                mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
            })
        };
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
};