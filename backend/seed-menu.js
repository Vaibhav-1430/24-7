const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

// Your existing menu data
const menuItems = [
    // NOODLES
    {
        name: "Veg Noodles",
        description: "Delicious vegetable noodles",
        price: 101,
        category: "noodles",
        image: "images/veg-noodles.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 66
    },
    {
        name: "Paneer Noodles",
        description: "Noodles with paneer chunks",
        price: 111,
        category: "noodles",
        image: "images/paneer-noodles.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 76
    },
    {
        name: "Chicken Noodles",
        description: "Noodles with chicken pieces",
        price: 131,
        category: "noodles",
        image: "images/chicken-noodles.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 76
    },
    {
        name: "Egg Chilly Garlic Noodles",
        description: "Spicy egg noodles with garlic",
        price: 121,
        category: "noodles",
        image: "images/egg-chilly-garlic-noodles.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 76
    },

    // VEG MANCHURIAN & GRAVY
    {
        name: "Veg Manchurian Dry and Gravy",
        description: "Vegetable manchurian in dry and gravy style",
        price: 121,
        category: "veg-manchurian-gravy",
        image: "images/veg-manchurian.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 71
    },
    {
        name: "Mushroom Chilly Dry and Gravy",
        description: "Spicy mushroom in dry and gravy style",
        price: 131,
        category: "veg-manchurian-gravy",
        image: "images/mushroom-chilly.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 81
    },
    {
        name: "Chilly Paneer",
        description: "Spicy paneer with bell peppers",
        price: 161,
        category: "veg-manchurian-gravy",
        image: "images/chilly-paneer.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 96
    },

    // ROLLS
    {
        name: "Veg Spring Roll",
        description: "Crispy vegetable spring roll",
        price: 81,
        category: "rolls",
        image: "images/veg-spring-roll.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        name: "Chicken Spring Roll",
        description: "Crispy chicken spring roll",
        price: 151,
        category: "rolls",
        image: "images/chicken-spring-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        name: "Paneer Roll",
        description: "Paneer roll wrap",
        price: 71,
        category: "rolls",
        image: "images/paneer-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },

    // MOMOS
    {
        name: "Paneer Momos (Fried)",
        description: "Fried paneer momos",
        price: 61,
        category: "momos",
        image: "images/paneer-momos.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 41
    },
    {
        name: "Veg Momos (Fried)",
        description: "Fried vegetable momos",
        price: 41,
        category: "momos",
        image: "images/veg-momos.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 31
    },
    {
        name: "Chicken Momos (Fried)",
        description: "Fried chicken momos",
        price: 61,
        category: "momos",
        image: "images/chicken-momos.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 41
    },

    // RICE
    {
        name: "Veg Fried Rice",
        description: "Vegetable fried rice",
        price: 91,
        category: "rice",
        image: "images/veg-fried-rice.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 61
    },
    {
        name: "Egg Fried Rice",
        description: "Egg fried rice",
        price: 121,
        category: "rice",
        image: "images/egg-fried-rice.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 76
    },
    {
        name: "Chicken Fried Rice",
        description: "Chicken fried rice",
        price: 141,
        category: "rice",
        image: "images/chicken-fried-rice.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 86
    },

    // EXTRA
    {
        name: "Chilly Potato",
        description: "Spicy potato dish",
        price: 101,
        category: "extra",
        image: "images/chilly-potato.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 66
    },
    {
        name: "French Fry",
        description: "Crispy french fries",
        price: 71,
        category: "extra",
        image: "images/french-fry.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        name: "Masala Chai (Tea)",
        description: "Traditional spiced tea",
        price: 21,
        category: "extra",
        image: "images/masala-chai.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },

    // OM LET & MAGGI
    {
        name: "Plain Om Let (2H)",
        description: "Plain omelette with 2 eggs",
        price: 41,
        category: "omlet-maggi",
        image: "images/plain-omlet.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 21
    },
    {
        name: "Plain Maggi",
        description: "Simple maggi noodles",
        price: 36,
        category: "omlet-maggi",
        image: "images/plain-maggi.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        name: "Masala Maggi",
        description: "Spiced maggi noodles",
        price: 41,
        category: "omlet-maggi",
        image: "images/masala-maggi.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },

    // PARATHAS
    {
        name: "Aloo Paratha (1 pcs)",
        description: "Potato stuffed paratha with pickle & curds",
        price: 36,
        category: "parathas",
        image: "images/aloo-paratha.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        name: "Paneer Paratha (1 pcs)",
        description: "Paneer stuffed paratha with pickle & curds",
        price: 61,
        category: "parathas",
        image: "images/paneer-paratha.jpg",
        available: true,
        popular: true,
        hasHalf: false
    }
];

async function seedMenu() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing menu items
        await MenuItem.deleteMany({});
        console.log('🗑️ Cleared existing menu items');

        // Insert new menu items
        await MenuItem.insertMany(menuItems);
        console.log(`✅ Inserted ${menuItems.length} menu items`);

        console.log('🎉 Menu seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding menu:', error);
        process.exit(1);
    }
}

seedMenu();