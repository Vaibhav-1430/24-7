// Fixed Cart Manager - Self-contained and reliable
class FixedCartManager {
    constructor() {
        this.cart = [];
        this.cartListener = null;
        this.isInitialized = false;
        this.initializeCart();
    }

    async initializeCart() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            console.log('🛒 Cart Manager: Firebase ready');
            
            // Set up authentication listener
            this.setupAuthListener();
            this.isInitialized = true;
            console.log('✅ Cart Manager initialized');
        } catch (error) {
            console.error('❌ Cart Manager initialization failed:', error);
            // Fallback to localStorage if Firebase fails
            this.loadFromLocalStorage();
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds max wait
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && 
                    firebase.auth && 
                    firebase.firestore) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase not available after 10 seconds'));
                } else {
                    setTimeout(checkFirebase, 500);
                }
            };
            
            checkFirebase();
        });
    }

    setupAuthListener() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log('🛒 User authenticated, loading cart:', user.email);
                await this.loadUserCart(user.uid);
                this.setupRealtimeListener(user.uid);
            } else {
                console.log('🛒 User logged out, clearing cart');
                this.cart = [];
                this.updateCartUI();
                if (this.cartListener) {
                    this.cartListener();
                    this.cartListener = null;
                }
            }
        });
    }

    async loadUserCart(userId) {
        try {
            const cartDoc = await firebase.firestore().collection('carts').doc(userId).get();
            if (cartDoc.exists) {
                this.cart = cartDoc.data().items || [];
                console.log('✅ Cart loaded from Firestore:', this.cart.length, 'items');
            } else {
                this.cart = [];
                console.log('📝 No existing cart found');
            }
            this.updateCartUI();
        } catch (error) {
            console.error('❌ Error loading cart from Firestore:', error);
            // Fallback to localStorage
            this.loadFromLocalStorage();
        }
    }

    setupRealtimeListener(userId) {
        if (this.cartListener) {
            this.cartListener();
        }

        this.cartListener = firebase.firestore().collection('carts').doc(userId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const cartData = doc.data();
                    this.cart = cartData.items || [];
                    console.log('🔄 Cart updated from Firestore:', this.cart.length, 'items');
                    this.updateCartUI();
                }
            }, (error) => {
                console.error('❌ Cart listener error:', error);
            });
    }

    async saveCart() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('⚠️ No user logged in, saving to localStorage');
            this.saveToLocalStorage();
            return;
        }

        try {
            await firebase.firestore().collection('carts').doc(user.uid).set({
                items: this.cart,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Cart saved to Firestore');
        } catch (error) {
            console.error('❌ Error saving cart to Firestore:', error);
            // Fallback to localStorage
            this.saveToLocalStorage();
        }
    }

    // Fallback localStorage methods
    loadFromLocalStorage() {
        try {
            const savedCart = localStorage.getItem('cafe_cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
            console.log('📦 Cart loaded from localStorage:', this.cart.length, 'items');
            this.updateCartUI();
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.cart = [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('cafe_cart', JSON.stringify(this.cart));
            console.log('📦 Cart saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    async addItem(item) {
        console.log('🛒 Adding item to cart:', item.name);
        
        const existingItem = this.cart.find(cartItem => 
            cartItem.id === item.id && 
            cartItem.instructions === item.instructions &&
            cartItem.name === item.name
        );

        if (existingItem) {
            existingItem.quantity += item.quantity;
            console.log('📈 Updated existing item quantity:', existingItem.quantity);
        } else {
            this.cart.push({
                ...item,
                addedAt: new Date().toISOString()
            });
            console.log('➕ Added new item to cart');
        }

        await this.saveCart();
        this.updateCartUI();
        this.showAddToCartNotification(item);
    }

    async removeItem(itemId, instructions = '', itemName = '') {
        console.log('🗑️ Removing item from cart:', itemId);
        
        this.cart = this.cart.filter(item => 
            !(item.id === itemId && 
              item.instructions === instructions &&
              (itemName === '' || item.name === itemName))
        );
        
        await this.saveCart();
        this.updateCartUI();
    }

    async updateQuantity(itemId, instructions, newQuantity, itemName = '') {
        console.log('🔄 Updating item quantity:', itemId, newQuantity);
        
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
                this.updateCartUI();
            }
        }
    }

    async clearCart() {
        console.log('🧹 Clearing cart');
        this.cart = [];
        await this.saveCart();
        this.updateCartUI();
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
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
                if (totalEl) totalEl.textContent = `₹${this.getTotal()}`;
            } else {
                cartSummary.style.display = 'none';
            }
        }

        console.log('🔄 Cart UI updated:', itemCount, 'items');
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

        // Add animation keyframes if not already added
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

// Initialize the fixed cart manager
let fixedCartManager;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFixedCartManager);
} else {
    initializeFixedCartManager();
}

function initializeFixedCartManager() {
    console.log('🚀 Initializing Fixed Cart Manager');
    fixedCartManager = new FixedCartManager();
    
    // Make it globally available
    window.cartManager = fixedCartManager;
    window.fixedCartManager = fixedCartManager;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FixedCartManager;
}