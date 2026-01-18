// Global App Configuration
const APP_CONFIG = {
    apiUrl: 'https://your-firebase-project.firebaseio.com',
    currency: '₹'
};

// Firebase Cart Management
class FirebaseCartManager {
    constructor() {
        this.cart = [];
        this.initCartListener();
    }

    initCartListener() {
        // Wait for Firebase to be loaded
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.initCartListener(), 100);
            return;
        }

        // Listen for auth state changes to load user's cart
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                // Load user's cart from Firestore
                await this.loadUserCart(user.uid);
                
                // Listen for real-time cart updates
                this.cartListener = firebaseDB.collection('carts').doc(user.uid)
                    .onSnapshot((doc) => {
                        if (doc.exists) {
                            const cartData = doc.data();
                            this.cart = cartData.items || [];
                            this.updateCartUI();
                        }
                    });
            } else {
                // User logged out, clear cart
                this.cart = [];
                this.updateCartUI();
                
                // Unsubscribe from cart listener
                if (this.cartListener) {
                    this.cartListener();
                    this.cartListener = null;
                }
            }
        });
    }

    async loadUserCart(userId) {
        try {
            const cartDoc = await firebaseDB.collection('carts').doc(userId).get();
            if (cartDoc.exists) {
                this.cart = cartDoc.data().items || [];
            } else {
                this.cart = [];
            }
            this.updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    async saveCart() {
        if (!firebaseAuth.currentUser) {
            console.log('No user logged in, cannot save cart');
            return;
        }

        try {
            await firebaseDB.collection('carts').doc(firebaseAuth.currentUser.uid).set({
                items: this.cart,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Cart saved to Firebase');
        } catch (error) {
            console.error('❌ Error saving cart:', error);
        }
    }

    async addItem(item) {
        const existingItem = this.cart.find(cartItem => 
            cartItem.id === item.id && 
            cartItem.instructions === item.instructions &&
            cartItem.name === item.name // Include name to handle full/half variations
        );

        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.cart.push({
                ...item,
                addedAt: new Date().toISOString()
            });
        }

        await this.saveCart();
        this.showAddToCartNotification(item);
    }

    async removeItem(itemId, instructions = '', itemName = '') {
        this.cart = this.cart.filter(item => 
            !(item.id === itemId && 
              item.instructions === instructions &&
              (itemName === '' || item.name === itemName))
        );
        await this.saveCart();
    }

    async updateQuantity(itemId, instructions, newQuantity, itemName = '') {
        const item = this.cart.find(cartItem => 
            cartItem.id === itemId && 
            cartItem.instructions === instructions &&
            (itemName === '' || cartItem.name === itemName)
        );
        
        if (item) {
            if (newQuantity <= 0) {
                await this.removeItem(itemId, instructions, itemName);
            } else {
                item.quantity = newQuantity;
                await this.saveCart();
            }
        }
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    async clearCart() {
        this.cart = [];
        await this.saveCart();
    }

    updateCartUI() {
        const cartCounts = document.querySelectorAll('.cart-count');
        const itemCount = this.getItemCount();
        
        cartCounts.forEach(element => {
            element.textContent = itemCount;
            element.style.display = itemCount > 0 ? 'block' : 'none';
        });

        // Update cart summary if on menu page
        const cartSummary = document.getElementById('cartSummary');
        if (cartSummary) {
            if (itemCount > 0) {
                cartSummary.style.display = 'block';
                const itemsCountEl = cartSummary.querySelector('.cart-items-count');
                const totalEl = cartSummary.querySelector('.cart-total');
                
                if (itemsCountEl) itemsCountEl.textContent = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
                if (totalEl) totalEl.textContent = `${APP_CONFIG.currency}${this.getTotal()}`;
            } else {
                cartSummary.style.display = 'none';
            }
        }
    }

    showAddToCartNotification(item) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${item.name} added to cart!</span>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: '#27ae60',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            zIndex: '2000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards'
        });

        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize Firebase cart manager
const cartManager = new FirebaseCartManager();

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

// Load popular items on home page
function loadPopularItems() {
    const popularItemsContainer = document.getElementById('popularItems');
    if (!popularItemsContainer) return;

    const popularItems = SAMPLE_MENU_ITEMS.filter(item => item.popular && item.available && !item.onMRP);
    
    popularItemsContainer.innerHTML = popularItems.map(item => `
        <div class="item-card">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-price">
                    ${item.hasHalf ? 
                        `Full: ${APP_CONFIG.currency}${item.price} | Half: ${APP_CONFIG.currency}${item.halfPrice}` : 
                        `${APP_CONFIG.currency}${item.price}`
                    }
                </div>
                <button class="add-to-cart" onclick="quickAddToCart(${item.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Quick add to cart function for home page
function quickAddToCart(itemId) {
    const item = SAMPLE_MENU_ITEMS.find(item => item.id === itemId);
    if (item && item.available && !item.onMRP) {
        if (item.hasHalf) {
            // Show modal for full/half selection
            showQuickAddModal(item);
        } else {
            // Direct add for items without half option
            cartManager.addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                instructions: ''
            });
        }
    }
}

// Show quick add modal for full/half selection on home page
function showQuickAddModal(item) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal" id="quickAddModal" style="display: block;">
            <div class="modal-content" style="max-width: 400px;">
                <span class="close" onclick="closeQuickAddModal()">&times;</span>
                <div class="modal-header">
                    <h3>${item.name}</h3>
                    <p>Choose your portion size</p>
                </div>
                <div class="modal-body">
                    <div class="price-options">
                        <label class="price-option">
                            <input type="radio" name="quickPriceOption" value="full" checked>
                            <span>Full Plate - ${APP_CONFIG.currency}${item.price}</span>
                        </label>
                        <label class="price-option">
                            <input type="radio" name="quickPriceOption" value="half">
                            <span>Half Plate - ${APP_CONFIG.currency}${item.halfPrice}</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="add-to-cart-confirm" onclick="confirmQuickAdd(${item.id})">
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
function confirmQuickAdd(itemId) {
    const item = SAMPLE_MENU_ITEMS.find(item => item.id === itemId);
    const selectedOption = document.querySelector('input[name="quickPriceOption"]:checked');
    
    if (item && selectedOption) {
        const isHalf = selectedOption.value === 'half';
        const price = isHalf ? item.halfPrice : item.price;
        const sizeName = isHalf ? ' (Half)' : ' (Full)';
        
        cartManager.addItem({
            id: item.id,
            name: item.name + sizeName,
            price: price,
            quantity: 1,
            instructions: ''
        });
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

// Firebase Authentication Manager
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    initAuthListener() {
        // Wait for Firebase to be loaded
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.initAuthListener(), 100);
            return;
        }

        // Listen for authentication state changes
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                try {
                    const userDoc = await firebaseDB.collection('users').doc(user.uid).get();
                    this.currentUser = {
                        id: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        ...userDoc.data()
                    };
                    console.log('✅ User logged in:', this.currentUser.email);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    this.currentUser = {
                        id: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified
                    };
                }
            } else {
                // User is signed out
                this.currentUser = null;
                console.log('👋 User logged out');
            }
            this.updateAuthUI();
        });
    }

    async signup(userData) {
        try {
            const { email, password, firstName, lastName, phone, hostel, roomNumber } = userData;
            
            // Create user account
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save additional user data to Firestore
            await firebaseDB.collection('users').doc(user.uid).set({
                firstName: firstName,
                lastName: lastName,
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                hostel: hostel,
                roomNumber: roomNumber,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });

            console.log('✅ User account created successfully');
            return user;
        } catch (error) {
            console.error('❌ Signup error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ User logged in successfully');
            return userCredential.user;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await firebaseAuth.signOut();
            console.log('✅ User logged out successfully');
        } catch (error) {
            console.error('❌ Logout error:', error);
            throw error;
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    updateAuthUI() {
        const loginBtns = document.querySelectorAll('.login-btn');
        loginBtns.forEach(btn => {
            if (this.currentUser) {
                btn.textContent = 'Logout';
                btn.onclick = () => this.logout();
            } else {
                btn.textContent = 'Login';
                btn.onclick = null;
                btn.href = 'login.html';
            }
        });

        // Update user-specific UI elements
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            if (this.currentUser) {
                el.textContent = this.currentUser.name || this.currentUser.email;
            }
        });
    }

    // Demo login for testing
    async demoLogin() {
        try {
            // Create or login with demo account
            const demoEmail = 'demo@24x7cafe.com';
            const demoPassword = 'demo123456';
            
            try {
                // Try to login first
                await this.login(demoEmail, demoPassword);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    // Create demo account if it doesn't exist
                    await this.signup({
                        email: demoEmail,
                        password: demoPassword,
                        firstName: 'Demo',
                        lastName: 'Student',
                        phone: '+91 98765 43210',
                        hostel: 'Hostel A',
                        roomNumber: '101'
                    });
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('❌ Demo login error:', error);
            throw error;
        }
    }
}

// Initialize Firebase auth manager
const authManager = new FirebaseAuthManager();

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load popular items on home page
    loadPopularItems();
    
    // Update cart UI
    cartManager.updateCartUI();
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

// Export for use in other files
window.cartManager = cartManager;
window.authManager = authManager;
window.SAMPLE_MENU_ITEMS = SAMPLE_MENU_ITEMS;
window.APP_CONFIG = APP_CONFIG;
window.quickAddToCart = quickAddToCart;
window.showQuickAddModal = showQuickAddModal;
window.confirmQuickAdd = confirmQuickAdd;
window.closeQuickAddModal = closeQuickAddModal;