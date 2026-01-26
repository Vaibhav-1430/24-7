// Admin Dashboard Functionality
let lastOrderCount = 0; // Track the number of orders to detect new ones
let notificationSound = null; // Audio object for notification sound

// Enhanced checkForNewOrders with settings
function checkForNewOrders(orders) {
    try {
        const currentOrderCount = orders.length;
        
        console.log('🔔 Checking for new orders:', {
            previousCount: lastOrderCount,
            currentCount: currentOrderCount,
            isNewOrder: lastOrderCount > 0 && currentOrderCount > lastOrderCount
        });
        
        // Only check for new orders after the first load (avoid notification on page load)
        if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
            const newOrdersCount = currentOrderCount - lastOrderCount;
            console.log(`🔔 ${newOrdersCount} new order(s) detected!`);
            
            // Check if sound is enabled
            const soundEnabled = localStorage.getItem('adminSoundEnabled') !== 'false';
            console.log('🔔 Sound enabled:', soundEnabled);
            
            if (soundEnabled && window.playNotificationSound) {
                console.log('🔔 Playing notification sound...');
                window.playNotificationSound();
            }
            
            // Check if browser notifications are enabled
            const browserNotificationsEnabled = localStorage.getItem('adminBrowserNotificationsEnabled') !== 'false';
            console.log('🔔 Browser notifications enabled:', browserNotificationsEnabled);
            
            if (browserNotificationsEnabled) {
                showBrowserNotification(newOrdersCount, orders);
            }
            
            // Flash the page title to get attention
            flashPageTitle();
        }
        
        // Update the last order count
        lastOrderCount = currentOrderCount;
        
    } catch (error) {
        console.error('❌ Error checking for new orders:', error);
    }
}

function showBrowserNotification(newOrdersCount, orders) {
    try {
        console.log('🔔 Attempting to show browser notification...');
        
        // Request notification permission if not already granted
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('🔔 Notification permission:', permission);
                if (permission === 'granted') {
                    showNotification(newOrdersCount, orders);
                }
            });
        } else if (Notification.permission === 'granted') {
            showNotification(newOrdersCount, orders);
        } else {
            console.log('🔔 Notification permission denied');
        }
    } catch (error) {
        console.error('❌ Browser notification error:', error);
    }
}

function showNotification(newOrdersCount, orders) {
    try {
        const latestOrder = orders[0]; // Assuming orders are sorted by newest first
        const title = `🍽️ New Order Alert!`;
        const body = newOrdersCount === 1 
            ? `New order #${latestOrder.orderNumber || latestOrder.id} received`
            : `${newOrdersCount} new orders received`;
        
        console.log('🔔 Creating notification:', { title, body });
        
        const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'new-order',
            requireInteraction: true
        });
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        // Focus window when notification is clicked
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        console.log('🔔 Browser notification shown');
    } catch (error) {
        console.error('❌ Failed to show browser notification:', error);
    }
}

function flashPageTitle() {
    try {
        console.log('🔔 Flashing page title...');
        const originalTitle = document.title;
        let flashCount = 0;
        const maxFlashes = 6;
        
        const flashInterval = setInterval(() => {
            document.title = flashCount % 2 === 0 ? '🔔 NEW ORDER!' : originalTitle;
            flashCount++;
            
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);
                document.title = originalTitle;
            }
        }, 500);
        
        console.log('🔔 Page title flashing started');
    } catch (error) {
        console.error('❌ Failed to flash page title:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin dashboard loading...');
    
    // Initialize notification sound
    initializeNotificationSound();
    
    // Wait for API client to be ready
    setTimeout(initializeAdminDashboard, 1000);
});

function initializeNotificationSound() {
    try {
        console.log('🔔 Initializing notification sound system...');
        
        // Create audio context
        let audioContext = null;
        
        // Create a simple notification sound function
        window.playNotificationSound = function() {
            try {
                console.log('🔔 Attempting to play notification sound...');
                
                // Initialize audio context on first use (requires user interaction)
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('🔔 Audio context created:', audioContext.state);
                }
                
                // Resume audio context if suspended
                if (audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('🔔 Audio context resumed');
                        playBeepSound(audioContext);
                    });
                } else {
                    playBeepSound(audioContext);
                }
                
            } catch (error) {
                console.error('❌ Failed to play notification sound:', error);
                // Fallback: try to use a simple beep
                try {
                    console.log('🔔 Trying fallback beep...');
                    // Create a simple audio element as fallback
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                    audio.play().catch(e => console.log('🔔 Fallback audio failed:', e));
                } catch (fallbackError) {
                    console.error('❌ Fallback sound failed:', fallbackError);
                }
            }
        };
        
        function playBeepSound(ctx) {
            console.log('🔔 Playing beep sound...');
            
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Create a pleasant notification sound
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
            
            console.log('🔔 Notification sound played successfully');
        }
        
        console.log('🔔 Notification sound system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize notification sound:', error);
        // Fallback: use system beep
        window.playNotificationSound = function() {
            console.log('🔔 Using fallback notification (no sound available)');
        };
    }
}

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
    
    // Start automatic order refresh for notifications immediately
    startOrderRefreshTimer();
    
    // Initialize notification status
    setTimeout(() => {
        if (document.getElementById('soundStatus')) {
            updateNotificationStatus();
        }
    }, 1000);
}

