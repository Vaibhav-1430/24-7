// Admin Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin dashboard loading...');
    
    // Wait for API client to be ready
    setTimeout(initializeAdminDashboard, 1000);
});

function initializeAdminDashboard() {
    console.log('🔧 Initializing admin dashboard...');
    
    // Check if API client is ready
    if (!window.apiClient) {
        console.log('⏳ API client not ready, retrying...');
        setTimeout(initializeAdminDashboard, 500);
        return;
    }
    
    // Check admin authentication
    checkAdminAuth();
    
    // Initialize admin dashboard
    setupEventListeners();
    loadDashboardData();
}

async function checkAdminAuth() {
    try {
        // Check if user is logged in
        if (!apiClient.isLoggedIn()) {
            alert('Please login first to access admin panel');
            window.location.href = 'login.html';
            return;
        }

        // Get current user and check admin privileges
        const currentUser = await apiClient.getCurrentUser();
        
        if (!currentUser) {
            alert('Please login first to access admin panel');
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user has admin privileges
        if (!currentUser.isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Admin access granted for:', currentUser.email);
        
    } catch (error) {
        console.error('❌ Admin auth check failed:', error);
        alert('Authentication failed. Please login again.');
        window.location.href = 'login.html';
    }
}

function setupEventListeners() {
    // Sidebar navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Order filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const status = this.dataset.status;
            filterOrders(status);
        });
    });

    // Item form submission
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionName) {
            case 'orders':
                loadOrders();
                break;
            case 'menu':
                loadMenuItems().then(response => {
                    if (response && response.menuItems) {
                        currentMenuItems = response.menuItems;
                    }
                });
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

// Update loadMenuItems to store current items
async function loadMenuItems() {
    try {
        console.log('🍽️ Loading menu items...');
        console.log('🔑 Auth token:', localStorage.getItem('authToken'));
        
        // Test the API endpoint directly
        const response = await apiClient.getAdminMenuItems();
        console.log('📡 API Response:', response);
        
        const menuItems = response?.menuItems || [];
        console.log('🍽️ Menu items received:', menuItems);
        
        currentMenuItems = menuItems; // Store for editing
        displayMenuItems(menuItems);
        return response;
    } catch (error) {
        console.error('❌ Failed to load menu items:', error);
        console.error('❌ Error details:', error.message);
        
        // Check if it's an admin privileges error
        if (error.message.includes('Admin access required') || error.message.includes('403')) {
            const menuItemsGrid = document.getElementById('menuItemsGrid');
            menuItemsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-user-shield" style="font-size: 3rem; margin-bottom: 15px; color: #e74c3c;"></i>
                    <h3 style="color: #333; margin-bottom: 10px;">Admin Access Required</h3>
                    <p>Your account doesn't have admin privileges yet.</p>
                    <p style="font-size: 0.9rem; margin: 15px 0; color: #666;">
                        If your email contains 'admin', we can grant you admin access automatically.
                    </p>
                    <div style="margin-top: 20px;">
                        <button onclick="requestAdminAccess()" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-crown"></i> Request Admin Access
                        </button>
                        <button onclick="loadMenuItems()" style="background: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-refresh"></i> Try Again
                        </button>
                    </div>
                    <p style="font-size: 0.8rem; margin-top: 15px; color: #999;">
                        If you don't have an admin email, create a new account with an email containing 'admin'
                    </p>
                </div>
            `;
        } else {
            const menuItemsGrid = document.getElementById('menuItemsGrid');
            menuItemsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; color: #f39c12;"></i>
                    <h3 style="color: #333; margin-bottom: 10px;">Unable to Load Menu Items</h3>
                    <p>Error: ${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 15px; color: #999;">
                        This might be a temporary issue. Please try refreshing the page.
                    </p>
                    <button onclick="loadMenuItems()" style="margin-top: 15px; background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            `;
        }
        return null;
    }
}

async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load analytics data from API
        const analyticsResponse = await apiClient.getAdminAnalytics(30);
        const analytics = analyticsResponse.analytics;
        
        console.log('📊 Analytics data:', analytics);
        
        // Update dashboard stats with fallback values
        document.getElementById('todayOrders').textContent = analytics?.dashboard?.todayOrders || 0;
        document.getElementById('todayRevenue').textContent = `₹${analytics?.dashboard?.todayRevenue || 0}`;
        document.getElementById('pendingOrders').textContent = analytics?.dashboard?.pendingOrders || 0;
        document.getElementById('menuItems').textContent = analytics?.dashboard?.totalMenuItems || 0;
        
        // Load recent orders
        try {
            const ordersResponse = await apiClient.getAdminOrders();
            const recentOrders = ordersResponse?.orders?.slice(0, 5) || [];
            loadRecentOrders(recentOrders);
        } catch (orderError) {
            console.error('❌ Failed to load recent orders:', orderError);
            const recentOrdersContainer = document.getElementById('recentOrders');
            recentOrdersContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recent orders available</p>';
        }
        
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
        
        // Show fallback data instead of error
        document.getElementById('todayOrders').textContent = '0';
        document.getElementById('todayRevenue').textContent = '₹0';
        document.getElementById('pendingOrders').textContent = '0';
        document.getElementById('menuItems').textContent = '0';
        
        const recentOrdersContainer = document.getElementById('recentOrders');
        recentOrdersContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; color: #3498db;"></i>
                <p>Dashboard data will appear here once you have orders and menu items.</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">
                    <strong>Getting started:</strong><br>
                    1. Add menu items in the Menu Management section<br>
                    2. Orders will appear here as customers place them
                </p>
            </div>
        `;
    }
}

function loadRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        recentOrdersContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recent orders</p>';
        return;
    }
    
    recentOrdersContainer.innerHTML = orders.map(order => `
        <div class="recent-order">
            <div class="order-info">
                <h4>Order #${order.orderNumber || order.id}</h4>
                <p>${order.contact.name} - ${order.delivery.hostel} ${order.delivery.roomNumber}</p>
                <p>₹${order.pricing.total} - ${formatTime(order.createdAt || order.orderTime)}</p>
            </div>
            <div class="order-status status-${order.status}">${order.status}</div>
        </div>
    `).join('');
}

async function loadOrders() {
    try {
        console.log('📋 Loading orders...');
        const response = await apiClient.getAdminOrders();
        const orders = response?.orders || [];
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Failed to load orders:', error);
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 15px; color: #3498db;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">No Orders Yet</h3>
                <p>Orders will appear here when customers start placing them.</p>
                <p style="font-size: 0.9rem; margin-top: 15px; color: #999;">
                    Make sure your menu items are available for customers to order.
                </p>
            </div>
        `;
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No orders found</p>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.orderNumber || order.id}</div>
                    <div class="order-time">${formatDateTime(order.createdAt || order.orderTime)}</div>
                </div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-body">
                <div class="order-items">
                    <h4>Items (${order.items.length})</h4>
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>₹${item.price * item.quantity}</span>
                        </div>
                    `).join('')}
                    <div class="order-item" style="font-weight: 600; border-top: 2px solid #e0e0e0; margin-top: 10px; padding-top: 10px;">
                        <span>Total</span>
                        <span>₹${order.pricing.total}</span>
                    </div>
                </div>
                <div class="order-delivery">
                    <h4>Delivery</h4>
                    <p><strong>Name:</strong> ${order.contact.name}</p>
                    <p><strong>Phone:</strong> ${order.contact.phone}</p>
                    <p><strong>Address:</strong> ${order.delivery.hostel}, Room ${order.delivery.roomNumber}</p>
                    ${order.delivery.instructions ? `<p><strong>Instructions:</strong> ${order.delivery.instructions}</p>` : ''}
                    <p><strong>Payment:</strong> ${order.payment.method.toUpperCase()}</p>
                    ${order.payment.transactionId ? `<p><strong>Transaction ID:</strong> ${order.payment.transactionId}</p>` : ''}
                </div>
                <div class="order-actions">
                    <h4>Update Status</h4>
                    <select class="status-select" data-order-id="${order.orderNumber || order.id}">
                        <option value="received" ${order.status === 'received' ? 'selected' : ''}>Order Received</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Delivery</option>
                        <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <textarea class="admin-notes" placeholder="Add notes (optional)..." data-order-id="${order.orderNumber || order.id}"></textarea>
                    <button class="update-status-btn" onclick="updateOrderStatus('${order.orderNumber || order.id}')">
                        Update Status
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function filterOrders(status) {
    try {
        console.log('🔍 Filtering orders by status:', status);
        const response = await apiClient.getAdminOrders(status);
        const orders = response.orders || [];
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Failed to filter orders:', error);
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Failed to load orders. Please try again.</p>';
    }
}

async function updateOrderStatus(orderId) {
    try {
        const statusSelect = document.querySelector(`[data-order-id="${orderId}"]`);
        const notesTextarea = document.querySelector(`.admin-notes[data-order-id="${orderId}"]`);
        const newStatus = statusSelect.value;
        const notes = notesTextarea ? notesTextarea.value.trim() : '';
        
        console.log('🔄 Updating order status:', orderId, newStatus, notes);
        
        // Show loading state
        const updateBtn = statusSelect.parentNode.querySelector('.update-status-btn');
        const originalText = updateBtn.textContent;
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';
        
        await apiClient.updateOrderStatus(orderId, newStatus, notes);
        
        // Refresh orders display
        await loadOrders();
        await loadDashboardData();
        
        alert(`Order #${orderId} status updated to: ${newStatus}`);
        
    } catch (error) {
        console.error('❌ Failed to update order status:', error);
        alert('Failed to update order status. Please try again.');
        
        // Reset button state
        const updateBtn = document.querySelector(`[data-order-id="${orderId}"]`).parentNode.querySelector('.update-status-btn');
        updateBtn.disabled = false;
        updateBtn.textContent = 'Update Status';
    }
}

