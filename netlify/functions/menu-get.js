const { connectDB } = require('./utils/db');
const { successResponse, errorResponse } = require('./utils/response');
const { validateEnvironmentForFunction } = require('./utils/environment');

// Sample menu items for initial deployment
const SAMPLE_MENU_ITEMS = [
    {
        id: 1,
        name: "Masala Dosa",
        description: "Crispy rice crepe filled with spiced potato curry, served with coconut chutney and sambar",
        price: 80,
        category: "South Indian",
        image: "images/masala-dosa.jpg",
        available: true,
        popular: true
    },
    {
        id: 2,
        name: "Chicken Biryani",
        description: "Fragrant basmati rice cooked with tender chicken pieces and aromatic spices",
        price: 180,
        category: "Rice",
        image: "images/chicken-biryani.jpg",
        available: true,
        popular: true
    },
    {
        id: 3,
        name: "Paneer Butter Masala",
        description: "Soft paneer cubes in rich tomato-based creamy gravy, served with rice or roti",
        price: 140,
        category: "North Indian",
        image: "images/paneer-butter-masala.jpg",
        available: true,
        popular: false
    },
    {
        id: 4,
        name: "Veg Fried Rice",
        description: "Wok-tossed rice with fresh vegetables and Indo-Chinese flavors",
        price: 90,
        category: "Chinese",
        image: "images/veg-fried-rice.jpg",
        available: true,
        popular: false
    },
    {
        id: 5,
        name: "Chicken Tikka",
        description: "Marinated chicken pieces grilled to perfection with Indian spices",
        price: 160,
        category: "Starters",
        image: "images/chicken-tikka.jpg",
        available: true,
        popular: true
    },
    {
        id: 6,
        name: "Masala Chai",
        description: "Traditional Indian spiced tea brewed with milk and aromatic spices",
        price: 25,
        category: "Beverages",
        image: "images/masala-chai.jpg",
        available: true,
        popular: true
    },
    {
        id: 7,
        name: "Samosa (2 pcs)",
        description: "Crispy triangular pastries filled with spiced potatoes and peas",
        price: 40,
        category: "Snacks",
        image: "images/samosa.jpg",
        available: true,
        popular: false
    },
    {
        id: 8,
        name: "Dal Tadka",
        description: "Yellow lentils tempered with cumin, garlic, and spices",
        price: 70,
        category: "Dal",
        image: "images/dal-tadka.jpg",
        available: true,
        popular: false
    }
];

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

        // For now, return sample menu items
        // In production, this would fetch from database
        const queryParams = event.queryStringParameters || {};
        const category = queryParams.category;
        
        let menuItems = SAMPLE_MENU_ITEMS;
        
        // Filter by category if specified
        if (category && category !== 'all') {
            menuItems = menuItems.filter(item => 
                item.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        // Filter only available items for customers
        menuItems = menuItems.filter(item => item.available);
        
        return successResponse(menuItems, 'Menu items retrieved successfully');

    } catch (error) {
        console.error('Menu fetch error:', error);
        return errorResponse('Server error while fetching menu items', 500, error.message);
    }
};