function startOrderRefreshTimer() {
    // Refresh orders every 10 seconds to check for new orders
    setInterval(() => {
        // Only refresh if we're on the orders section and the page is visible
        if (document.querySelector('.menu-item[data-section="orders"]').classList.contains('active') && 
            document.visibilityState === 'visible') {
            console.log('🔄 Auto-refreshing orders for new order detection...');
            loadOrders();
        }
    }, 10000); // 10 seconds
    
    console.log('🔄 Order refresh timer started (10 second intervals)');
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
            case 'notifications':
                loadNotificationSettings();
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
        console.log('📡 Response type:', typeof response);
        console.log('📡 Response keys:', Object.keys(response || {}));
        
        const menuItems = response?.menuItems || [];
        console.log('🍽️ Menu items received:', menuItems);
        console.log('🍽️ Menu items count:', menuItems.length);
        console.log('🍽️ First menu item:', menuItems[0]);
        
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
        document.getElementById('deliveredOrders').textContent = analytics?.dashboard?.deliveredOrders || 0;
        document.getElementById('totalRevenue').textContent = `₹${analytics?.dashboard?.totalRevenue || 0}`;
        document.getElementById('totalOrders').textContent = analytics?.dashboard?.totalOrders || 0;
        
        // Load recent orders
        try {
            const ordersResponse = await apiClient.getAdminOrders();
            console.log('📊 Dashboard orders response:', ordersResponse);
            
            const recentOrders = ordersResponse?.orders?.slice(0, 5) || [];
            console.log('📊 Recent orders for dashboard:', recentOrders);
            
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
        document.getElementById('deliveredOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = '₹0';
        document.getElementById('totalOrders').textContent = '0';
        
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
                <p>₹${order.pricing.total} - ${formatTime(order.orderTime || order.createdAt)}</p>
            </div>
            <div class="order-status status-${order.status}">${order.status}</div>
        </div>
    `).join('');
}

async function loadOrders() {
    try {
        console.log('📋 Loading orders...');
        const response = await apiClient.getAdminOrders();
        console.log('📋 Orders response:', response);
        console.log('📋 Orders array:', response?.orders);
        console.log('📋 Orders count:', response?.orders?.length);
        
        const orders = response?.orders || [];
        console.log('📋 Final orders to display:', orders);
        console.log('📋 Previous order count:', lastOrderCount);
        console.log('📋 Current order count:', orders.length);
        
        // Check for new orders and play notification sound
        checkForNewOrders(orders);
        
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Failed to load orders:', error);
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; color: #f39c12;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">Failed to Load Orders</h3>
                <p>Error: ${error.message}</p>
                <p style="font-size: 0.9rem; margin-top: 15px; color: #999;">
                    Check browser console for more details.
                </p>
                <button onclick="loadOrders()" style="margin-top: 15px; background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
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
                    <div class="order-time">${formatDateTime(order.orderTime || order.createdAt)}</div>
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
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Order Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Order Confirmed</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Delivery</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <textarea class="admin-notes" placeholder="Add notes (optional)..." data-order-id="${order.orderNumber || order.id}"></textarea>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="update-status-btn" onclick="updateOrderStatus('${order.orderNumber || order.id}')" style="flex: 1;">
                            Update Status
                        </button>
                        <button class="delete-order-btn" onclick="deleteOrder('${order.orderNumber || order.id}')" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.3s;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function filterOrders(status) {
    try {
        console.log('🔍 Filtering orders by status:', status);
        const response = await apiClient.getAdminOrders(status);
        console.log('🔍 Filtered orders response:', response);
        
        const orders = response?.orders || [];
        console.log('🔍 Filtered orders to display:', orders);
        
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

async function deleteOrder(orderId) {
    // Confirm deletion
    const confirmDelete = confirm(
        `Are you sure you want to delete Order #${orderId}?\n\n` +
        `This action cannot be undone and will permanently remove the order from the system.\n\n` +
        `Click OK to delete or Cancel to keep the order.`
    );
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        console.log('🗑️ Deleting order:', orderId);
        
        // Show loading state
        const deleteBtn = document.querySelector(`button[onclick="deleteOrder('${orderId}')"]`);
        const originalText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        await apiClient.deleteOrder(orderId);
        
        // Refresh orders display
        await loadOrders();
        await loadDashboardData();
        
        alert(`Order #${orderId} has been deleted successfully.`);
        
    } catch (error) {
        console.error('❌ Failed to delete order:', error);
        alert('Failed to delete order. Please try again.');
        
        // Reset button state
        const deleteBtn = document.querySelector(`button[onclick="deleteOrder('${orderId}')"]`);
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
    }
}

