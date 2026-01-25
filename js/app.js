// Global App Configuration
const APP_CONFIG = {
    apiUrl: 'http://localhost:5000/api',
    currency: '₹'
};

// Use the clean cart manager from cart-manager-clean.js
// (cartManagerClean is already initialized in that file)

// Navigation Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
});

// 24x7 Cafe Official Menu Data (Updated from menu image + ₹1 increase)
const SAMPLE_MENU_ITEMS = [
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
        name: "Mushroom Hot Garlic Sauce",
        description: "Mushroom in hot garlic sauce",
        price: 151,
        category: "veg-manchurian-gravy",
        image: "images/mushroom-hot-garlic.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 91
    },
    {
        id: 8,
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
    {
        id: 9,
        name: "Chicken Manchurian Dry & Gravy",
        description: "Chicken manchurian in dry and gravy style",
        price: 151,
        category: "veg-manchurian-gravy",
        image: "images/chicken-manchurian.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 91
    },

    // ROLLS
    {
        id: 10,
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
        id: 11,
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
        id: 12,
        name: "Paneer Spring Roll",
        description: "Crispy paneer spring roll",
        price: 121,
        category: "rolls",
        image: "images/paneer-spring-roll.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 13,
        name: "Veg Roll",
        description: "Vegetable roll wrap",
        price: 41,
        category: "rolls",
        image: "images/veg-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 14,
        name: "Paneer Roll",
        description: "Paneer roll wrap",
        price: 71,
        category: "rolls",
        image: "images/paneer-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 15,
        name: "Chilly Paneer Roll",
        description: "Spicy paneer roll wrap",
        price: 71,
        category: "rolls",
        image: "images/chilly-paneer-roll.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 16,
        name: "Double Egg Roll",
        description: "Roll with double egg",
        price: 51,
        category: "rolls",
        image: "images/double-egg-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 17,
        name: "Chicken Roll",
        description: "Chicken roll wrap",
        price: 71,
        category: "rolls",
        image: "images/chicken-roll.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 18,
        name: "Double Egg Chicken",
        description: "Double egg with chicken",
        price: 91,
        category: "rolls",
        image: "images/double-egg-chicken.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 19,
        name: "Mushroom Roll",
        description: "Mushroom roll wrap",
        price: 51,
        category: "rolls",
        image: "images/mushroom-roll.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },

    // MOMOS
    {
        id: 20,
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
        id: 21,
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
        id: 22,
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
        id: 23,
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
        id: 24,
        name: "Veg Schwan Rice",
        description: "Vegetable schwan rice",
        price: 101,
        category: "rice",
        image: "images/veg-schwan-rice.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 71
    },
    {
        id: 25,
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
        id: 26,
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
    {
        id: 27,
        name: "Paneer Fried Rice",
        description: "Paneer fried rice",
        price: 121,
        category: "rice",
        image: "images/paneer-fried-rice.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 76
    },

    // EXTRA
    {
        id: 28,
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
        id: 29,
        name: "Honey Chilly Potato",
        description: "Sweet and spicy potato dish",
        price: 121,
        category: "extra",
        image: "images/honey-chilly-potato.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 76
    },
    {
        id: 30,
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
        id: 31,
        name: "Espresso Coffee",
        description: "Strong espresso coffee",
        price: 26,
        category: "extra",
        image: "images/espresso-coffee.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 32,
        name: "Masala Chai (Tea)",
        description: "Traditional spiced tea",
        price: 21,
        category: "extra",
        image: "images/masala-chai.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 33,
        name: "Chicken Curry",
        description: "Spicy chicken curry",
        price: 171,
        category: "extra",
        image: "images/chicken-curry.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 34,
        name: "Chicken Fry",
        description: "Fried chicken pieces",
        price: 101,
        category: "extra",
        image: "images/chicken-fry.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 35,
        name: "Egg Curry",
        description: "Spicy egg curry",
        price: 101,
        category: "extra",
        image: "images/egg-curry.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 36,
        name: "Chai (Tea)",
        description: "Regular tea",
        price: 11,
        category: "extra",
        image: "images/chai.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },

    // OM LET & MAGGI
    {
        id: 37,
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
        id: 38,
        name: "Bread Om Let (2H)",
        description: "Omelette with bread",
        price: 51,
        category: "omlet-maggi",
        image: "images/bread-omlet.jpg",
        available: true,
        popular: true,
        hasHalf: true,
        halfPrice: 31
    },
    {
        id: 39,
        name: "Egg Bhuj Ji (2H)",
        description: "Scrambled eggs",
        price: 46,
        category: "omlet-maggi",
        image: "images/egg-bhuj.jpg",
        available: true,
        popular: false,
        hasHalf: true,
        halfPrice: 31
    },
    {
        id: 40,
        name: "Boiled Egg",
        description: "Simple boiled egg",
        price: 11,
        category: "omlet-maggi",
        image: "images/boiled-egg.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 41,
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
        id: 42,
        name: "Masala Maggi",
        description: "Spiced maggi noodles",
        price: 41,
        category: "omlet-maggi",
        image: "images/masala-maggi.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 43,
        name: "Butter Maggi",
        description: "Maggi with butter",
        price: 46,
        category: "omlet-maggi",
        image: "images/butter-maggi.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 44,
        name: "Chicken Maggi",
        description: "Maggi with chicken",
        price: 61,
        category: "omlet-maggi",
        image: "images/chicken-maggi.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },

    // PARATHAS (With Pickle & Curds)
    {
        id: 45,
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
        id: 46,
        name: "Aloo Onion Paratha (1 pcs)",
        description: "Potato onion stuffed paratha with pickle & curds",
        price: 46,
        category: "parathas",
        image: "images/aloo-onion-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 47,
        name: "Gobi Paratha (1 pcs)",
        description: "Cauliflower stuffed paratha with pickle & curds",
        price: 41,
        category: "parathas",
        image: "images/gobi-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 48,
        name: "Onion Paratha (1 pcs)",
        description: "Onion stuffed paratha with pickle & curds",
        price: 41,
        category: "parathas",
        image: "images/onion-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 49,
        name: "Mix Paratha (1 pcs)",
        description: "Mixed vegetable stuffed paratha with pickle & curds",
        price: 46,
        category: "parathas",
        image: "images/mix-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 50,
        name: "Paneer Paratha (1 pcs)",
        description: "Paneer stuffed paratha with pickle & curds",
        price: 61,
        category: "parathas",
        image: "images/paneer-paratha.jpg",
        available: true,
        popular: true,
        hasHalf: false
    },
    {
        id: 51,
        name: "Egg Paratha (1 pcs)",
        description: "Egg stuffed paratha with pickle & curds",
        price: 61,
        category: "parathas",
        image: "images/egg-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },
    {
        id: 52,
        name: "Chicken Paratha (1 pcs)",
        description: "Chicken stuffed paratha with pickle & curds",
        price: 71,
        category: "parathas",
        image: "images/chicken-paratha.jpg",
        available: true,
        popular: false,
        hasHalf: false
    },

    // DRINKS & SNACKS
    {
        id: 53,
        name: "Water Bottles",
        description: "Packaged drinking water",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/water-bottle.jpg",
        available: true,
        popular: false,
        hasHalf: false,
        onMRP: true
    },
    {
        id: 54,
        name: "Cold Drinks",
        description: "Assorted cold beverages",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/cold-drinks.jpg",
        available: true,
        popular: true,
        hasHalf: false,
        onMRP: true
    },
    {
        id: 55,
        name: "Cold Coffee",
        description: "Refreshing cold coffee",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/cold-coffee.jpg",
        available: true,
        popular: true,
        hasHalf: false,
        onMRP: true
    },
    {
        id: 56,
        name: "Juice",
        description: "Fresh fruit juices",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/juice.jpg",
        available: true,
        popular: false,
        hasHalf: false,
        onMRP: true
    },
    {
        id: 57,
        name: "Snacks",
        description: "Assorted snacks",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/snacks.jpg",
        available: true,
        popular: false,
        hasHalf: false,
        onMRP: true
    },
    {
        id: 58,
        name: "Milk, Shakes & Lassi",
        description: "Milk-based beverages",
        price: 0, // On MRP
        category: "drinks-snacks",
        image: "images/milk-shakes.jpg",
        available: true,
        popular: false,
        hasHalf: false,
        onMRP: true
    }
];

// Quick add to cart function for home page
function quickAddToCart(itemId, itemName, fullPrice, halfPrice, hasHalf) {
    console.log('🛒 Quick add to cart:', { itemId, itemName, fullPrice, halfPrice, hasHalf });
    
    // Check if user is logged in
    if (!authManagerClean.isLoggedIn()) {
        alert('Please login first to add items to cart');
        window.location.href = 'login.html';
        return;
    }
    
    if (hasHalf && halfPrice > 0) {
        // Show modal for full/half selection
        showQuickAddModal(itemId, itemName, fullPrice, halfPrice);
    } else {
        // Direct add for items without half option
        addItemToCart(itemId, itemName, fullPrice, 1, '');
    }
}

// Add item to cart using the cart manager
async function addItemToCart(itemId, itemName, price, quantity, instructions) {
    try {
        console.log('🛒 Adding item to cart:', { itemId, itemName, price, quantity });
        
        await cartManagerClean.addItem({
            menuItemId: itemId,
            name: itemName,
            price: price,
            quantity: quantity,
            instructions: instructions
        });
        
        // Show success message
        showSuccess(`${itemName} added to cart!`);
        
    } catch (error) {
        console.error('❌ Failed to add item to cart:', error);
        showError('Failed to add item to cart. Please try again.');
    }
}

// Show quick add modal for full/half selection on home page
function showQuickAddModal(itemId, itemName, fullPrice, halfPrice) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal" id="quickAddModal" style="display: block;">
            <div class="modal-content" style="max-width: 400px;">
                <span class="close" onclick="closeQuickAddModal()">&times;</span>
                <div class="modal-header">
                    <h3>${itemName}</h3>
                    <p>Choose your portion size</p>
                </div>
                <div class="modal-body">
                    <div class="price-options">
                        <label class="price-option">
                            <input type="radio" name="quickPriceOption" value="full" data-price="${fullPrice}" checked>
                            <span>Full Plate - ₹${fullPrice}</span>
                        </label>
                        <label class="price-option">
                            <input type="radio" name="quickPriceOption" value="half" data-price="${halfPrice}">
                            <span>Half Plate - ₹${halfPrice}</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="add-to-cart-confirm" onclick="confirmQuickAdd('${itemId}', '${itemName}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Confirm quick add from home page
function confirmQuickAdd(itemId, itemName) {
    const selectedOption = document.querySelector('input[name="quickPriceOption"]:checked');
    
    if (selectedOption) {
        const price = parseInt(selectedOption.dataset.price);
        const isHalf = selectedOption.value === 'half';
        const sizeName = isHalf ? ' (Half)' : ' (Full)';
        
        addItemToCart(itemId, itemName + sizeName, price, 1, '');
    }
    
    closeQuickAddModal();
}

// Close quick add modal
function closeQuickAddModal() {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.remove();
    }
}

// Use the clean auth manager from auth-manager-clean.js
// (authManagerClean is already initialized in that file)

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update cart UI (use the clean cart manager)
    if (window.cartManagerClean) {
        cartManagerClean.updateCartUI();
    }
});

// Utility Functions
function formatCurrency(amount) {
    return `${APP_CONFIG.currency}${amount}`;
}

function showError(message) {
    alert(message); // In production, use a proper toast/notification system
}

function showSuccess(message) {
    alert(message); // In production, use a proper toast/notification system
}

// Export for use in other files (use clean managers)
window.cartManager = window.cartManagerClean;
window.authManager = window.authManagerClean;
window.SAMPLE_MENU_ITEMS = SAMPLE_MENU_ITEMS;
window.APP_CONFIG = APP_CONFIG;
window.quickAddToCart = quickAddToCart;
window.showQuickAddModal = showQuickAddModal;
window.confirmQuickAdd = confirmQuickAdd;
window.closeQuickAddModal = closeQuickAddModal;