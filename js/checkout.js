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
    const deliveryFee = subtotal > 0 ? 5 : 0;
    const total = subtotal + deliveryFee;
    
    console.log('💳 Price breakdown - Subtotal:', subtotal, 'Total:', total);
    
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const deliveryFeeEl = document.getElementById('checkoutDeliveryFee');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `₹${deliveryFee}`;
    if (totalEl) totalEl.textContent = `₹${total}`;
    
    updateUpiAmount();
}

function calculateTotal() {
    const subtotal = cartManagerClean.getTotal();
    const deliveryFee = subtotal > 0 ? 5 : 0;
    return subtotal + deliveryFee;
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
                deliveryFee: 5,
                total: calculateTotal()
            }
        };
        
        console.log('💳 Placing order via API:', orderData);
        
        // Create order via API
        const createdOrder = await apiClient.createOrder(orderData);
        
        console.log('✅ Order created successfully:', createdOrder);
        
        // Clear the cart after successful order
        await cartManagerClean.clearCart();
        
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
    console.log('🎉 Showing order success modal:', order);
    
    const modal = document.getElementById('orderSuccessModal');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const estimatedDelivery = document.getElementById('estimatedDelivery');
    const orderTotalDisplay = document.getElementById('orderTotalDisplay');
    
    console.log('🎉 Modal element found:', !!modal);
    console.log('🎉 Order data:', order);
    
    // Populate modal with order details
    if (orderIdDisplay) {
        orderIdDisplay.textContent = order.orderNumber || order.id;
        console.log('🎉 Set order ID:', order.orderNumber || order.id);
    }
    
    if (orderTotalDisplay) {
        orderTotalDisplay.textContent = `₹${order.pricing.total}`;
        console.log('🎉 Set total:', order.pricing.total);
    }
    
    // Format estimated delivery time
    if (estimatedDelivery && order.estimatedDelivery) {
        const deliveryTime = new Date(order.estimatedDelivery);
        estimatedDelivery.textContent = deliveryTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        console.log('🎉 Set delivery time:', deliveryTime.toLocaleTimeString());
    } else if (estimatedDelivery) {
        // Set default delivery time if not provided
        const defaultDelivery = new Date(Date.now() + 30 * 60 * 1000);
        estimatedDelivery.textContent = defaultDelivery.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        console.log('🎉 Set default delivery time');
    }
    
    // Show modal with smooth animation
    if (modal) {
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Show modal
        modal.style.display = 'flex';
        modal.style.zIndex = '10000';
        
        // Trigger animation after a small delay
        setTimeout(() => {
            modal.classList.add('show');
        }, 50);
        
        // Start progress animation after modal is shown
        setTimeout(() => {
            animateProgressBar();
        }, 800);
        
        // Focus on modal for accessibility
        modal.focus();
        
        console.log('🎉 Modal displayed successfully with animations');
    } else {
        console.error('❌ Modal element not found! Creating fallback...');
        // Create a simple modal if the original doesn't exist
        createFallbackModal(order);
    }
}

function animateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.progress-steps .step');
    
    if (progressFill && steps.length > 0) {
        // Animate progress bar
        progressFill.style.width = '25%';
        
        // Animate first step
        setTimeout(() => {
            if (steps[0]) {
                steps[0].classList.add('active');
            }
        }, 200);
        
        // Add subtle pulse animation to active step
        setTimeout(() => {
            if (steps[0]) {
                const icon = steps[0].querySelector('i');
                if (icon) {
                    icon.style.animation = 'pulse 2s infinite';
                }
            }
        }, 600);
    }
}

function createFallbackModal(order) {
    // Create a simple fallback modal
    const fallbackModal = document.createElement('div');
    fallbackModal.id = 'fallbackOrderModal';
    fallbackModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    fallbackModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 400px; margin: 20px;">
            <div style="color: #27ae60; font-size: 48px; margin-bottom: 20px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 style="color: #333; margin-bottom: 10px;">Order Placed Successfully!</h2>
            <p style="color: #666; margin-bottom: 20px;">Your order has been received and is being prepared</p>
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <p><strong>Order ID:</strong> ${order.orderNumber || order.id}</p>
                <p><strong>Total Amount:</strong> ₹${order.pricing.total}</p>
                <p><strong>Estimated Delivery:</strong> 30 minutes</p>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="closeFallbackModal(); window.location.href='orders.html';" 
                        style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer;">
                    Track Order
                </button>
                <button onclick="closeFallbackModal(); window.location.href='menu.html';" 
                        style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer;">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(fallbackModal);
    
    // Add close function
    window.closeFallbackModal = function() {
        if (fallbackModal.parentNode) {
            fallbackModal.parentNode.removeChild(fallbackModal);
        }
    };
    
    console.log('🎉 Fallback modal created and displayed');
}

// Global functions for modal actions
window.trackOrder = function() {
    // Close modal with animation and redirect to orders page
    closeModalWithAnimation(() => {
        window.location.href = 'orders.html';
    });
};

window.continueShopping = function() {
    // Close modal with animation and redirect to menu page
    closeModalWithAnimation(() => {
        window.location.href = 'menu.html';
    });
};

window.closeOrderSuccessModal = function() {
    closeModalWithAnimation();
};

function closeModalWithAnimation(callback) {
    const modal = document.getElementById('orderSuccessModal');
    if (modal && modal.classList.contains('show')) {
        // Remove show class to trigger closing animation
        modal.classList.remove('show');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 400); // Match the CSS transition duration
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('orderSuccessModal');
    if (e.target === modal) {
        closeModalWithAnimation();
    }
});

// Ensure modal closes properly with Escape key
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('orderSuccessModal');
        if (modal && modal.classList.contains('show')) {
            closeModalWithAnimation();
        }
    }
});