async function bulkDeleteCancelledOrders() {
    // Confirm bulk deletion
    const confirmDelete = confirm(
        `Are you sure you want to delete ALL cancelled orders?\n\n` +
        `This will permanently remove all orders with "cancelled" status from the system.\n\n` +
        `This action cannot be undone. Click OK to proceed or Cancel to abort.`
    );
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        console.log('🗑️ Bulk deleting cancelled orders...');
        
        // Get all cancelled orders first
        const response = await apiClient.getAdminOrders('cancelled');
        const cancelledOrders = response?.orders || [];
        
        if (cancelledOrders.length === 0) {
            alert('No cancelled orders found to delete.');
            return;
        }
        
        // Show progress
        const totalOrders = cancelledOrders.length;
        let deletedCount = 0;
        
        // Delete each cancelled order
        for (const order of cancelledOrders) {
            try {
                await apiClient.deleteOrder(order.orderNumber || order.id);
                deletedCount++;
                console.log(`🗑️ Deleted order ${deletedCount}/${totalOrders}: ${order.orderNumber}`);
            } catch (error) {
                console.error(`❌ Failed to delete order ${order.orderNumber}:`, error);
            }
        }
        
        // Refresh orders display
        await loadOrders();
        await loadDashboardData();
        
        alert(`Bulk deletion completed!\n\nDeleted: ${deletedCount} orders\nTotal cancelled orders: ${totalOrders}`);
        
    } catch (error) {
        console.error('❌ Failed to bulk delete cancelled orders:', error);
        alert('Failed to bulk delete cancelled orders. Please try again.');
    }
}

async function loadMenuItems() {
    try {
        console.log('🍽️ Loading menu items...');
        const response = await apiClient.getAdminMenuItems();
        const menuItems = response.menuItems || [];
        
        // Store current menu items for editing
        currentMenuItems = menuItems;
        
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('❌ Failed to load menu items:', error);
        const menuItemsGrid = document.getElementById('menuItemsGrid');
        menuItemsGrid.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Failed to load menu items. Please try again.</p>';
    }
}

