// Checkout Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!authManager.isLoggedIn()) {
        alert('Please login to continue with checkout');
        window.location.href = 'login.html?return=checkout.html';
        return;
    }

    // Check if cart is empty
    if (cartManager.cart.length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'menu.html';
        return;
    }

    // Initialize checkout
    initializeCheckout();
    loadOrderSummary();
    setupEventListeners();
});

function initializeCheckout() {
    const user = authManager.currentUser;
    
    // Pre-fill user information
    if (user) {
        const customerName = document.getElementById('customerName');
        const customerPhone = document.getElementById('customerPhone');
        const hostelName = document.getElementById('hostelName');
        const roomNumber = document.getElementById('roomNumber');
        
        if (customerName && user.name) customerName.value = user.name;
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
    const orderItems = document.getElementById('orderItems');
    const cart = cartManager.cart;
    
    // Render order items
    orderItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="order-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        Qty: ${item.quantity} × ${APP_CONFIG.currency}${item.price}
                        ${item.instructions ? `<br><em>"${item.instructions}"</em>` : ''}
                    </div>
                </div>
                <div class="item-total">${APP_CONFIG.currency}${itemTotal}</div>
            </div>
        `;
    }).join('');
    
    // Update price breakdown
    updatePriceBreakdown();
}

function updatePriceBreakdown() {
    const subtotal = cartManager.getTotal();
    const deliveryFee = subtotal > 0 ? 10 : 0;
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + deliveryFee + tax;
    
    document.getElementById('checkoutSubtotal').textContent = `${APP_CONFIG.currency}${subtotal}`;
    document.getElementById('checkoutDeliveryFee').textContent = `${APP_CONFIG.currency}${deliveryFee}`;
    document.getElementById('checkoutTax').textContent = `${APP_CONFIG.currency}${tax}`;
    document.getElementById('checkoutTotal').textContent = `${APP_CONFIG.currency}${total}`;
    
    updateUpiAmount();
}

function calculateTotal() {
    const subtotal = cartManager.getTotal();
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
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create order object
        const order = {
            id: generateOrderId(),
            userId: authManager.currentUser.id,
            items: cartManager.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                instructions: item.instructions
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
                subtotal: cartManager.getTotal(),
                deliveryFee: 10,
                tax: Math.round(cartManager.getTotal() * 0.05),
                total: calculateTotal()
            },
            status: 'received',
            orderTime: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
        };
        
        // Save order to localStorage (in production, this would be saved to database)
        saveOrder(order);
        
        // Clear cart
        cartManager.clearCart();
        
        // Show success modal
        showOrderSuccess(order);
        
    } catch (error) {
        alert('Failed to place order. Please try again.');
        console.error('Order placement error:', error);
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

// Save order to Firestore
async function saveOrder(order) {
    try {
        // Wait for Firebase to be ready
        await window.waitForFirebase();

        console.log('💾 Saving order to Firestore:', order.id);
        
        // Add order to Firestore
        const docRef = await window.firebaseDB.collection('orders').add({
            ...order,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Order saved with Firestore ID:', docRef.id);
        
        // Update the order with the Firestore document ID
        order.firestoreId = docRef.id;
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving order:', error);
        if (error.code === 'permission-denied') {
            console.error('🔍 Order save permission denied. Check security rules in FIRESTORE-RULES-FIX.md');
        }
        throw error;
    }
}

function showOrderSuccess(order) {
    const modal = document.getElementById('orderSuccessModal');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const estimatedDelivery = document.getElementById('estimatedDelivery');
    const orderTotalDisplay = document.getElementById('orderTotalDisplay');
    
    // Populate modal with order details
    orderIdDisplay.textContent = order.id;
    orderTotalDisplay.textContent = `${APP_CONFIG.currency}${order.pricing.total}`;
    
    // Format estimated delivery time
    const deliveryTime = new Date(order.estimatedDelivery);
    estimatedDelivery.textContent = deliveryTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    // Show modal
    modal.style.display = 'block';
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