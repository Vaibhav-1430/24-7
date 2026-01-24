// Orders Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Orders page loading...');
    
    // Wait for managers to be ready
    setTimeout(initializeOrdersPage, 1000);
});

function initializeOrdersPage() {
    console.log('📋 Initializing orders page...');
    
    // Check if managers are ready
    if (!window.authManagerClean || !window.apiClient) {
        console.log('⏳ Managers not ready, retrying...');
        setTimeout(initializeOrdersPage, 500);
        return;
    }
    
    // Check if user is logged in
    if (!authManagerClean.isLoggedIn()) {
        showLoginRequired();
        return;
    }

    // Initialize orders page
    showOrdersPage();
    setupEventListeners();
    loadUserOrders();
}

function showLoginRequired() {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('orderFilters').style.display = 'none';
    document.getElementById('ordersList').style.display = 'none';
    document.getElementById('noOrders').style.display = 'none';
}

function showOrdersPage() {
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

async function loadUserOrders() {
    try {
        console.log('📋 Loading user orders...');
        
        // Show loading state
        document.getElementById('ordersList').innerHTML = '<div class="loading">Loading orders...</div>';
        
        // Get orders from API
        const orders = await apiClient.getOrders();
        console.log('📋 Received orders:', orders);
        
        if (!orders || orders.length === 0) {
            showNoOrders();
        } else {
            displayOrders(orders);
        }
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showNoOrders();
    }
}

function filterUserOrders(status) {
    console.log('🔍 Filtering orders by status:', status);
    loadUserOrders(); // For now, just reload all orders
}

function showNoOrders() {
    document.getElementById('ordersList').style.display = 'none';
    document.getElementById('noOrders').style.display = 'flex';
}

function displayOrders(orders) {
    console.log('📋 Displaying', orders.length, 'orders');
    
    document.getElementById('noOrders').style.display = 'none';
    document.getElementById('ordersList').style.display = 'block';
    
    const ordersList = document.getElementById('ordersList');
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card" data-status="${order.status}">
            <div class="order-header">
                <div class="order-number">
                    <h3>Order #${order.orderNumber}</h3>
                    <span class="order-status status-${order.status}">${formatStatus(order.status)}</span>
                </div>
                <div class="order-time">
                    <span>${formatTime(order.orderTime)}</span>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">x${item.quantity}</span>
                        <span class="item-price">₹${item.price * item.quantity}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-summary">
                <div class="order-info">
                    <p><strong>Delivery:</strong> ${order.delivery.hostel}, Room ${order.delivery.roomNumber}</p>
                    <p><strong>Payment:</strong> ${order.payment.method.toUpperCase()}</p>
                </div>
                <div class="order-pricing">
                    <div class="summary-row">
                        <span>Items (${order.items.length})</span>
                        <span>₹${order.pricing.subtotal}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery</span>
                        <span>₹${order.pricing.deliveryFee}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>₹${order.pricing.total}</span>
                    </div>
                </div>
            </div>
            
            <div class="order-actions">
                <button class="view-details-btn" onclick="showOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                ${order.status === 'pending' ? `
                    <button class="cancel-order-btn" onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancel Order
                    </button>
                ` : ''}
                <button class="reorder-btn" onclick="reorderItems('${order.id}')">
                    <i class="fas fa-redo"></i>
                    Reorder
                </button>
            </div>
        </div>
    `).join('');
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Order Placed',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'ready': 'Ready for Pickup',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global functions
window.showOrderDetails = function(orderId) {
    console.log('👁️ Showing details for order:', orderId);
    
    // Find the order from the current displayed orders
    const orderCards = document.querySelectorAll('.order-card');
    let orderData = null;
    
    // For now, show a simple alert with order ID
    // In a real implementation, you'd fetch full order details
    alert(`Order Details\n\nOrder ID: ${orderId}\n\nFull order details will be available soon!`);
};

window.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        console.log('❌ Cancelling order:', orderId);
        // For now, just show a message
        alert('Order cancellation feature will be available soon!');
        // await apiClient.cancelOrder(orderId);
        // loadUserOrders(); // Reload orders
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        alert('Failed to cancel order. Please try again.');
    }
};

window.reorderItems = function(orderId) {
    console.log('🔄 Reordering items from order:', orderId);
    alert('Reorder feature will be available soon!\n\nFor now, please add items manually from the menu.');
    window.location.href = 'menu.html';
};

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('orderDetailsModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Refresh orders every 30 seconds
setInterval(() => {
    if (authManagerClean && authManagerClean.isLoggedIn()) {
        console.log('🔄 Auto-refreshing orders...');
        loadUserOrders();
    }
}, 30000);