function displayMenuItems(menuItems) {
    const menuItemsGrid = document.getElementById('menuItemsGrid');
    
    console.log('🎨 Displaying menu items:', menuItems);
    console.log('🎨 Menu items length:', menuItems?.length);
    
    if (!menuItems || menuItems.length === 0) {
        menuItemsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 15px; color: #e74c3c;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">No Menu Items Yet</h3>
                <p>Start by adding your first menu item using the "Add New Item" button above.</p>
                <button onclick="openAddItemModal()" style="margin-top: 15px; background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Add Your First Item
                </button>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                    <h4 style="color: #333; margin-bottom: 10px;">Troubleshooting:</h4>
                    <p style="font-size: 0.9rem; color: #666; margin: 5px 0;">• Check browser console for errors</p>
                    <p style="font-size: 0.9rem; color: #666; margin: 5px 0;">• Try refreshing the page</p>
                    <p style="font-size: 0.9rem; color: #666; margin: 5px 0;">• Ensure you have admin privileges</p>
                    <button onclick="loadMenuItems()" style="margin-top: 10px; background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-refresh"></i> Reload Menu Items
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    menuItemsGrid.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image">
                <img src="${item.image || 'images/default-food.jpg'}" alt="${item.name}" onerror="this.src='images/default-food.jpg'">
                <div class="item-status-badges">
                    <button class="availability-toggle ${item.available ? 'available' : 'unavailable'}" onclick="toggleAvailability('${item.id}')">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </button>
                    <span class="stock-badge ${item.stockStatus || 'in-stock'}">
                        ${getStockStatusText(item.stockStatus || 'in-stock')}
                    </span>
                </div>
            </div>
            <div class="menu-item-content">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-pricing">
                    <div class="menu-item-price">₹${item.price}</div>
                    ${item.halfPrice ? `<div class="menu-item-half-price">Half: ₹${item.halfPrice}</div>` : ''}
                </div>
                <div class="stock-info">
                    <div class="stock-quantity">
                        <i class="fas fa-boxes"></i>
                        Stock: ${item.stockQuantity || 0}
                        ${(item.stockQuantity || 0) <= (item.lowStockThreshold || 10) ? '<i class="fas fa-exclamation-triangle" style="color: #f39c12; margin-left: 5px;"></i>' : ''}
                    </div>
                    <button class="stock-update-btn" onclick="quickStockUpdate('${item.id}', ${item.stockQuantity || 0})">
                        <i class="fas fa-edit"></i> Update Stock
                    </button>
                </div>
                <div class="menu-item-footer">
                    <div class="menu-item-badges">
                        ${item.isVeg ? '<span class="veg-badge">🟢 Veg</span>' : '<span class="non-veg-badge">🔴 Non-Veg</span>'}
                        ${item.popular ? '<span class="popular-badge">⭐ Popular</span>' : ''}
                        ${!(item.inStock !== false) ? '<span class="out-of-stock-badge">❌ Out of Stock</span>' : ''}
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

// Helper function to get stock status text
function getStockStatusText(status) {
    switch(status) {
        case 'in-stock': return '✅ In Stock';
        case 'low-stock': return '⚠️ Low Stock';
        case 'out-of-stock': return '❌ Out of Stock';
        default: return '✅ In Stock';
    }
}

// Quick stock update function
async function quickStockUpdate(itemId, currentStock) {
    const newStock = prompt(`Update stock quantity for this item:\n\nCurrent stock: ${currentStock}`, currentStock);
    
    if (newStock === null) return; // User cancelled
    
    const stockQuantity = parseInt(newStock);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
        alert('Please enter a valid stock quantity (0 or greater)');
        return;
    }
    
    try {
        console.log('🔄 Updating stock for item:', itemId, 'to quantity:', stockQuantity);
        
        // Determine stock status based on quantity
        let stockStatus = 'in-stock';
        let inStock = true;
        const lowStockThreshold = 10; // Default threshold
        
        if (stockQuantity === 0) {
            stockStatus = 'out-of-stock';
            inStock = false;
        } else if (stockQuantity <= lowStockThreshold) {
            stockStatus = 'low-stock';
            inStock = true;
        }
        
        const updateData = {
            stockQuantity: stockQuantity,
            stockStatus: stockStatus,
            inStock: inStock
        };
        
        console.log('📝 Update data:', updateData);
        
        const response = await apiClient.updateMenuItem(itemId, updateData);
        
        console.log('✅ Update response:', response);
        
        if (response && response.success) {
            alert(`Stock updated successfully!\nNew stock: ${stockQuantity}\nStatus: ${stockStatus}`);
            await loadMenuItems(); // Refresh the display
        } else {
            throw new Error(response?.message || 'Failed to update stock');
        }
        
    } catch (error) {
        console.error('❌ Failed to update stock:', error);
        alert(`Failed to update stock: ${error.message}\nPlease try again.`);
    }
}

// Image Management Functions
let selectedImageUrl = '';

function showImageUploadOptions() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        loadSampleImages();
        console.log('📸 Image upload modal opened');
    }
}

function closeImageUploadModal() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        clearImagePreview();
        console.log('📸 Image upload modal closed');
    }
}

function switchImageTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[onclick="switchImageTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function showImageGallery() {
    showImageUploadOptions();
    setTimeout(() => {
        switchImageTab('gallery');
    }, 100);
}

function previewImageUrl() {
    const url = document.getElementById('imageUrlInput').value.trim();
    if (!url) {
        alert('Please enter an image URL');
        return;
    }
    
    // Test if URL is valid by trying to load it
    const img = new Image();
    img.onload = function() {
        selectedImageUrl = url;
        showImagePreview(url);
    };
    img.onerror = function() {
        alert('Unable to load image from this URL. Please check the URL and try again.');
    };
    img.src = url;
}

function showImagePreview(url) {
    const previewSection = document.getElementById('modalImagePreview');
    const previewImg = document.getElementById('modalPreviewImg');
    
    if (previewSection && previewImg) {
        previewImg.src = url;
        previewSection.style.display = 'block';
    }
}