async function loadMenuItems() {
    try {
        console.log('🍽️ Loading menu items...');
        const response = await apiClient.getAdminMenuItems();
        const menuItems = response.menuItems || [];
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('❌ Failed to load menu items:', error);
        const menuItemsGrid = document.getElementById('menuItemsGrid');
        menuItemsGrid.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Failed to load menu items. Please try again.</p>';
    }
}

function displayMenuItems(menuItems) {
    const menuItemsGrid = document.getElementById('menuItemsGrid');
    
    if (menuItems.length === 0) {
        menuItemsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 15px; color: #e74c3c;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">No Menu Items Yet</h3>
                <p>Start by adding your first menu item using the "Add New Item" button above.</p>
                <button onclick="openAddItemModal()" style="margin-top: 15px; background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Add Your First Item
                </button>
            </div>
        `;
        return;
    }
    
    menuItemsGrid.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image || 'images/default-food.jpg'}" alt="${item.name}" onerror="this.src='images/default-food.jpg'">
                <button class="availability-toggle ${item.available ? 'available' : 'unavailable'}" onclick="toggleAvailability('${item.id}')">
                    ${item.available ? 'Available' : 'Unavailable'}
                </button>
            </div>
            <div class="menu-item-content">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-pricing">
                    <div class="menu-item-price">₹${item.price}</div>
                    ${item.halfPrice ? `<div class="menu-item-half-price">Half: ₹${item.halfPrice}</div>` : ''}
                </div>
                <div class="menu-item-footer">
                    <div class="menu-item-badges">
                        ${item.isVeg ? '<span class="veg-badge">🟢 Veg</span>' : '<span class="non-veg-badge">🔴 Non-Veg</span>'}
                        ${item.popular ? '<span class="popular-badge">⭐ Popular</span>' : ''}
                    </div>
                    <div class="menu-item-actions">
                        <button class="edit-btn" onclick="editMenuItem('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadAnalytics() {
    try {
        console.log('📈 Loading analytics...');
        const response = await apiClient.getAdminAnalytics(30);
        const analytics = response?.analytics;
        
        // Display popular items
        const popularItemsList = document.getElementById('popularItemsList');
        if (analytics?.popularItems && analytics.popularItems.length > 0) {
            popularItemsList.innerHTML = analytics.popularItems.map(item => `
                <div class="popular-item">
                    <span class="popular-item-name">${item._id}</span>
                    <span class="popular-item-count">${item.totalQuantity}</span>
                </div>
            `).join('');
        } else {
            popularItemsList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; color: #3498db;"></i>
                    <p>Popular items will appear here once you have orders.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Failed to load analytics:', error);
        const popularItemsList = document.getElementById('popularItemsList');
        popularItemsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; color: #3498db;"></i>
                <p>Analytics data will appear here once you have orders and menu items.</p>
            </div>
        `;
    }
}

