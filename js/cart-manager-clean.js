// Clean Cart Manager for MongoDB Backend
class CartManagerClean {
    constructor() {
        this.cart = { items: [], total: 0, itemCount: 0 };
        this.initializeCart();
    }

    async initializeCart() {
        // Wait for auth to be ready
        setTimeout(async () => {
            if (authManagerClean.isLoggedIn()) {
                await this.loadCart();
            }
            this.updateCartUI();
        }, 1000);

        // Listen for auth changes
        this.setupAuthListener();
    }

    setupAuthListener() {
        // Check auth state periodically
        setInterval(() => {
            if (authManagerClean.isLoggedIn() && !this.cart.items.length) {
                this.loadCart();
            } else if (!authManagerClean.isLoggedIn() && this.cart.items.length) {
                this.cart = { items: [], total: 0, itemCount: 0 };
                this.updateCartUI();
            }
        }, 2000);
    }

    async loadCart() {
        if (!authManagerClean.isLoggedIn()) {
            console.log('⚠️ User not logged in, cannot load cart');
            this.cart = { items: [], total: 0, itemCount: 0 };
            this.updateCartUI();
            return;
        }

        try {
            console.log('🛒 Loading cart from backend...');
            const cartData = await apiClient.getCart();
            console.log('🛒 Raw API response:', cartData);
            
            // Handle the API response structure properly
            if (cartData) {
                this.cart = cartData; // The API returns the cart object directly
                console.log('✅ Cart loaded and assigned:', this.cart);
            } else {
                this.cart = { items: [], total: 0, itemCount: 0 };
                console.log('⚠️ No cart data received, using empty cart');
            }
            
            this.updateCartUI();
            
            // Trigger custom event for cart page to refresh
            window.dispatchEvent(new CustomEvent('cartLoaded', { detail: this.cart }));
            
        } catch (error) {
            console.error('❌ Error loading cart:', error);
            this.cart = { items: [], total: 0, itemCount: 0 };
            this.updateCartUI();
        }
    }

    async addItem(item) {
        if (!authManagerClean.isLoggedIn()) {
            console.log('⚠️ User not logged in, redirecting to login');
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('🛒 Adding item to cart:', item.name);
            
            const cartItem = {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions || ''
            };

            const updatedCart = await apiClient.addToCart(cartItem);
            console.log('🛒 API response after adding item:', updatedCart);
            
            // The API returns the updated cart directly
            this.cart = updatedCart;
            
            console.log('✅ Item added to cart successfully, new cart:', this.cart);
            this.updateCartUI();
            this.showAddToCartNotification(item);
            
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            
            // Show user-friendly error message
            if (error.message.includes('connect to backend')) {
                alert('Cannot connect to server. Please make sure the backend is running and try again.');
            } else if (error.message.includes('Invalid token')) {
                alert('Your session has expired. Please login again.');
                authManagerClean.logout();
            } else {
                alert('Failed to add item to cart. Please try again.');
            }
        }
    }

    async removeItem(itemId) {
        if (!authManagerClean.isLoggedIn()) return;

        try {
            console.log('🗑️ Removing item from cart:', itemId);
            
            const updatedCart = await apiClient.removeFromCart(itemId);
            this.cart = updatedCart;
            
            console.log('✅ Item removed from cart');
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
            alert('Failed to remove item from cart. Please try again.');
        }
    }

    async updateQuantity(itemId, newQuantity) {
        if (!authManagerClean.isLoggedIn()) return;

        try {
            console.log('🔄 Updating item quantity:', itemId, newQuantity);
            
            if (newQuantity <= 0) {
                await this.removeItem(itemId);
                return;
            }

            const updatedCart = await apiClient.updateCartItem(itemId, newQuantity);
            this.cart = updatedCart;
            
            console.log('✅ Item quantity updated');
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Error updating cart:', error);
            alert('Failed to update item quantity. Please try again.');
        }
    }

    async clearCart() {
        if (!authManagerClean.isLoggedIn()) return;

        try {
            console.log('🧹 Clearing cart');
            
            const updatedCart = await apiClient.clearCart();
            this.cart = updatedCart;
            
            console.log('✅ Cart cleared');
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            alert('Failed to clear cart. Please try again.');
        }
    }

    getTotal() {
        if (!this.cart) return 0;
        
        // Try different ways to get the total
        if (this.cart.total !== undefined) {
            return this.cart.total;
        }
        
        // Calculate from items
        let items = [];
        if (this.cart.items && Array.isArray(this.cart.items)) {
            items = this.cart.items;
        } else if (this.cart.data && this.cart.data.items && Array.isArray(this.cart.data.items)) {
            items = this.cart.data.items;
        } else if (Array.isArray(this.cart)) {
            items = this.cart;
        }
        
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        if (!this.cart) return 0;
        
        // Try different ways to get the item count
        if (this.cart.itemCount !== undefined) {
            return this.cart.itemCount;
        }
        
        // Calculate from items
        let items = [];
        if (this.cart.items && Array.isArray(this.cart.items)) {
            items = this.cart.items;
        } else if (this.cart.data && this.cart.data.items && Array.isArray(this.cart.data.items)) {
            items = this.cart.data.items;
        } else if (Array.isArray(this.cart)) {
            items = this.cart;
        }
        
        return items.reduce((count, item) => count + item.quantity, 0);
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

// Initialize cart manager
const cartManagerClean = new CartManagerClean();

// Make it globally available
window.cartManager = cartManagerClean;
window.cartManagerClean = cartManagerClean;