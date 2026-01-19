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
            return;
        }

        try {
            const cartData = await apiClient.getCart();
            this.cart = cartData || { items: [], total: 0, itemCount: 0 };
            console.log('✅ Cart loaded:', this.cart.itemCount, 'items');
            this.updateCartUI();
        } catch (error) {
            console.error('❌ Error loading cart:', error);
            this.cart = { items: [], total: 0, itemCount: 0 };
        }
    }

    async addItem(item) {
        if (!authManagerClean.isLoggedIn()) {
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('🛒 Adding item to cart:', item.name);
            
            // Find the menu item ID from the global menu data
            const menuItem = window.SAMPLE_MENU_ITEMS?.find(menuItem => menuItem.id === item.id);
            
            const cartItem = {
                menuItemId: menuItem?._id || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions || ''
            };

            const updatedCart = await apiClient.addToCart(cartItem);
            this.cart = updatedCart;
            
            console.log('✅ Item added to cart');
            this.updateCartUI();
            this.showAddToCartNotification(item);
            
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            alert('Failed to add item to cart. Please try again.');
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
        return this.cart.total || 0;
    }

    getItemCount() {
        return this.cart.itemCount || 0;
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