function clearImagePreview() {
    const previewSection = document.getElementById('modalImagePreview');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
    selectedImageUrl = '';
}

function useSelectedImage() {
    if (selectedImageUrl) {
        // Set the image URL in the main form
        const imageInput = document.getElementById('itemImage');
        if (imageInput) {
            imageInput.value = selectedImageUrl;
            
            // Trigger input event to update preview
            const event = new Event('input', { bubbles: true });
            imageInput.dispatchEvent(event);
        }
        
        // Close modal
        closeImageUploadModal();
    }
}

function removeImagePreview() {
    const preview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('itemImage');
    
    if (preview) preview.style.display = 'none';
    if (imageInput) imageInput.value = '';
}

function loadSampleImages() {
    const sampleImages = [
        {
            name: 'Hakka Noodles',
            url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop'
        },
        {
            name: 'Veg Fried Rice',
            url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop'
        },
        {
            name: 'Chicken Momos',
            url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop'
        },
        {
            name: 'Chicken Roll',
            url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
        },
        {
            name: 'Aloo Paratha',
            url: 'https://images.unsplash.com/photo-1574653853027-5d3ba0c95f5d?w=400&h=300&fit=crop'
        },
        {
            name: 'Cold Drinks',
            url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop'
        },
        {
            name: 'Hot Coffee',
            url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop'
        },
        {
            name: 'Mixed Snacks',
            url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=300&fit=crop'
        }
    ];
    
    const grid = document.getElementById('sampleImagesGrid');
    if (grid) {
        grid.innerHTML = sampleImages.map(img => `
            <div class="sample-image-card" onclick="selectSampleImage('${img.url}')">
                <img src="${img.url}" alt="${img.name}" loading="lazy">
                <div class="sample-image-name">${img.name}</div>
            </div>
        `).join('');
    }
}

function selectSampleImage(url) {
    selectedImageUrl = url;
    showImagePreview(url);
}

