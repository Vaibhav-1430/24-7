// Checkout Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Checkout page loading...');
    
    // Wait for managers to be ready
    setTimeout(initializeCheckoutPage, 1000);
});

function initializeCheckoutPage() {
    console.log('💳 Initializing checkout page...');
    
    // Check if managers are ready
    if (!window.authManagerClean || !window.cartManagerClean) {
        console.log('⏳ Managers not ready, retrying...');
        setTimeout(initializeCheckoutPage, 500);
        return;
    }
    
    // Check if user is logged in
    if (!authManagerClean.isLoggedIn()) {
        alert('Please login to continue with checkout');
        window.location.href = 'login.html?return=checkout.html';
        return;
    }

    // Load cart and check if empty
    cartManagerClean.loadCart().then(() => {
        const itemCount = cartManagerClean.getItemCount();
        if (itemCount === 0) {
            alert('Your cart is empty!');
            window.location.href = 'menu.html';
            return;
        }

        // Initialize checkout
        initializeCheckout();
        loadOrderSummary();
        setupEventListeners();
    });
}

function initializeCheckout() {
    const user = authManagerClean.currentUser;
    
    // Pre-fill user information
    if (user) {
        const customerName = document.getElementById('customerName');
        const customerPhone = document.getElementById('customerPhone');
        const hostelName = document.getElementById('hostelName');
        const roomNumber = document.getElementById('roomNumber');
        
        if (customerName && user.fullName) customerName.value = user.fullName;
        if (customerPhone && user.phone) customerPhone.value = user.phone;
        if (hostelName && user.hostel) hostelName.value = user.hostel;
        if (roomNumber && user.roomNumber) roomNumber.value = user.roomNumber;
    }
}

function setupEventListeners() {
    // Payment method change
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });

    // Place order button
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    placeOrderBtn.addEventListener('click', handlePlaceOrder);

    // Form validation
    const form = document.getElementById('checkoutForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('change', validateForm);
    });

    // Initial form validation
    validateForm();
}

function handlePaymentMethodChange(e) {
    const upiSection = document.getElementById('upiSection');
    const transactionIdInput = document.getElementById('transactionId');
    
    if (e.target.value === 'upi') {
        upiSection.style.display = 'block';
        transactionIdInput.required = true;
        updateUpiAmount();
    } else {
        upiSection.style.display = 'none';
        transactionIdInput.required = false;
    }
    
    validateForm();
}

function updateUpiAmount() {
    const total = calculateTotal();
    const upiAmountEl = document.getElementById('upiAmount');
    if (upiAmountEl) {
        upiAmountEl.textContent = total;
    }
}

function loadOrderSummary() {
    console.log('💳 Loading order summary...');
    
    const orderItems = document.getElementById('orderItems');
    const cart = cartManagerClean.cart;
    
    // Get cart items from the correct structure
    let cartItems = [];
    if (cart && cart.items && Array.isArray(cart.items)) {
        cartItems = cart.items;
    } else if (cart && Array.isArray(cart)) {
        cartItems = cart;
    } else if (cart && cart.data && cart.data.items && Array.isArray(cart.data.items)) {
        cartItems = cart.data.items;
    }
    
    console.log('💳 Cart items for checkout:', cartItems);
    
    // Render order items
    if (orderItems) {
        orderItems.innerHTML = cartItems.map(item => {
            const itemTotal = item.price * item.quantity;
            return `
                <div class="order-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">
                            Qty: ${item.quantity} × ₹${item.price}
                            ${item.instructions ? `<br><em>"${item.instructions}"</em>` : ''}
                        </div>
                    </div>
                    <div class="item-total">₹${itemTotal}</div>
                </div>
            `;
        }).join('');
    }
    
    // Update price breakdown
    updatePriceBreakdown();
}

function updatePriceBreakdown() {
    const subtotal = cartManagerClean.getTotal();
    const deliveryFee = subtotal > 0 ? 10 : 0;
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + deliveryFee + tax;
    
    console.log('💳 Price breakdown - Subtotal:', subtotal, 'Total:', total);
    
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const deliveryFeeEl = document.getElementById('checkoutDeliveryFee');
    const taxEl = document.getElementById('checkoutTax');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `₹${deliveryFee}`;
    if (taxEl) taxEl.textContent = `₹${tax}`;
    if (totalEl) totalEl.textContent = `₹${total}`;
    
    updateUpiAmount();
}

function calculateTotal() {
    const subtotal = cartManagerClean.getTotal();
    const deliveryFee = subtotal > 0 ? 10 : 0;
    const tax = Math.round(subtotal * 0.05);
    return subtotal + deliveryFee + tax;
}

