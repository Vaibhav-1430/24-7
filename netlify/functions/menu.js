const { connectDB } = require('./utils/db');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');
const MenuItem = require('./models/MenuItem');

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

    if (event.httpMethod !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        // Validate environment variables first
        const envError = validateEnvironmentForFunction();
        if (envError) {
            return envError;
        }

        await connectDB();

        const { category, available, popular } = event.queryStringParameters || {};
        
        let query = {};
        
        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Filter by availability
        if (available !== undefined) {
            query.available = available === 'true';
        }
        
        // Filter by popular
        if (popular !== undefined) {
            query.popular = popular === 'true';
        }

        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

        return successResponse(menuItems, `Found ${menuItems.length} menu items`);

    } catch (error) {
        console.error('Get menu items error:', error);
        return errorResponse('Server error while fetching menu items', 500, error.message);
    }
};