// Initialize image preview functionality and file upload
function initializeImagePreview() {
    const imageInput = document.getElementById('itemImage');
    if (imageInput) {
        imageInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url && (url.startsWith('http') || url.startsWith('images/') || url.startsWith('data:'))) {
                const img = new Image();
                img.onload = function() {
                    const preview = document.getElementById('imagePreview');
                    const previewImg = document.getElementById('previewImg');
                    if (preview && previewImg) {
                        previewImg.src = url;
                        preview.style.display = 'block';
                    }
                };
                img.onerror = function() {
                    const preview = document.getElementById('imagePreview');
                    if (preview) {
                        preview.style.display = 'none';
                    }
                };
                img.src = url;
            } else {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.style.display = 'none';
                }
            }
        });
    }
    
    // Initialize file upload functionality
    const fileInput = document.getElementById('imageFileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        // Make upload area clickable
        uploadArea.addEventListener('click', function() {
            if (fileInput) {
                fileInput.click();
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    console.log('📁 Processing file:', file.name, file.type, file.size);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WebP)');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('📸 File loaded successfully');
        selectedImageUrl = e.target.result; // Base64 data URL
        showImagePreview(selectedImageUrl);
    };
    reader.onerror = function() {
        console.error('❌ Failed to read file');
        alert('Failed to read the selected file');
    };
    reader.readAsDataURL(file);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeImagePreview();
    
    // Initialize form submission handler
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }
});

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
    document.getElementById('forceAdd').checked = false; // Reset force add option
    
    // Reset stock management fields to defaults
    document.getElementById('inStock').checked = true;
    document.getElementById('stockQuantity').value = 100;
    document.getElementById('lowStockThreshold').value = 10;
    document.getElementById('stockStatus').value = 'in-stock';
    
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
            
            // Populate stock management fields
            document.getElementById('inStock').checked = item.inStock !== false;
            document.getElementById('stockQuantity').value = item.stockQuantity || 100;
            document.getElementById('lowStockThreshold').value = item.lowStockThreshold || 10;
            document.getElementById('stockStatus').value = item.stockStatus || 'in-stock';
            
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
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = editingItemId ? 'Updating...' : 'Adding...';
        
        const formData = new FormData(e.target);
        
        const itemData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseInt(formData.get('price')),
            category: formData.get('category'),
            image: formData.get('image') || 'images/placeholder.jpg',
            available: formData.get('available') === 'on',
            popular: formData.get('popular') === 'on',
            forceAdd: formData.get('forceAdd') === 'on',
            // Stock Management Fields
            inStock: formData.get('inStock') === 'on',
            stockQuantity: parseInt(formData.get('stockQuantity')) || 100,
            lowStockThreshold: parseInt(formData.get('lowStockThreshold')) || 10,
            stockStatus: formData.get('stockStatus') || 'in-stock'
        };
        
        console.log('📝 Submitting item data:', itemData);
        console.log('🔧 Editing item ID:', editingItemId);
        
        let response;
        if (editingItemId) {
            // Update existing item
            response = await apiClient.updateMenuItem(editingItemId, itemData);
            console.log('✅ Update response:', response);
        } else {
            // Add new item
            response = await apiClient.addMenuItem(itemData);
            console.log('✅ Add response:', response);
        }
        
        if (response && response.success) {
            alert(editingItemId ? 'Menu item updated successfully!' : 'New menu item added successfully!');
            
            // Refresh display
            await loadMenuItems();
            await loadDashboardData();
            closeItemModal();
        } else {
            throw new Error(response?.message || 'Operation failed');
        }
        
    } catch (error) {
        console.error('❌ Failed to save menu item:', error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('already exists')) {
            const useForceAdd = confirm(`${error.message}\n\nWould you like to force add this item anyway?`);
            if (useForceAdd) {
                // Retry with force add enabled
                const forceAddCheckbox = document.getElementById('forceAdd');
                if (forceAddCheckbox) {
                    forceAddCheckbox.checked = true;
                    // Retry submission
                    setTimeout(() => handleItemSubmit(e), 100);
                    return;
                }
            }
        } else {
            alert(`Failed to save menu item: ${error.message}`);
        }
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
window.deleteOrder = deleteOrder;
window.bulkDeleteCancelledOrders = bulkDeleteCancelledOrders;
window.openAddItemModal = openAddItemModal;
window.editMenuItem = editMenuItem;
window.closeItemModal = closeItemModal;
window.toggleAvailability = toggleAvailability;
window.deleteMenuItem = deleteMenuItem;
window.quickStockUpdate = quickStockUpdate;
window.showImageUploadOptions = showImageUploadOptions;
window.closeImageUploadModal = closeImageUploadModal;
window.switchImageTab = switchImageTab;
window.showImageGallery = showImageGallery;
window.previewImageUrl = previewImageUrl;
window.useSelectedImage = useSelectedImage;
window.removeImagePreview = removeImagePreview;
window.selectSampleImage = selectSampleImage;
window.clearImagePreview = clearImagePreview;

// Test function for debugging orders API
window.testOrdersAPI = async function() {
    try {
        console.log('🧪 Testing orders API...');
        
        // Test the actual admin orders endpoint
        const adminResponse = await apiClient.getAdminOrders();
        console.log('🧪 Admin orders result:', adminResponse);
        
        alert(`Orders API Test Results:
        
Admin Endpoint: ${adminResponse?.orders?.length || 0} orders found

Check browser console for detailed logs.`);
        
    } catch (error) {
        console.error('🧪 Orders API test failed:', error);
        alert(`Orders API Test Failed: ${error.message}`);
    }
};

// Test function for debugging dashboard API
window.testDashboardAPI = async function() {
    try {
        console.log('🧪 Testing dashboard API...');
        
        // Test the analytics endpoint
        const analyticsResponse = await apiClient.getAdminAnalytics(30);
        console.log('🧪 Analytics result:', analyticsResponse);
        
        const analytics = analyticsResponse?.analytics;
        console.log('🧪 Dashboard data:', analytics?.dashboard);
        
        alert(`Dashboard API Test Results:
        
Today's Orders: ${analytics?.dashboard?.todayOrders || 0}
Today's Revenue: ₹${analytics?.dashboard?.todayRevenue || 0}
Pending Orders: ${analytics?.dashboard?.pendingOrders || 0}
Menu Items: ${analytics?.dashboard?.totalMenuItems || 0}
Delivered Orders: ${analytics?.dashboard?.deliveredOrders || 0}
Total Revenue: ₹${analytics?.dashboard?.totalRevenue || 0}
Total Orders: ${analytics?.dashboard?.totalOrders || 0}

Check browser console for detailed logs.`);
        
    } catch (error) {
        console.error('🧪 Dashboard API test failed:', error);
        alert(`Dashboard API Test Failed: ${error.message}`);
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
        
        // First get user info
        const userInfo = await apiClient.getUserInfo();
        console.log('👤 User info:', userInfo);
        
        // Grant admin privileges
        const result = await apiClient.makeCurrentUserAdmin();
        console.log('👑 Admin access result:', result);
        
        alert(`✅ ${result.message}\n\nYou now have admin privileges! The page will reload.`);
        
        // Reload the page to refresh admin status
        window.location.reload();
        
    } catch (error) {
        console.error('👑 Admin access request failed:', error);
        alert(`❌ Failed to grant admin access: ${error.message}\n\nPlease try creating a new account with an email containing 'admin'.`);
        
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

// Notification Settings Functions
function loadNotificationSettings() {
    console.log('🔔 Loading notification settings...');
    
    // Load saved settings from localStorage
    const soundEnabled = localStorage.getItem('adminSoundEnabled') !== 'false';
    const browserNotificationsEnabled = localStorage.getItem('adminBrowserNotificationsEnabled') !== 'false';
    const refreshInterval = localStorage.getItem('adminRefreshInterval') || '10';
    
    // Update UI
    document.getElementById('soundEnabled').checked = soundEnabled;
    document.getElementById('browserNotificationsEnabled').checked = browserNotificationsEnabled;
    document.getElementById('refreshInterval').value = refreshInterval;
    
    // Update status indicators
    updateNotificationStatus();
    
    // Setup event listeners for settings
    setupNotificationEventListeners();
}

function setupNotificationEventListeners() {
    // Sound toggle
    document.getElementById('soundEnabled').addEventListener('change', function() {
        localStorage.setItem('adminSoundEnabled', this.checked);
        updateNotificationStatus();
    });
    
    // Browser notifications toggle
    document.getElementById('browserNotificationsEnabled').addEventListener('change', function() {
        localStorage.setItem('adminBrowserNotificationsEnabled', this.checked);
        if (this.checked) {
            requestNotificationPermission();
        }
        updateNotificationStatus();
    });
}

function updateNotificationStatus() {
    // Sound system status
    const soundStatus = document.getElementById('soundStatus');
    if (window.playNotificationSound) {
        soundStatus.textContent = 'Ready';
        soundStatus.className = 'status-value ready';
    } else {
        soundStatus.textContent = 'Error';
        soundStatus.className = 'status-value error';
    }
    
    // Browser notification permission
    const permissionStatus = document.getElementById('notificationPermission');
    if (Notification.permission === 'granted') {
        permissionStatus.textContent = 'Granted';
        permissionStatus.className = 'status-value ready';
    } else if (Notification.permission === 'denied') {
        permissionStatus.textContent = 'Denied';
        permissionStatus.className = 'status-value error';
    } else {
        permissionStatus.textContent = 'Not Requested';
        permissionStatus.className = 'status-value warning';
    }
    
    // Last order check
    const lastCheck = document.getElementById('lastOrderCheck');
    const now = new Date();
    lastCheck.textContent = now.toLocaleTimeString();
    
    // Current order count
    const orderCountEl = document.getElementById('currentOrderCount');
    if (orderCountEl) {
        orderCountEl.textContent = lastOrderCount;
    }
}

function requestNotificationPermission() {
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            updateNotificationStatus();
            if (permission === 'granted') {
                showTestNotification('Permission granted! Notifications are now enabled.');
            }
        });
    }
}