function validateForm() {
    const form = document.getElementById('checkoutForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Get all required fields
    let requiredFields = form.querySelectorAll('input[required], select[required]');
    
    // Filter out UPI transaction ID if COD is selected
    if (paymentMethod === 'cod') {
        requiredFields = Array.from(requiredFields).filter(field => field.id !== 'transactionId');
    }
    
    // Check if all required fields are filled
    const isValid = Array.from(requiredFields).every(field => {
        return field.value.trim() !== '';
    });
    
    placeOrderBtn.disabled = !isValid;
}

async function handlePlaceOrder() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Show loading state
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const originalText = placeOrderBtn.innerHTML;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
    
    try {
        // Get cart items
        const cart = cartManagerClean.cart;
        let cartItems = [];
        if (cart && cart.items && Array.isArray(cart.items)) {
            cartItems = cart.items;
        } else if (cart && Array.isArray(cart)) {
            cartItems = cart;
        } else if (cart && cart.data && cart.data.items && Array.isArray(cart.data.items)) {
            cartItems = cart.data.items;
        }
        
        // Create order data for API
        const orderData = {
            items: cartItems.map(item => ({
                id: item.id,
                menuItemId: item.menuItemId || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions || ''
            })),
            delivery: {
                hostel: formData.get('hostelName'),
                roomNumber: formData.get('roomNumber'),
                instructions: formData.get('deliveryNotes') || ''
            },
            contact: {
                name: formData.get('customerName'),
                phone: formData.get('customerPhone')
            },
            payment: {
                method: paymentMethod,
                transactionId: paymentMethod === 'upi' ? formData.get('transactionId') : null
            },
            pricing: {
                subtotal: cartManagerClean.getTotal(),
                deliveryFee: 10,
                tax: Math.round(cartManagerClean.getTotal() * 0.05),
                total: calculateTotal()
            }
        };
        
        console.log('💳 Placing order via API:', orderData);
        
        // Create order via API
        const createdOrder = await apiClient.createOrder(orderData);
        
        console.log('✅ Order created successfully:', createdOrder);
        
        // Reload cart to reflect cleared state
        await cartManagerClean.loadCart();
        
        // Show success modal
        showOrderSuccess(createdOrder);
        
    } catch (error) {
        console.error('❌ Order placement error:', error);
        
        let errorMessage = 'Failed to place order. Please try again.';
        if (error.message.includes('connect to backend')) {
            errorMessage = 'Cannot connect to server. Please check your connection and try again.';
        } else if (error.message.includes('Invalid token')) {
            errorMessage = 'Your session has expired. Please login again.';
            authManagerClean.logout();
        }
        
        alert(errorMessage);
        
    } finally {
        // Reset button state
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalText;
    }
}

function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `247${timestamp.toString().slice(-6)}${random}`;
}

// Save order to localStorage (simple version)
function saveOrderToLocalStorage(order) {
    try {
        const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        existingOrders.push(order);
        localStorage.setItem('userOrders', JSON.stringify(existingOrders));
        console.log('✅ Order saved to localStorage:', order.id);
    } catch (error) {
        console.error('❌ Error saving order to localStorage:', error);
    }
}

function showOrderSuccess(order) {
    console.log('🎉 Showing order success:', order);
    
    const modal = document.getElementById('orderSuccessModal');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const estimatedDelivery = document.getElementById('estimatedDelivery');
    const orderTotalDisplay = document.getElementById('orderTotalDisplay');
    
    // Populate modal with order details
    if (orderIdDisplay) orderIdDisplay.textContent = order.orderId || order.id;
    if (orderTotalDisplay) orderTotalDisplay.textContent = `₹${order.pricing.total}`;
    
    // Format estimated delivery time
    if (estimatedDelivery) {
        const deliveryTime = new Date(order.estimatedDelivery);
        estimatedDelivery.textContent = deliveryTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Show modal
    if (modal) {
        modal.style.display = 'block';
    } else {
        // Fallback if modal doesn't exist
        const orderId = order.orderId || order.id;
        const total = order.pricing.total;
        alert(`🎉 Order placed successfully!\n\nOrder ID: ${orderId}\nTotal: ₹${total}\n\nYour order will be delivered in approximately 15 minutes.`);
        window.location.href = 'orders.html';
    }
}

// Global functions for modal actions
window.trackOrder = function() {
    // In a real app, this would redirect to order tracking page
    alert('Order tracking feature will be available soon!');
    window.location.href = 'index.html';
};

window.continueShopping = function() {
    window.location.href = 'menu.html';
};

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('orderSuccessModal');
    if (e.target === modal) {
        modal.style.display = 'none';
        window.location.href = 'index.html';
    }
});