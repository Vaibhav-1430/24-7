// Admin Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication (simplified for demo)
    checkAdminAuth();
    
    // Initialize admin dashboard
    initializeAdmin();
    setupEventListeners();
    loadDashboardData();
});

function checkAdminAuth() {
    // Check if user is logged in and has admin privileges
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const token = localStorage.getItem('authToken');
    
    if (!currentUser || !token) {
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
                loadMenuItems();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

function initializeAdmin() {
    // Initialize sample data if not exists
    if (!localStorage.getItem('adminMenuItems')) {
        localStorage.setItem('adminMenuItems', JSON.stringify(SAMPLE_MENU_ITEMS));
    }
}

function loadDashboardData() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
    
    // Calculate today's stats
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
        new Date(order.orderTime).toDateString() === today
    );
    
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.pricing.total, 0);
    const pendingOrders = orders.filter(order => 
        order.status === 'received' || order.status === 'preparing'
    ).length;
    
    // Update stats
    document.getElementById('todayOrders').textContent = todayOrders.length;
    document.getElementById('todayRevenue').textContent = `₹${todayRevenue}`;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('menuItems').textContent = menuItems.length;
    
    // Load recent orders
    loadRecentOrders(orders.slice(0, 5));
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
                <h4>Order #${order.id}</h4>
                <p>${order.contact.name} - ${order.delivery.hostel} ${order.delivery.roomNumber}</p>
                <p>₹${order.pricing.total} - ${formatTime(order.orderTime)}</p>
            </div>
            <div class="order-status status-${order.status}">${order.status}</div>
        </div>
    `).join('');
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    displayOrders(orders);
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
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-time">${formatDateTime(order.orderTime)}</div>
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
                </div>
                <div class="order-actions">
                    <h4>Update Status</h4>
                    <select class="status-select" data-order-id="${order.id}">
                        <option value="received" ${order.status === 'received' ? 'selected' : ''}>Order Received</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Delivery</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <button class="update-status-btn" onclick="updateOrderStatus('${order.id}')">
                        Update Status
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    displayOrders(filteredOrders);
}

function updateOrderStatus(orderId) {
    const statusSelect = document.querySelector(`[data-order-id="${orderId}"]`);
    const newStatus = statusSelect.value;
    
    // Update order in localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Refresh orders display
        loadOrders();
        loadDashboardData();
        
        alert(`Order #${orderId} status updated to: ${newStatus}`);
    }
}

function loadMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
    const menuItemsGrid = document.getElementById('menuItemsGrid');
    
    menuItemsGrid.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
                <button class="availability-toggle" onclick="toggleAvailability(${item.id})">
                    ${item.available ? 'Available' : 'Unavailable'}
                </button>
            </div>
            <div class="menu-item-content">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-footer">
                    <div class="menu-item-price">₹${item.price}</div>
                    <div class="menu-item-actions">
                        <button class="edit-btn" onclick="editMenuItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteMenuItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Calculate popular items
    const itemCounts = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    
    const popularItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const popularItemsList = document.getElementById('popularItemsList');
    popularItemsList.innerHTML = popularItems.map(([name, count]) => `
        <div class="popular-item">
            <span class="popular-item-name">${name}</span>
            <span class="popular-item-count">${count}</span>
        </div>
    `).join('');
}

// Modal Functions
let editingItemId = null;

function openAddItemModal() {
    editingItemId = null;
    document.getElementById('modalTitle').textContent = 'Add New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').style.display = 'block';
}

function editMenuItem(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
    const item = menuItems.find(item => item.id === itemId);
    
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
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
    editingItemId = null;
}

function handleItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
    
    const itemData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseInt(formData.get('price')),
        category: formData.get('category'),
        image: formData.get('image') || 'images/placeholder.jpg',
        available: formData.get('available') === 'on',
        popular: formData.get('popular') === 'on'
    };
    
    if (editingItemId) {
        // Update existing item
        const itemIndex = menuItems.findIndex(item => item.id === editingItemId);
        if (itemIndex !== -1) {
            menuItems[itemIndex] = { ...menuItems[itemIndex], ...itemData };
        }
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            ...itemData
        };
        menuItems.push(newItem);
    }
    
    // Save to localStorage
    localStorage.setItem('adminMenuItems', JSON.stringify(menuItems));
    
    // Update main menu items for customer view
    window.SAMPLE_MENU_ITEMS = menuItems;
    
    // Refresh display
    loadMenuItems();
    loadDashboardData();
    closeItemModal();
    
    alert(editingItemId ? 'Menu item updated successfully!' : 'New menu item added successfully!');
}

function toggleAvailability(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex].available = !menuItems[itemIndex].available;
        localStorage.setItem('adminMenuItems', JSON.stringify(menuItems));
        
        // Update main menu items
        window.SAMPLE_MENU_ITEMS = menuItems;
        
        loadMenuItems();
        alert(`Item ${menuItems[itemIndex].available ? 'enabled' : 'disabled'} successfully!`);
    }
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        const menuItems = JSON.parse(localStorage.getItem('adminMenuItems') || '[]');
        const filteredItems = menuItems.filter(item => item.id !== itemId);
        
        localStorage.setItem('adminMenuItems', JSON.stringify(filteredItems));
        
        // Update main menu items
        window.SAMPLE_MENU_ITEMS = filteredItems;
        
        loadMenuItems();
        loadDashboardData();
        alert('Menu item deleted successfully!');
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

window.adminLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        // Use the auth manager to logout properly
        if (window.authManager) {
            window.authManager.logout();
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