function testNotificationSound() {
    console.log('🔔 Testing notification sound...');
    if (window.playNotificationSound) {
        window.playNotificationSound();
    } else {
        alert('Sound system not available');
    }
}

function testBrowserNotification() {
    console.log('🔔 Testing browser notification...');
    if (Notification.permission === 'granted') {
        showTestNotification('This is a test notification from 24x7 Cafe Admin!');
    } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showTestNotification('Permission granted! This is a test notification.');
            } else {
                alert('Notification permission denied');
            }
            updateNotificationStatus();
        });
    } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
    }
}

function showTestNotification(message) {
    try {
        const notification = new Notification('🍽️ 24x7 Cafe Admin', {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'test-notification'
        });
        
        setTimeout(() => notification.close(), 3000);
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    } catch (error) {
        console.error('❌ Failed to show test notification:', error);
        alert('Failed to show notification: ' + error.message);
    }
}

function updateRefreshInterval() {
    const interval = document.getElementById('refreshInterval').value;
    localStorage.setItem('adminRefreshInterval', interval);
    
    // Restart the refresh timer with new interval
    if (window.orderRefreshTimer) {
        clearInterval(window.orderRefreshTimer);
    }
    
    startOrderRefreshTimer();
    
    alert(`Order refresh interval updated to ${interval} seconds`);
}

