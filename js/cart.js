// Cart Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Load cart items on page load
    loadCartItems();
    
    // Clear cart button
    clearCartBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your cart?')) {
            cartManager.clearCart();
            loadCartItems();
        }
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', function() {
        if (cartManager.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        if (!authManager.isLoggedIn()) {
            if (confirm('You need to login to place an order. Would you like to login now?')) {
                window.location.href = 'login.html';
            }
            return;
        }
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    });
    
    function loadCartItems() {
        const cart = cartManager.cart;
        
        if (cart.length === 0) {
            showEmptyCart();
            return;
        }
        
        showCartItems();
        renderCartItems(cart);
        updateOrderSummary();
    }
    
    function showEmptyCart() {
        emptyCart.style.display = 'block';
        cartItemsList.style.display = 'none';
        checkoutBtn.disabled = true;
        clearCartBtn.style.display = 'none';
    }
    
    function showCartItems() {
        emptyCart.style.display = 'none';
        cartItemsList.style.display = 'block';
        checkoutBtn.disabled = false;
        clearCartBtn.style.display = 'flex';
    }
    
    function renderCartItems(cart) {
        cartItemsList.innerHTML = cart.map((item, index) => {
            const menuItem = SAMPLE_MENU_ITEMS.find(menuItem => menuItem.id === item.id);
            const itemTotal = item.price * item.quantity;
            
            return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <img src="${menuItem ? menuItem.image : 'images/placeholder.jpg'}" 
                             alt="${item.name}" 
                             onerror="this.src='images/placeholder.jpg'">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        ${item.instructions ? `<div class="cart-item-instructions">"${item.instructions}"</div>` : ''}
                        <div class="cart-item-price">${APP_CONFIG.currency}${item.price} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})" 
                                    ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})" 
                                    ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="remove-item-btn" onclick="removeItem(${index})" title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function updateOrderSummary() {
        const cart = cartManager.cart;
        const subtotal = cartManager.getTotal();
        const deliveryFee = subtotal > 0 ? 10 : 0;
        const taxRate = 0.05;
        const tax = Math.round(subtotal * taxRate);
        const total = subtotal + deliveryFee + tax;
        
        document.getElementById('subtotal').textContent = `${APP_CONFIG.currency}${subtotal}`;
        document.getElementById('deliveryFee').textContent = `${APP_CONFIG.currency}${deliveryFee}`;
        document.getElementById('tax').textContent = `${APP_CONFIG.currency}${tax}`;
        document.getElementById('total').textContent = `${APP_CONFIG.currency}${total}`;
    }
    
    // Global functions for cart operations
    window.updateQuantity = function(index, newQuantity) {
        const cart = cartManager.cart;
        if (index >= 0 && index < cart.length) {
            const item = cart[index];
            
            if (newQuantity <= 0) {
                removeItem(index);
            } else if (newQuantity <= 10) {
                cartManager.updateQuantity(item.id, item.instructions, newQuantity);
                loadCartItems();
            }
        }
    };
    
    window.removeItem = function(index) {
        const cart = cartManager.cart;
        if (index >= 0 && index < cart.length) {
            const item = cart[index];
            
            // Add removing animation
            const cartItemElement = document.querySelector(`[data-index="${index}"]`);
            if (cartItemElement) {
                cartItemElement.classList.add('removing');
                
                setTimeout(() => {
                    cartManager.removeItem(item.id, item.instructions);
                    loadCartItems();
                }, 300);
            } else {
                cartManager.removeItem(item.id, item.instructions);
                loadCartItems();
            }
        }
    };
    
    // Update cart count in navigation
    cartManager.updateCartUI();
});