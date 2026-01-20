const { connectDB } = require('./utils/db');
const { successResponse, errorResponse } = require('./utils/response');
const MenuItem = require('./models/MenuItem');

const SAMPLE_MENU_ITEMS = [
    // Noodles
    { name: "Chicken Noodles", description: "Delicious chicken noodles with vegetables", price: 121, category: "noodles", hasHalf: true, halfPrice: 81 },
    { name: "Egg Noodles", description: "Tasty egg noodles with spices", price: 101, category: "noodles", hasHalf: true, halfPrice: 71 },
    { name: "Veg Noodles", description: "Fresh vegetable noodles", price: 91, category: "noodles", hasHalf: true, halfPrice: 61 },
    { name: "Chicken Schezwan Noodles", description: "Spicy chicken schezwan noodles", price: 131, category: "noodles", hasHalf: true, halfPrice: 91 },
    { name: "Egg Schezwan Noodles", description: "Spicy egg schezwan noodles", price: 111, category: "noodles", hasHalf: true, halfPrice: 81 },
    { name: "Veg Schezwan Noodles", description: "Spicy vegetable schezwan noodles", price: 101, category: "noodles", hasHalf: true, halfPrice: 71 },

    // Veg Manchurian & Gravy
    { name: "Veg Manchurian Dry", description: "Crispy veg manchurian", price: 101, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 71 },
    { name: "Veg Manchurian Gravy", description: "Veg manchurian in gravy", price: 111, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 81 },
    { name: "Gobi Manchurian Dry", description: "Crispy cauliflower manchurian", price: 111, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 81 },
    { name: "Gobi Manchurian Gravy", description: "Cauliflower manchurian in gravy", price: 121, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 91 },
    { name: "Paneer Chilli Dry", description: "Spicy paneer chilli", price: 141, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 101 },
    { name: "Paneer Chilli Gravy", description: "Paneer chilli in gravy", price: 151, category: "veg-manchurian-gravy", hasHalf: true, halfPrice: 111 },

    // Rolls
    { name: "Chicken Roll", description: "Delicious chicken roll", price: 81, category: "rolls" },
    { name: "Egg Roll", description: "Tasty egg roll", price: 61, category: "rolls" },
    { name: "Veg Roll", description: "Fresh vegetable roll", price: 51, category: "rolls" },
    { name: "Paneer Roll", description: "Paneer roll with spices", price: 71, category: "rolls" },
    { name: "Chicken Schezwan Roll", description: "Spicy chicken schezwan roll", price: 91, category: "rolls" },
    { name: "Egg Schezwan Roll", description: "Spicy egg schezwan roll", price: 71, category: "rolls" },

    // Momos
    { name: "Veg Momos (8 pcs)", description: "Steamed vegetable momos", price: 81, category: "momos" },
    { name: "Chicken Momos (8 pcs)", description: "Steamed chicken momos", price: 101, category: "momos" },
    { name: "Paneer Momos (8 pcs)", description: "Steamed paneer momos", price: 91, category: "momos" },
    { name: "Veg Fried Momos (8 pcs)", description: "Fried vegetable momos", price: 91, category: "momos" },
    { name: "Chicken Fried Momos (8 pcs)", description: "Fried chicken momos", price: 111, category: "momos" },
    { name: "Paneer Fried Momos (8 pcs)", description: "Fried paneer momos", price: 101, category: "momos" },

    // Rice
    { name: "Chicken Fried Rice", description: "Delicious chicken fried rice", price: 141, category: "rice", hasHalf: true, halfPrice: 101 },
    { name: "Egg Fried Rice", description: "Tasty egg fried rice", price: 121, category: "rice", hasHalf: true, halfPrice: 91 },
    { name: "Veg Fried Rice", description: "Fresh vegetable fried rice", price: 111, category: "rice", hasHalf: true, halfPrice: 81 },
    { name: "Chicken Schezwan Rice", description: "Spicy chicken schezwan rice", price: 151, category: "rice", hasHalf: true, halfPrice: 111 },
    { name: "Egg Schezwan Rice", description: "Spicy egg schezwan rice", price: 131, category: "rice", hasHalf: true, halfPrice: 101 },
    { name: "Veg Schezwan Rice", description: "Spicy vegetable schezwan rice", price: 121, category: "rice", hasHalf: true, halfPrice: 91 },

    // Extra
    { name: "Extra Egg", description: "Additional egg", price: 21, category: "extra" },
    { name: "Extra Chicken", description: "Additional chicken", price: 31, category: "extra" },
    { name: "Extra Paneer", description: "Additional paneer", price: 31, category: "extra" },
    { name: "Extra Vegetables", description: "Additional vegetables", price: 21, category: "extra" },

    // Om Let & Maggi
    { name: "Plain Omelette", description: "Simple plain omelette", price: 41, category: "omlet-maggi" },
    { name: "Masala Omelette", description: "Spicy masala omelette", price: 51, category: "omlet-maggi" },
    { name: "Cheese Omelette", description: "Omelette with cheese", price: 61, category: "omlet-maggi" },
    { name: "Plain Maggi", description: "Simple maggi noodles", price: 41, category: "omlet-maggi" },
    { name: "Masala Maggi", description: "Spicy masala maggi", price: 51, category: "omlet-maggi" },
    { name: "Cheese Maggi", description: "Maggi with cheese", price: 61, category: "omlet-maggi" },

    // Parathas
    { name: "Plain Paratha", description: "Simple plain paratha", price: 31, category: "parathas" },
    { name: "Aloo Paratha", description: "Potato stuffed paratha", price: 51, category: "parathas" },
    { name: "Paneer Paratha", description: "Paneer stuffed paratha", price: 71, category: "parathas" },
    { name: "Gobi Paratha", description: "Cauliflower stuffed paratha", price: 61, category: "parathas" },
    { name: "Mix Veg Paratha", description: "Mixed vegetable paratha", price: 61, category: "parathas" },

    // Drinks & Snacks
    { name: "Tea", description: "Hot tea", price: 11, category: "drinks-snacks" },
    { name: "Coffee", description: "Hot coffee", price: 21, category: "drinks-snacks" },
    { name: "Cold Drink", description: "Chilled soft drink", price: 31, category: "drinks-snacks" },
    { name: "Fresh Lime Water", description: "Fresh lime water", price: 21, category: "drinks-snacks" },
    { name: "Lassi", description: "Sweet or salty lassi", price: 41, category: "drinks-snacks" },
    { name: "Samosa (2 pcs)", description: "Crispy samosas", price: 31, category: "drinks-snacks" },
    { name: "Pakora", description: "Mixed vegetable pakoras", price: 51, category: "drinks-snacks" },
    { name: "Bread Pakora", description: "Bread pakora with chutney", price: 41, category: "drinks-snacks" },
    { name: "Sandwich", description: "Vegetable sandwich", price: 51, category: "drinks-snacks" },
    { name: "Grilled Sandwich", description: "Grilled vegetable sandwich", price: 61, category: "drinks-snacks" }
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

    if (event.httpMethod !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        await connectDB();

        // Clear existing menu items
        await MenuItem.deleteMany({});

        // Insert new menu items
        const insertedItems = await MenuItem.insertMany(SAMPLE_MENU_ITEMS);

        return successResponse({
            count: insertedItems.length,
            items: insertedItems
        }, `Successfully seeded ${insertedItems.length} menu items`);

    } catch (error) {
        console.error('Seed menu error:', error);
        return errorResponse('Server error while seeding menu', 500, error.message);
    }
};