// Enhanced order refresh timer with configurable interval
function startOrderRefreshTimer() {
    const interval = parseInt(localStorage.getItem('adminRefreshInterval') || '10') * 1000;
    
    // Clear any existing timer
    if (window.orderRefreshTimer) {
        clearInterval(window.orderRefreshTimer);
    }
    
    window.orderRefreshTimer = setInterval(() => {
        // Always check for new orders when admin portal is open and visible
        const pageVisible = document.visibilityState === 'visible';
        const isAdminPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('admin');
        
        console.log('🔄 Timer check:', { pageVisible, isAdminPage, interval: interval/1000 + 's' });
        
        if (pageVisible && isAdminPage) {
            console.log('🔄 Auto-refreshing orders for new order detection...');
            loadOrders();
            
            // Update notification status if on notifications page
            const notificationsActive = document.querySelector('.menu-item[data-section="notifications"]')?.classList.contains('active');
            if (notificationsActive) {
                updateNotificationStatus();
            }
        }
    }, interval);
    
    console.log(`🔄 Order refresh timer started (${interval/1000} second intervals)`);
    console.log('🔔 Notification system is now active and monitoring for new orders!');
}

// Make functions globally available
window.testNotificationSound = testNotificationSound;
window.testBrowserNotification = testBrowserNotification;
window.updateRefreshInterval = updateRefreshInterval;

// Debug and testing functions
window.simulateNewOrder = function() {
    console.log('🧪 Simulating new order notification...');
    
    try {
        // Create a fake order for testing
        const fakeOrders = [];
        
        // Add existing orders plus one new one
        for (let i = 0; i < lastOrderCount + 1; i++) {
            fakeOrders.push({ 
                id: i === lastOrderCount ? 'test-' + Date.now() : 'existing-' + i,
                orderNumber: i === lastOrderCount ? 'TEST' + Math.floor(Math.random() * 1000) : 'OLD' + i,
                status: 'pending',
                orderTime: new Date().toISOString()
            });
        }
        
        console.log('🧪 Simulating orders:', {
            previousCount: lastOrderCount,
            newCount: fakeOrders.length,
            fakeOrders: fakeOrders
        });
        
        // Trigger the notification check
        checkForNewOrders(fakeOrders);
        
        alert('Simulated new order notification! Check console for details.');
        
    } catch (error) {
        console.error('❌ Error in simulateNewOrder:', error);
        alert('Error simulating order: ' + error.message);
    }
};

window.forceRefreshOrders = function() {
    console.log('🔄 Force refreshing orders...');
    loadOrders();
    alert('Orders refreshed! Check console for details.');
};

// Simple test functions that work immediately
window.testNotificationSound = function() {
    console.log('🔔 Testing notification sound...');
    try {
        if (window.playNotificationSound) {
            window.playNotificationSound();
            console.log('🔔 Sound test completed');
        } else {
            console.error('❌ playNotificationSound not available');
            alert('Sound system not available. Check console for details.');
        }
    } catch (error) {
        console.error('❌ Sound test error:', error);
        alert('Sound test failed: ' + error.message);
    }
};

window.testBrowserNotification = function() {
    console.log('🔔 Testing browser notification...');
    try {
        if (Notification.permission === 'granted') {
            const notification = new Notification('🍽️ Test Notification', {
                body: 'This is a test notification from 24x7 Cafe Admin!',
                icon: '/favicon.ico'
            });
            setTimeout(() => notification.close(), 3000);
            console.log('🔔 Test notification shown');
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    const notification = new Notification('🍽️ Permission Granted!', {
                        body: 'Notifications are now enabled. This is a test.',
                        icon: '/favicon.ico'
                    });
                    setTimeout(() => notification.close(), 3000);
                } else {
                    alert('Notification permission denied');
                }
            });
        } else {
            alert('Notification permission denied. Please enable notifications in your browser settings.');
        }
    } catch (error) {
        console.error('❌ Notification test error:', error);
        alert('Notification test failed: ' + error.message);
    }
};

window.initializeAudioContext = function() {
    console.log('🔔 Initializing audio context with user interaction...');
    try {
        // Re-initialize the notification sound system
        initializeNotificationSound();
        
        // Test the sound immediately
        setTimeout(() => {
            if (window.playNotificationSound) {
                window.playNotificationSound();
                alert('Audio system initialized! Sound should have played.');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Audio initialization error:', error);
        alert('Audio initialization failed: ' + error.message);
    }
};