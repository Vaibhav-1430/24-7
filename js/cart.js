// Cart Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Cart page loading...');
    
    // Wait for managers to be ready
    setTimeout(initializeCartPage, 1000);
});

function initializeCartPage() {
    console.log('🛒 Initializing cart page...');
    
    // Check if managers are ready
    if (!window.authManagerClean || !window.cartManagerClean) {
        console.log('⏳ Managers not ready, retrying...');
        setTimeout(initializeCartPage, 500);
        return;
    }
    
    console.log('✅ Cart managers ready');
    
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Listen for cart loaded event
    window.addEventListener('cartLoaded', function(event) {
        console.log('🛒 Cart loaded event received:', event.detail);
        loadCartItems();
    });
    
    // Load cart items on page load
    setTimeout(() => {
        cartManagerClean.loadCart().then(() => {
            loadCartItems();
        });
    }, 500);
    
    // Clear cart button
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                cartManagerClean.clearCart();
                setTimeout(loadCartItems, 500); // Wait for cart to be cleared
            }
        });
    }
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartManagerClean.getItemCount() === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            if (!authManagerClean.isLoggedIn()) {
                if (confirm('You need to login to place an order. Would you like to login now?')) {
                    window.location.href = 'login.html';
                }
                return;
            }
            
            // Redirect to checkout page
            window.location.href = 'checkout.html';
        });
    }
}

function loadCartItems() {
    console.log('🛒 Loading cart items...');
    
    // Get cart data from cart manager
    let cart = cartManagerClean.cart;
    console.log('🛒 Raw cart data:', cart);
    
    // Handle different possible cart data structures
    let cartItems = [];
    if (cart && cart.items && Array.isArray(cart.items)) {
        cartItems = cart.items;
    } else if (cart && Array.isArray(cart)) {
        cartItems = cart;
    } else if (cart && cart.data && cart.data.items && Array.isArray(cart.data.items)) {
        cartItems = cart.data.items;
    }
    
    console.log('🛒 Cart items to display:', cartItems);
    
    if (!cartItems || cartItems.length === 0) {
        console.log('🛒 Cart is empty');
        showEmptyCart();
        return;
    }
    
    console.log('🛒 Cart has', cartItems.length, 'items');
    showCartItems();
    renderCartItems(cartItems);
    updateOrderSummary();
}

function showEmptyCart() {
    const emptyCart = document.getElementById('emptyCart');
    const cartItemsList = document.getElementById('cartItemsList');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (emptyCart) emptyCart.style.display = 'block';
    if (cartItemsList) cartItemsList.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (clearCartBtn) clearCartBtn.style.display = 'none';
}

function showCartItems() {
    const emptyCart = document.getElementById('emptyCart');
    const cartItemsList = document.getElementById('cartItemsList');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartItemsList) cartItemsList.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (clearCartBtn) clearCartBtn.style.display = 'flex';
}

function renderCartItems(cartItems) {
    const cartItemsList = document.getElementById('cartItemsList');
    if (!cartItemsList) return;
    
    cartItemsList.innerHTML = cartItems.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        return `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="images/placeholder.jpg" 
                         alt="${item.name}" 
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    ${item.instructions ? `<div class="cart-item-instructions">"${item.instructions}"</div>` : ''}
                    <div class="cart-item-price">₹${item.price} each</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})" 
                                ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})" 
                                ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="remove-item-btn" onclick="removeItem('${item.id}')" title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    ₹${itemTotal}
                </div>
            </div>
        `;
    }).join('');
}

function updateOrderSummary() {
    // Get the actual total from cart manager
    let subtotal = 0;
    let itemCount = 0;
    
    // Calculate from cart manager methods
    if (cartManagerClean.getTotal && cartManagerClean.getItemCount) {
        subtotal = cartManagerClean.getTotal();
        itemCount = cartManagerClean.getItemCount();
    } else {
        // Fallback: calculate manually from cart items
        const cart = cartManagerClean.cart;
        let cartItems = [];
        
        if (cart && cart.items && Array.isArray(cart.items)) {
            cartItems = cart.items;
        } else if (cart && Array.isArray(cart)) {
            cartItems = cart;
        } else if (cart && cart.data && cart.data.items && Array.isArray(cart.data.items)) {
            cartItems = cart.data.items;
        }
        
        subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    }
    
    const deliveryFee = subtotal > 0 ? 10 : 0;
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + deliveryFee + tax;
    
    console.log('🛒 Order summary - Subtotal:', subtotal, 'Items:', itemCount);
    
    const subtotalEl = document.getElementById('subtotal');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `₹${deliveryFee}`;
    if (taxEl) taxEl.textContent = `₹${tax}`;
    if (totalEl) totalEl.textContent = `₹${total}`;
}

// Global functions for cart operations
window.updateQuantity = async function(itemId, newQuantity) {
    try {
        if (newQuantity <= 0) {
            await removeItem(itemId);
        } else if (newQuantity <= 10) {
            await cartManagerClean.updateQuantity(itemId, newQuantity);
            setTimeout(loadCartItems, 500); // Reload cart items
        }
    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        alert('Failed to update quantity. Please try again.');
    }
};

window.removeItem = async function(itemId) {
    try {
        await cartManagerClean.removeItem(itemId);
        setTimeout(loadCartItems, 500); // Reload cart items
    } catch (error) {
        console.error('❌ Error removing item:', error);
        alert('Failed to remove item. Please try again.');
    }
};

// Make loadCartItems available globally for refreshing
window.loadCartItems = loadCartItems;