// Modal Functions
let editingItemId = null;
let currentMenuItems = [];

function openAddItemModal() {
    editingItemId = null;
    document.getElementById('modalTitle').textContent = 'Add New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').style.display = 'block';
}

async function editMenuItem(itemId) {
    try {
        // Find item in current menu items
        const item = currentMenuItems.find(item => item.id === itemId);
        
        if (item) {
            editingItemId = itemId;
            document.getElementById('modalTitle').textContent = 'Edit Menu Item';
            
            // Populate form
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemDescription').value = item.description;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemImage').value = item.image || '';
            document.getElementById('itemAvailable').checked = item.available;
            document.getElementById('itemPopular').checked = item.popular || false;
            
            document.getElementById('itemModal').style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Failed to edit menu item:', error);
        alert('Failed to load menu item details');
    }
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
    editingItemId = null;
}

async function handleItemSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        
        const itemData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseInt(formData.get('price')),
            category: formData.get('category'),
            image: formData.get('image') || 'images/placeholder.jpg',
            available: formData.get('available') === 'on',
            popular: formData.get('popular') === 'on'
        };
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = editingItemId ? 'Updating...' : 'Adding...';
        
        if (editingItemId) {
            // Update existing item
            await apiClient.updateMenuItem(editingItemId, itemData);
            alert('Menu item updated successfully!');
        } else {
            // Add new item
            await apiClient.addMenuItem(itemData);
            alert('New menu item added successfully!');
        }
        
        // Refresh display
        await loadMenuItems();
        await loadDashboardData();
        closeItemModal();
        
    } catch (error) {
        console.error('❌ Failed to save menu item:', error);
        alert('Failed to save menu item: ' + error.message);
        
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = editingItemId ? 'Save Changes' : 'Add Item';
    }
}

