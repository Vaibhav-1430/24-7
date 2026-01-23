const mongoose = require('mongoose');

// Self-contained MenuItem Schema
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    fullPrice: { type: Number, required: true, min: 0 },
    halfPrice: { type: Number, min: 0 },
    image: { type: String, default: 'images/default-food.jpg' },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    isVeg: { type: Boolean, default: true },
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Spicy'], default: 'Medium' }
}, { timestamps: true });

// Global connection cache
let cachedConnection = null;
let MenuItem = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cafe24x7:cafe24x7password@cluster0.4kxqj.mongodb.net/cafe24x7?retryWrites=true&w=majority';
        
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });

        // Create MenuItem model if it doesn't exist
        if (!MenuItem) {
            try {
                MenuItem = mongoose.model('MenuItem');
            } catch {
                MenuItem = mongoose.model('MenuItem', menuItemSchema);
            }
        }

        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

// Complete menu data from the image (prices increased by ₹1)
const COMPLETE_MENU = [
    // NOODLES
    {
        name: "Veg Noodles",
        description: "Delicious vegetable noodles with fresh vegetables and aromatic spices",
        category: "Noodles",
        fullPrice: 101,
        halfPrice: 66,
        isVeg: true,
        popular: true
    },
    {
        name: "Paneer Noodles",
        description: "Noodles with soft paneer cubes and mixed vegetables",
        category: "Noodles",
        fullPrice: 111,
        halfPrice: 76,
        isVeg: true
    },
    {
        name: "Chicken Noodles",
        description: "Spicy chicken noodles with tender chicken pieces",
        category: "Noodles",
        fullPrice: 131,
        halfPrice: 76,
        isVeg: false,
        popular: true
    },
    {
        name: "Egg Chilly Garlic Noodles",
        description: "Egg noodles with chilly garlic sauce and scrambled eggs",
        category: "Noodles",
        fullPrice: 121,
        halfPrice: 76,
        isVeg: false
    },

    // VEG MANCHURIAN & GRAVY
    {
        name: "Veg Manchurian Dry and Gravy",
        description: "Crispy vegetable balls in manchurian sauce",
        category: "Manchurian & Gravy",
        fullPrice: 121,
        halfPrice: 71,
        isVeg: true
    },
    {
        name: "Mushroom Chilly Dry and Gravy",
        description: "Fresh mushrooms in spicy chilly sauce",
        category: "Manchurian & Gravy",
        fullPrice: 131,
        halfPrice: 81,
        isVeg: true
    },
    {
        name: "Mushroom Hot Garlic Sauce",
        description: "Mushrooms tossed in hot garlic sauce",
        category: "Manchurian & Gravy",
        fullPrice: 151,
        halfPrice: 91,
        isVeg: true
    },
    {
        name: "Chilly Paneer",
        description: "Soft paneer cubes in spicy chilly sauce",
        category: "Manchurian & Gravy",
        fullPrice: 161,
        halfPrice: 96,
        isVeg: true,
        popular: true
    },
    {
        name: "Chicken Manchurian Dry & Gravy",
        description: "Chicken balls in manchurian sauce",
        category: "Manchurian & Gravy",
        fullPrice: 151,
        halfPrice: 91,
        isVeg: false
    },

    // MOMOS
    {
        name: "Paneer Momos (Fried)",
        description: "Crispy fried momos stuffed with spiced paneer",
        category: "Momos",
        fullPrice: 61,
        halfPrice: 41,
        isVeg: true,
        popular: true
    },
    {
        name: "Veg Momos (Fried)",
        description: "Crispy fried vegetable momos with mixed vegetables",
        category: "Momos",
        fullPrice: 41,
        halfPrice: 31,
        isVeg: true
    },
    {
        name: "Chicken Momos (Fried)",
        description: "Crispy fried momos stuffed with spiced chicken",
        category: "Momos",
        fullPrice: 61,
        halfPrice: 41,
        isVeg: false,
        popular: true
    },

    // RICE
    {
        name: "Veg Fried Rice",
        description: "Aromatic fried rice with mixed vegetables",
        category: "Rice",
        fullPrice: 91,
        halfPrice: 61,
        isVeg: true
    },
    {
        name: "Veg Schezwan Rice",
        description: "Spicy schezwan fried rice with vegetables",
        category: "Rice",
        fullPrice: 101,
        halfPrice: 71,
        isVeg: true,
        spiceLevel: "Spicy"
    },
    {
        name: "Egg Fried Rice",
        description: "Fried rice with scrambled eggs and vegetables",
        category: "Rice",
        fullPrice: 121,
        halfPrice: 76,
        isVeg: false
    },
    {
        name: "Chicken Fried Rice",
        description: "Delicious fried rice with tender chicken pieces",
        category: "Rice",
        fullPrice: 141,
        halfPrice: 86,
        isVeg: false,
        popular: true
    },
    {
        name: "Paneer Fried Rice",
        description: "Fried rice with soft paneer cubes",
        category: "Rice",
        fullPrice: 121,
        halfPrice: 76,
        isVeg: true
    },

    // ROLLS
    {
        name: "Veg Spring Roll",
        description: "Crispy spring rolls filled with fresh vegetables",
        category: "Rolls",
        fullPrice: 81,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Chicken Spring Roll",
        description: "Crispy spring rolls with spiced chicken filling",
        category: "Rolls",
        fullPrice: 151,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Paneer Spring Roll",
        description: "Spring rolls stuffed with paneer and vegetables",
        category: "Rolls",
        fullPrice: 121,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Veg Roll",
        description: "Soft roll with spiced vegetable filling",
        category: "Rolls",
        fullPrice: 41,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Paneer Roll",
        description: "Roll filled with marinated paneer",
        category: "Rolls",
        fullPrice: 71,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Chilly Paneer Roll",
        description: "Roll with spicy chilly paneer filling",
        category: "Rolls",
        fullPrice: 71,
        halfPrice: null,
        isVeg: true,
        spiceLevel: "Spicy"
    },
    {
        name: "Double Egg Roll",
        description: "Roll with double egg omelet and vegetables",
        category: "Rolls",
        fullPrice: 51,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Chicken Roll",
        description: "Roll with spiced chicken and onions",
        category: "Rolls",
        fullPrice: 71,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Double Egg Chicken",
        description: "Roll with chicken and double egg",
        category: "Rolls",
        fullPrice: 91,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Mushroom Roll",
        description: "Roll filled with spiced mushrooms",
        category: "Rolls",
        fullPrice: 51,
        halfPrice: null,
        isVeg: true
    },

    // OMLET & MAGGI
    {
        name: "Plain Omlet (2H)",
        description: "Simple plain omelet made with 2 eggs",
        category: "Omlet & Maggi",
        fullPrice: 41,
        halfPrice: 21,
        isVeg: false
    },
    {
        name: "Bread Omlet (2H)",
        description: "Omelet served with bread slices",
        category: "Omlet & Maggi",
        fullPrice: 51,
        halfPrice: 31,
        isVeg: false
    },
    {
        name: "Egg Bhurji (2H)",
        description: "Spiced scrambled eggs with onions and tomatoes",
        category: "Omlet & Maggi",
        fullPrice: 46,
        halfPrice: 31,
        isVeg: false
    },
    {
        name: "Boiled Egg",
        description: "Simple boiled eggs",
        category: "Omlet & Maggi",
        fullPrice: null,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Plain Maggi",
        description: "Classic plain maggi noodles",
        category: "Omlet & Maggi",
        fullPrice: 36,
        halfPrice: null,
        isVeg: true,
        popular: true
    },
    {
        name: "Masala Maggi",
        description: "Spiced maggi with vegetables and masala",
        category: "Omlet & Maggi",
        fullPrice: 41,
        halfPrice: null,
        isVeg: true,
        popular: true
    },
    {
        name: "Butter Maggi",
        description: "Creamy butter maggi noodles",
        category: "Omlet & Maggi",
        fullPrice: 46,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Chicken Maggi",
        description: "Maggi noodles with chicken pieces",
        category: "Omlet & Maggi",
        fullPrice: 61,
        halfPrice: null,
        isVeg: false
    },

    // PARATHAS
    {
        name: "Aloo Paratha (1pcs)",
        description: "Stuffed paratha with spiced potato filling",
        category: "Parathas",
        fullPrice: 36,
        halfPrice: null,
        isVeg: true,
        popular: true
    },
    {
        name: "Aloo Onion Paratha (1pcs)",
        description: "Paratha stuffed with potato and onion",
        category: "Parathas",
        fullPrice: 46,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Gobi Paratha (1pcs)",
        description: "Paratha stuffed with spiced cauliflower",
        category: "Parathas",
        fullPrice: 41,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Onion Paratha (1pcs)",
        description: "Paratha with onion filling",
        category: "Parathas",
        fullPrice: 41,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Mix Paratha (1pcs)",
        description: "Paratha with mixed vegetable filling",
        category: "Parathas",
        fullPrice: 46,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Paneer Paratha (1pcs)",
        description: "Paratha stuffed with spiced paneer",
        category: "Parathas",
        fullPrice: 61,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Egg Paratha (1pcs)",
        description: "Paratha with egg filling",
        category: "Parathas",
        fullPrice: 61,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Chicken Paratha (1pcs)",
        description: "Paratha stuffed with spiced chicken",
        category: "Parathas",
        fullPrice: 71,
        halfPrice: null,
        isVeg: false
    },

    // EXTRA
    {
        name: "Chilly Potato",
        description: "Crispy potato fingers in spicy chilly sauce",
        category: "Extra",
        fullPrice: 101,
        halfPrice: 66,
        isVeg: true,
        spiceLevel: "Spicy"
    },
    {
        name: "Honey Chilly Potato",
        description: "Sweet and spicy honey chilly potato",
        category: "Extra",
        fullPrice: 121,
        halfPrice: 76,
        isVeg: true,
        spiceLevel: "Medium"
    },
    {
        name: "French Fry",
        description: "Crispy golden french fries",
        category: "Extra",
        fullPrice: 71,
        halfPrice: null,
        isVeg: true,
        popular: true
    },
    {
        name: "Espresso Coffee",
        description: "Strong espresso coffee",
        category: "Extra",
        fullPrice: 26,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Masala Chai (Tea)",
        description: "Traditional Indian spiced tea",
        category: "Extra",
        fullPrice: 21,
        halfPrice: null,
        isVeg: true,
        popular: true
    },
    {
        name: "Chicken Curry",
        description: "Spicy chicken curry with gravy",
        category: "Extra",
        fullPrice: 171,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Chicken Fry",
        description: "Crispy fried chicken pieces",
        category: "Extra",
        fullPrice: 101,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Egg Curry",
        description: "Boiled eggs in spicy curry",
        category: "Extra",
        fullPrice: 101,
        halfPrice: null,
        isVeg: false
    },
    {
        name: "Chai (Tea)",
        description: "Regular milk tea",
        category: "Extra",
        fullPrice: 16,
        halfPrice: null,
        isVeg: true
    },

    // DRINKS & SNACKS
    {
        name: "Water Bottles",
        description: "Packaged drinking water",
        category: "Drinks & Snacks",
        fullPrice: 20,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Cold Drinks",
        description: "Assorted cold beverages",
        category: "Drinks & Snacks",
        fullPrice: 25,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Cold Coffee",
        description: "Refreshing iced coffee",
        category: "Drinks & Snacks",
        fullPrice: 35,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Juice",
        description: "Fresh fruit juices",
        category: "Drinks & Snacks",
        fullPrice: 30,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Snacks",
        description: "Assorted snacks and namkeen",
        category: "Drinks & Snacks",
        fullPrice: 15,
        halfPrice: null,
        isVeg: true
    },
    {
        name: "Milk Shakes & Lassi",
        description: "Creamy milkshakes and traditional lassi",
        category: "Drinks & Snacks",
        fullPrice: 40,
        halfPrice: null,
        isVeg: true
    }
];

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        console.log('🍽️ Loading menu items...');
        
        const queryParams = event.queryStringParameters || {};
        const category = queryParams.category;
        
        // Connect to database and seed menu if needed
        await connectDB();
        
        // Check if menu items exist in database
        const existingItems = await MenuItem.countDocuments();
        
        if (existingItems === 0) {
            console.log('📝 Seeding menu items to database...');
            await MenuItem.insertMany(COMPLETE_MENU);
            console.log('✅ Menu items seeded successfully');
        }
        
        // Build query
        let query = { available: true };
        if (category && category !== 'all') {
            query.category = new RegExp(category, 'i');
        }
        
        // Get menu items from database
        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
        
        // Transform for frontend
        const transformedItems = menuItems.map(item => ({
            id: item._id,
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.fullPrice,
            halfPrice: item.halfPrice,
            image: item.image,
            available: item.available,
            popular: item.popular,
            isVeg: item.isVeg,
            spiceLevel: item.spiceLevel
        }));

        console.log(`✅ Loaded ${transformedItems.length} menu items`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Menu items retrieved successfully',
                data: transformedItems
            })
        };

    } catch (error) {
        console.error('❌ Menu error:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error while fetching menu items',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};