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
        
        // Get orders from API
        const orders = await apiClient.getOrders();
        
        if (orders.length === 0) {
            showNoOrders();
        } else {
            displayOrders(orders);
        }
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showNoOrders();
    }
}
        showLoginRequired();
        return;
    }

    console.log('📋 Loading orders for user:', window.firebaseAuth.currentUser.email);

    // Query user's orders from Firestore
    window.firebaseDB.collection('orders')
        .where('userId', '==', window.firebaseAuth.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((querySnapshot) => {
            const userOrders = [];
            querySnapshot.forEach((doc) => {
                userOrders.push({
                    firestoreId: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('📋 Found', userOrders.length, 'orders');
            
            if (userOrders.length === 0) {
                showNoOrders();
                return;
            }
            
            displayOrders(userOrders);
        }, (error) => {
            console.error('❌ Error loading orders:', error);
            showNoOrders();
        });
}

function filterUserOrders(status) {
    // Wait for Firebase to be ready
    if (!window.firebaseAuth || !window.firebaseDB) {
        console.log('⏳ Waiting for Firebase to load...');
        setTimeout(() => filterUserOrders(status), 1000);
        return;
    }

    if (!window.firebaseAuth.currentUser) {
        showLoginRequired();
        return;
    }

    let query = window.firebaseDB.collection('orders')
        .where('userId', '==', window.firebaseAuth.currentUser.uid)
        .orderBy('createdAt', 'desc');
    
    if (status !== 'all') {
        query = query.where('status', '==', status);
    }
    
    query.get().then((querySnapshot) => {
        const userOrders = [];
        querySnapshot.forEach((doc) => {
            userOrders.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });
        
        if (userOrders.length === 0) {
            showNoOrdersForFilter();
            return;
        }
        
        displayOrders(userOrders);
    }).catch((error) => {
        console.error('❌ Error filtering orders:', error);
        showNoOrdersForFilter();
    });
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
    // Wait for Firebase to be ready
    if (!window.firebaseDB) {
        console.log('⏳ Waiting for Firebase to load...');
        setTimeout(() => showOrderDetails(orderId), 1000);
        return;
    }

    // Find order by firestoreId or regular id
    window.firebaseDB.collection('orders').doc(orderId).get()
        .then((doc) => {
            if (!doc.exists) {
                console.error('❌ Order not found:', orderId);
                return;
            }
            
            const order = { firestoreId: doc.id, ...doc.data() };
            showOrderDetailsModal(order);
        })
        .catch((error) => {
            console.error('❌ Error fetching order details:', error);
        });
};

function showOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const title = document.getElementById('orderDetailsTitle');
    const body = document.getElementById('orderDetailsBody');
    
    title.textContent = `Order #${order.id}`;
    
    // Convert Firestore timestamp to JavaScript Date
    const orderTime = order.createdAt ? order.createdAt.toDate() : new Date(order.orderTime);
    const estimatedDelivery = order.estimatedDelivery ? 
        (order.estimatedDelivery.toDate ? order.estimatedDelivery.toDate() : new Date(order.estimatedDelivery)) : null;
    
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
                    <strong>${formatDateTime(orderTime.toISOString())}</strong>
                </div>
                <div class="detail-row">
                    <span>Status:</span>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                ${estimatedDelivery ? `
                    <div class="detail-row">
                        <span>Estimated Delivery:</span>
                        <strong>${estimatedDelivery.toLocaleTimeString('en-US', {
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
}

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

function showNoOrders() {
    document.getElementById('ordersList').innerHTML = '';
    document.getElementById('noOrders').style.display = 'flex';
}

function displayOrders(orders) {
    document.getElementById('noOrders').style.display = 'none';
    
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card" data-status="${order.status}">
            <div class="order-header">
                <div class="order-id">Order #${order.orderId || order.id}</div>
                <div class="order-status status-${order.status}">${formatOrderStatus(order.status)}</div>
            </div>
            <div class="order-details">
                <div class="order-date">${formatDate(order.createdAt)}</div>
                <div class="order-items">${order.items.length} item${order.items.length > 1 ? 's' : ''}</div>
                <div class="order-total">₹${order.total}</div>
            </div>
            <div class="order-actions">
                <button class="view-details-btn" onclick="showOrderDetails('${order.id}')">
                    View Details
                </button>
                ${order.status === 'received' || order.status === 'preparing' ? 
                    `<button class="cancel-order-btn" onclick="cancelOrder('${order.id}')">Cancel</button>` : 
                    ''
                }
            </div>
        </div>
    `).join('');
}

function filterUserOrders(status) {
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function formatOrderStatus(status) {
    const statusMap = {
        'received': 'Order Received',
        'preparing': 'Preparing',
        'ready': 'Ready for Pickup',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function showOrderDetails(orderId) {
    try {
        const order = await apiClient.getOrder(orderId);
        
        const modalBody = document.getElementById('orderDetailsBody');
        modalBody.innerHTML = `
            <div class="order-info">
                <h4>Order #${order.orderId || order.id}</h4>
                <p><strong>Status:</strong> ${formatOrderStatus(order.status)}</p>
                <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
                <p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
            </div>
            
            <div class="order-items-list">
                <h4>Items Ordered:</h4>
                ${order.items.map(item => `
                    <div class="order-item">
                        <div class="item-details">
                            <span class="item-name">${item.name}</span>
                            <span class="item-quantity">x${item.quantity}</span>
                        </div>
                        <div class="item-price">₹${item.price * item.quantity}</div>
                        ${item.instructions ? `<div class="item-instructions">Note: ${item.instructions}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${order.total}</span>
                </div>
                <div class="summary-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>₹${order.total}</strong></span>
                </div>
            </div>
        `;
        
        document.getElementById('orderDetailsModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        alert('Failed to load order details. Please try again.');
    }
}

function closeOrderDetailsModal() {
    document.getElementById('orderDetailsModal').style.display = 'none';
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        await apiClient.cancelOrder(orderId);
        alert('Order cancelled successfully');
        loadUserOrders(); // Reload orders
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        alert('Failed to cancel order. Please try again.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderDetailsModal');
    if (event.target === modal) {
        closeOrderDetailsModal();
    }
}