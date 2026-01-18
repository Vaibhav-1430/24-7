// Orders Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!authManager.isLoggedIn()) {
        showLoginRequired();
        return;
    }

    // Initialize orders page
    initializeOrdersPage();
    setupEventListeners();
    loadUserOrders();
});

function showLoginRequired() {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('orderFilters').style.display = 'none';
    document.getElementById('ordersList').style.display = 'none';
    document.getElementById('noOrders').style.display = 'none';
}

function initializeOrdersPage() {
    document.getElementById('loginRequired').style.display = 'none';
    document.getElementById('orderFilters').style.display = 'flex';
    document.getElementById('ordersList').style.display = 'block';
}

function setupEventListeners() {
    // Order filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const status = this.dataset.status;
            filterUserOrders(status);
        });
    });
}

function loadUserOrders() {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const currentUser = authManager.currentUser;
    
    // Filter orders for current user
    const userOrders = allOrders.filter(order => order.userId === currentUser.id);
    
    if (userOrders.length === 0) {
        showNoOrders();
        return;
    }
    
    displayOrders(userOrders);
}

function filterUserOrders(status) {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const currentUser = authManager.currentUser;
    
    let userOrders = allOrders.filter(order => order.userId === currentUser.id);
    
    if (status !== 'all') {
        userOrders = userOrders.filter(order => order.status === status);
    }
    
    if (userOrders.length === 0) {
        showNoOrdersForFilter();
        return;
    }
    
    displayOrders(userOrders);
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    document.getElementById('noOrders').style.display = 'none';
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <p><i class="fas fa-calendar"></i> ${formatDateTime(order.orderTime)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${order.delivery.hostel}, Room ${order.delivery.roomNumber}</p>
                    <p><i class="fas fa-credit-card"></i> ${order.payment.method.toUpperCase()}</p>
                </div>
                <div class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            <div class="order-body">
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item">
                            <div>
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity"> × ${item.quantity}</span>
                            </div>
                            <span class="item-price">₹${item.price * item.quantity}</span>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `
                        <div class="order-item">
                            <span class="item-name">+${order.items.length - 3} more items</span>
                            <span></span>
                        </div>
                    ` : ''}
                </div>
                <div class="order-summary">
                    <h4>Order Summary</h4>
                    <div class="summary-row">
                        <span>Items (${order.items.length})</span>
                        <span>₹${order.pricing.subtotal}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery</span>
                        <span>₹${order.pricing.deliveryFee}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax</span>
                        <span>₹${order.pricing.tax}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>₹${order.pricing.total}</span>
                    </div>
                </div>
            </div>
            <div class="order-actions">
                <button class="view-details-btn" onclick="showOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="reorder-btn" onclick="reorderItems('${order.id}')">
                    <i class="fas fa-redo"></i> Reorder
                </button>
            </div>
        </div>
    `).join('');
}

function showNoOrders() {
    document.getElementById('ordersList').style.display = 'none';
    document.getElementById('noOrders').style.display = 'block';
}

function showNoOrdersForFilter() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = `
        <div class="no-orders">
            <i class="fas fa-search"></i>
            <h3>No Orders Found</h3>
            <p>No orders found for the selected filter.</p>
        </div>
    `;
}

function getStatusText(status) {
    const statusTexts = {
        'received': 'Order Received',
        'preparing': 'Preparing',
        'ready': 'Ready for Pickup',
        'delivered': 'Delivered'
    };
    return statusTexts[status] || status;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today, ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } else if (diffDays === 2) {
        return 'Yesterday, ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}

// Global functions
window.showOrderDetails = function(orderId) {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const modal = document.getElementById('orderDetailsModal');
    const title = document.getElementById('orderDetailsTitle');
    const body = document.getElementById('orderDetailsBody');
    
    title.textContent = `Order #${order.id}`;
    
    body.innerHTML = `
        <div class="order-details-content">
            <div class="detail-section">
                <h4>Order Information</h4>
                <div class="detail-row">
                    <span>Order ID:</span>
                    <strong>#${order.id}</strong>
                </div>
                <div class="detail-row">
                    <span>Order Date:</span>
                    <strong>${formatDateTime(order.orderTime)}</strong>
                </div>
                <div class="detail-row">
                    <span>Status:</span>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                ${order.estimatedDelivery ? `
                    <div class="detail-row">
                        <span>Estimated Delivery:</span>
                        <strong>${new Date(order.estimatedDelivery).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}</strong>
                    </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <h4>Items Ordered</h4>
                <div class="detail-items">
                    ${order.items.map(item => `
                        <div class="detail-item">
                            <div class="detail-item-info">
                                <div class="detail-item-name">${item.name}</div>
                                <div class="detail-item-desc">Quantity: ${item.quantity} × ₹${item.price}</div>
                                ${item.instructions ? `<div class="detail-item-desc"><em>"${item.instructions}"</em></div>` : ''}
                            </div>
                            <div class="detail-item-price">₹${item.price * item.quantity}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Delivery Information</h4>
                <div class="detail-row">
                    <span>Name:</span>
                    <strong>${order.contact.name}</strong>
                </div>
                <div class="detail-row">
                    <span>Phone:</span>
                    <strong>${order.contact.phone}</strong>
                </div>
                <div class="detail-row">
                    <span>Address:</span>
                    <strong>${order.delivery.hostel}, Room ${order.delivery.roomNumber}</strong>
                </div>
                ${order.delivery.instructions ? `
                    <div class="detail-row">
                        <span>Instructions:</span>
                        <strong>${order.delivery.instructions}</strong>
                    </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <h4>Payment Information</h4>
                <div class="detail-row">
                    <span>Payment Method:</span>
                    <strong>${order.payment.method.toUpperCase()}</strong>
                </div>
                ${order.payment.transactionId ? `
                    <div class="detail-row">
                        <span>Transaction ID:</span>
                        <strong>${order.payment.transactionId}</strong>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span>Subtotal:</span>
                    <strong>₹${order.pricing.subtotal}</strong>
                </div>
                <div class="detail-row">
                    <span>Delivery Fee:</span>
                    <strong>₹${order.pricing.deliveryFee}</strong>
                </div>
                <div class="detail-row">
                    <span>Tax:</span>
                    <strong>₹${order.pricing.tax}</strong>
                </div>
                <div class="detail-row total">
                    <span>Total Amount:</span>
                    <strong>₹${order.pricing.total}</strong>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
};

window.closeOrderDetailsModal = function() {
    document.getElementById('orderDetailsModal').style.display = 'none';
};

window.reorderItems = function(orderId) {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Clear current cart
    cartManager.clearCart();
    
    // Add all items from the order to cart
    order.items.forEach(item => {
        cartManager.addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            instructions: item.instructions || ''
        });
    });
    
    // Show success message and redirect to cart
    alert(`${order.items.length} items added to cart from your previous order!`);
    window.location.href = 'cart.html';
};

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('orderDetailsModal');
    if (e.target === modal) {
        closeOrderDetailsModal();
    }
});

// Update cart count on page load
cartManager.updateCartUI();