// Simple local setup without MongoDB Atlas
// This creates a local JSON database that works immediately

const fs = require('fs');
const path = require('path');

// Your menu data
const menuItems = [
    // NOODLES
    {
        id: 1,
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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
        id: 6,
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
        id: 7,
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
        id: 8,
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
        id: 9,
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
        id: 10,
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
        id: 11,
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
        id: 12,
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
        id: 13,
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
        id: 14,
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
        id: 15,
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
        id: 16,
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
        id: 17,
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
        id: 18,
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
        id: 19,
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
        id: 20,
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
        id: 21,
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
        id: 22,
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
        id: 23,
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
        id: 24,
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

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create database files
const databases = {
    menu: menuItems,
    users: [],
    carts: [],
    orders: []
};

// Write database files
Object.keys(databases).forEach(dbName => {
    const filePath = path.join(dataDir, `${dbName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(databases[dbName], null, 2));
    console.log(`✅ Created ${dbName}.json with ${databases[dbName].length} items`);
});

console.log('🎉 Local database setup completed!');
console.log('📁 Database files created in backend/data/ folder');
console.log('🚀 You can now start the server with: npm start');