// API Client for Netlify Functions
class APIClient {
    constructor() {
        // Use config if available, otherwise fallback to Netlify Functions
        this.baseURL = window.CONFIG ? window.CONFIG.API_BASE_URL : 
            (window.location.hostname === 'localhost' 
                ? 'http://localhost:8888/.netlify/functions'
                : `${window.location.origin}/.netlify/functions`);
        
        this.token = localStorage.getItem('authToken');
        this.mockMode = this.baseURL === 'mock';
        
        console.log('🌐 API Client initialized:', this.mockMode ? 'MOCK MODE' : this.baseURL);
    }

    // Helper method to make API calls
    async request(endpoint, options = {}) {
        // Refresh token from localStorage before each request
        this.token = localStorage.getItem('authToken');
        
        // Handle mock mode for local development
        if (this.mockMode) {
            return this.handleMockRequest(endpoint, options);
        }
        
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            console.log(`🌐 API Request: ${config.method} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText || 'API request failed' };
                }
                
                // Don't logout on server errors, only on authentication errors
                if (response.status === 401 && endpoint !== '/me') {
                    console.log('🔐 Authentication error, logging out');
                    this.logout();
                }
                
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response: ${config.method} ${url}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${config.method} ${url}`, error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend. Please make sure you are running "netlify dev" or deploy to Netlify.');
            }
            
            throw error;
        }
    }

    // Mock request handler for local development without Netlify Dev
    async handleMockRequest(endpoint, options = {}) {
        console.log(`🎭 Mock API Request: ${options.method || 'GET'} ${endpoint}`);
        console.log(`🎭 Request body:`, options.body);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const method = options.method || 'GET';
        
        try {
            // Mock responses for different endpoints
            switch (endpoint) {
                case '/auth-signup':
                    if (method === 'POST') {
                        const userData = JSON.parse(options.body || '{}');
                        
                        // Validate required fields
                        if (!userData.firstName || !userData.lastName || !userData.email) {
                            throw new Error('Please provide all required fields');
                        }
                        
                        if (!userData.password || userData.password.length < 6) {
                            throw new Error('Password must be at least 6 characters long');
                        }
                        
                        const mockUser = {
                            id: 'mock_' + Date.now(),
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            email: userData.email,
                            phone: userData.phone || '+91 9876543210',
                            hostel: userData.hostel || 'Demo Hostel',
                            roomNumber: userData.roomNumber || '101',
                            isActive: true,
                            isAdmin: userData.email.includes('admin'),
                            fullName: `${userData.firstName} ${userData.lastName}`,
                            createdAt: new Date().toISOString()
                        };
                        
                        const mockToken = 'mock_token_' + Date.now();
                        this.token = mockToken;
                        localStorage.setItem('authToken', mockToken);
                        localStorage.setItem('currentUser', JSON.stringify(mockUser));
                        
                        console.log('✅ Mock signup successful:', mockUser);
                        
                        return {
                            success: true,
                            message: 'Account created successfully',
                            data: {
                                token: mockToken,
                                user: mockUser
                            }
                        };
                    }
                    break;
                    
                case '/auth-login':
                    if (method === 'POST') {
                        const loginData = JSON.parse(options.body || '{}');
                        
                        if (!loginData.email || !loginData.password) {
                            throw new Error('Please provide email and password');
                        }
                        
                        // Mock successful login
                        const mockUser = {
                            id: 'mock_user_123',
                            firstName: 'Demo',
                            lastName: 'Student',
                            email: loginData.email,
                            phone: '+91 98765 43210',
                            hostel: 'Demo Hostel',
                            roomNumber: '101',
                            isActive: true,
                            isAdmin: loginData.email.includes('admin'),
                            fullName: 'Demo Student',
                            createdAt: new Date().toISOString()
                        };
                        
                        const mockToken = 'mock_token_' + Date.now();
                        this.token = mockToken;
                        localStorage.setItem('authToken', mockToken);
                        localStorage.setItem('currentUser', JSON.stringify(mockUser));
                        
                        return {
                            success: true,
                            message: 'Login successful',
                            data: {
                                token: mockToken,
                                user: mockUser
                            }
                        };
                    }
                    break;
                    
                case '/auth-me':
                    if (this.token && this.token.startsWith('mock_token_')) {
                        const savedUser = localStorage.getItem('currentUser');
                        if (savedUser) {
                            return {
                                success: true,
                                message: 'User data retrieved successfully',
                                data: {
                                    user: JSON.parse(savedUser)
                                }
                            };
                        }
                    }
                    throw new Error('Not authenticated');
                    
                case '/menu':
                    return {
                        success: true,
                        message: 'Menu items retrieved successfully',
                        data: [
                            {
                                id: 1,
                                name: "Veg Noodles",
                                description: "Delicious vegetable noodles with fresh vegetables and aromatic spices",
                                price: 101,
                                halfPrice: 66,
                                category: "Noodles",
                                image: "images/placeholder.jpg",
                                available: true,
                                popular: true,
                                isVeg: true
                            },
                            {
                                id: 2,
                                name: "Chicken Noodles",
                                description: "Spicy chicken noodles with tender chicken pieces",
                                price: 131,
                                halfPrice: 76,
                                category: "Noodles",
                                image: "images/placeholder.jpg",
                                available: true,
                                popular: true,
                                isVeg: false
                            },
                            {
                                id: 3,
                                name: "Paneer Momos (Fried)",
                                description: "Crispy fried momos stuffed with spiced paneer",
                                price: 61,
                                halfPrice: 41,
                                category: "Momos",
                                image: "images/placeholder.jpg",
                                available: true,
                                popular: true,
                                isVeg: true
                            }
                        ]
                    };
                    
                case '/cart':
                    if (method === 'GET') {
                        return {
                            success: true,
                            message: 'Cart retrieved successfully',
                            data: {
                                items: [],
                                total: 0,
                                itemCount: 0
                            }
                        };
                    } else if (method === 'POST') {
                        const cartItem = JSON.parse(options.body || '{}');
                        return {
                            success: true,
                            message: 'Item added to cart successfully',
                            data: {
                                items: [cartItem],
                                total: cartItem.price * cartItem.quantity,
                                itemCount: cartItem.quantity
                            }
                        };
                    } else if (method === 'DELETE') {
                        return {
                            success: true,
                            message: 'Cart cleared successfully',
                            data: {
                                items: [],
                                total: 0,
                                itemCount: 0
                            }
                        };
                    }
                    break;
                    
                case '/orders':
                    if (method === 'POST') {
                        const orderData = JSON.parse(options.body || '{}');
                        const mockOrder = {
                            id: 'mock_order_' + Date.now(),
                            orderNumber: 'ORD' + Date.now().toString().slice(-6),
                            items: orderData.items || [],
                            contact: orderData.contact || {},
                            delivery: orderData.delivery || {},
                            payment: orderData.payment || {},
                            pricing: orderData.pricing || {},
                            status: 'pending',
                            orderTime: new Date().toISOString(),
                            estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString()
                        };
                        
                        return {
                            success: true,
                            message: 'Order created successfully',
                            data: mockOrder
                        };
                    } else if (method === 'GET') {
                        return {
                            success: true,
                            message: 'Orders retrieved successfully',
                            data: []
                        };
                    }
                    break;
                    
                default:
                    console.log(`🎭 Mock endpoint not implemented: ${endpoint}`);
                    return {
                        success: true,
                        message: 'Mock response',
                        data: {}
                    };
            }
        } catch (error) {
            console.error('🎭 Mock request error:', error);
            throw error;
        }
        
        throw new Error('Mock endpoint not implemented: ' + endpoint);
    }

    // Authentication methods
    async signup(userData) {
        // Use simple signup function
        const response = await this.request('/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success && response.data && response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }

        return response;
    }

    async login(email, password) {
        // Use simple login function
        const response = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success && response.data && response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }

        return response;
    }

    async getCurrentUser() {
        if (!this.token) return null;

        try {
            const response = await this.request('/me');
            return response.success ? response.data.user : null;
        } catch (error) {
            // Token might be expired or invalid
            console.log('⚠️ Token validation failed, logging out');
            this.logout();
            return null;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return !!this.token;
    }

    // Menu methods
    async getMenuItems(category = null) {
        const endpoint = category ? `/menu?category=${category}` : '/menu';
        const response = await this.request(endpoint);
        return response.data || [];
    }

    async getMenuItem(id) {
        const response = await this.request(`/menu/${id}`);
        return response.data;
    }

    async searchMenuItems(query) {
        const response = await this.request(`/menu/search/${query}`);
        return response.data || [];
    }

    // Cart methods
    async getCart() {
        const response = await this.request('/cart');
        return response.data;
    }

    async addToCart(item) {
        const response = await this.request('/cart', {
            method: 'POST',
            body: JSON.stringify(item)
        });
        return response.data;
    }

    async updateCartItem(itemId, quantity) {
        const response = await this.request('/cart', {
            method: 'PUT',
            body: JSON.stringify({ itemId, quantity })
        });
        return response.data;
    }

    async removeFromCart(itemId) {
        const response = await this.request('/cart', {
            method: 'PUT',
            body: JSON.stringify({ itemId, quantity: 0 })
        });
        return response.data;
    }

    async clearCart() {
        const response = await this.request('/cart', {
            method: 'DELETE'
        });
        return response.data;
    }

    // Order methods
    async createOrder(orderData) {
        const response = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response.data;
    }

    async getOrders(status = null) {
        const endpoint = status ? `/orders?status=${status}` : '/orders';
        const response = await this.request(endpoint);
        return response.data || [];
    }

    async getOrder(orderId) {
        const response = await this.request(`/orders/${orderId}`);
        return response.data;
    }

    async cancelOrder(orderId) {
        const response = await this.request(`/orders-cancel/${orderId}`, {
            method: 'PUT'
        });
        return response.data;
    }

    // Admin API methods
    async getAdminOrders(status = null) {
        const endpoint = status && status !== 'all' ? `/admin-orders?status=${status}` : '/admin-orders';
        const response = await this.request(endpoint);
        return response.data || [];
    }

    async updateOrderStatus(orderId, status, notes = '') {
        const response = await this.request('/admin-orders', {
            method: 'PUT',
            body: JSON.stringify({
                orderId,
                status,
                notes
            })
        });
        return response.data;
    }

    async getAdminAnalytics(days = 30) {
        const response = await this.request(`/admin-analytics?days=${days}`);
        return response.data;
    }

    async getAdminMenuItems() {
        console.log('🔧 API: Getting admin menu items...');
        console.log('🔑 API: Auth token:', this.getAuthToken());
        
        const response = await this.request('/admin-menu');
        console.log('📡 API: Admin menu response:', response);
        
        return response.data || [];
    }

    async addMenuItem(itemData) {
        const response = await this.request('/admin-menu', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
        return response.data;
    }

    async updateMenuItem(itemId, itemData) {
        const response = await this.request('/admin-menu', {
            method: 'PUT',
            body: JSON.stringify({ itemId, ...itemData })
        });
        return response.data;
    }

    async deleteMenuItem(itemId) {
        const response = await this.request(`/admin-menu?itemId=${itemId}`, {
            method: 'DELETE'
        });
        return response.data;
    }

    // Helper method to get auth token
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    // Test admin functionality
    async testAdminEndpoint() {
        console.log('🧪 Testing admin endpoint...');
        const response = await this.request('/admin-test');
        console.log('🧪 Admin test response:', response);
        return response.data;
    }

    // Grant admin privileges to current user
    async grantAdminPrivileges() {
        console.log('👑 Requesting admin privileges...');
        const response = await this.request('/grant-admin', {
            method: 'POST'
        });
        console.log('👑 Grant admin response:', response);
        return response.data;
    }
}

// Create global API client instance
const apiClient = new APIClient();

// Make it available globally
window.apiClient = apiClient;

// Debug log
console.log('🔧 API Client initialized:', apiClient);