async function toggleAvailability(itemId) {
    try {
        // Find current item
        const item = currentMenuItems.find(item => item.id === itemId);
        if (!item) return;
        
        const newAvailability = !item.available;
        
        await apiClient.updateMenuItem(itemId, { available: newAvailability });
        
        // Refresh display
        await loadMenuItems();
        
        alert(`Item ${newAvailability ? 'enabled' : 'disabled'} successfully!`);
        
    } catch (error) {
        console.error('❌ Failed to toggle availability:', error);
        alert('Failed to update item availability');
    }
}

async function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        try {
            await apiClient.deleteMenuItem(itemId);
            
            // Refresh display
            await loadMenuItems();
            await loadDashboardData();
            
            alert('Menu item deleted successfully!');
            
        } catch (error) {
            console.error('❌ Failed to delete menu item:', error);
            alert('Failed to delete menu item: ' + error.message);
        }
    }
}

// Utility Functions
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Global functions
window.updateOrderStatus = updateOrderStatus;
window.openAddItemModal = openAddItemModal;
window.editMenuItem = editMenuItem;
window.closeItemModal = closeItemModal;
window.toggleAvailability = toggleAvailability;
window.deleteMenuItem = deleteMenuItem;

// Test function for debugging
window.testAdminConnection = async function() {
    try {
        console.log('🧪 Testing admin connection...');
        const testResult = await apiClient.testAdminEndpoint();
        console.log('🧪 Test result:', testResult);
        
        alert(`Admin Test Results:
MongoDB Connected: ${testResult.mongodbConnected}
Has Auth Header: ${testResult.hasAuthHeader}
Token Length: ${testResult.tokenLength}
Timestamp: ${testResult.timestamp}`);
        
    } catch (error) {
        console.error('🧪 Test failed:', error);
        alert(`Admin Test Failed: ${error.message}`);
    }
};

// Request admin access function
window.requestAdminAccess = async function() {
    try {
        console.log('👑 Requesting admin access...');
        
        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
        
        const result = await apiClient.grantAdminPrivileges();
        console.log('👑 Admin access result:', result);
        
        alert(`✅ ${result.message}`);
        
        // Reload the page to refresh admin status
        window.location.reload();
        
    } catch (error) {
        console.error('👑 Admin access request failed:', error);
        alert(`❌ Failed to grant admin access: ${error.message}`);
        
        // Reset button
        const button = event.target;
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-crown"></i> Request Admin Access';
    }
};

window.adminLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        // Use the auth manager to logout properly
        if (window.authManagerClean) {
            window.authManagerClean.logout();
        } else if (window.apiClient) {
            window.apiClient.logout();
            window.location.href = 'index.html';
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }
};

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('itemModal');
    if (e.target === modal) {
        closeItemModal();
    }
});