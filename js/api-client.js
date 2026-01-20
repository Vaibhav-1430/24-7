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
                    
                case '/menu-get':
                    return {
                        success: true,
                        message: 'Menu items retrieved successfully',
                        data: [
                            {
                                id: 1,
                                name: "Masala Dosa",
                                description: "Crispy rice crepe with spiced potato filling",
                                price: 80,
                                category: "South Indian",
                                image: "images/masala-dosa.jpg",
                                available: true,
                                popular: true
                            },
                            {
                                id: 2,
                                name: "Chicken Biryani",
                                description: "Fragrant basmati rice with tender chicken",
                                price: 180,
                                category: "Rice",
                                image: "images/chicken-biryani.jpg",
                                available: true,
                                popular: true
                            },
                            {
                                id: 3,
                                name: "Paneer Butter Masala",
                                description: "Soft paneer cubes in rich tomato-based creamy gravy",
                                price: 140,
                                category: "North Indian",
                                image: "images/paneer-butter-masala.jpg",
                                available: true,
                                popular: false
                            }
                        ]
                    };
                    
                case '/cart-get':
                    return {
                        success: true,
                        message: 'Cart retrieved successfully',
                        data: {
                            items: [],
                            total: 0,
                            itemCount: 0
                        }
                    };
                    
                case '/cart-add':
                    if (method === 'POST') {
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
        const response = await this.request('/auth-signup', {
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
        const response = await this.request('/auth-login', {
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
            const response = await this.request('/auth-me');
            return response.success ? response.data.user : null;
        } catch (error) {
            // Token might be expired
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
        const endpoint = category ? `/menu-get?category=${category}` : '/menu-get';
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
        const response = await this.request('/cart-get');
        return response.data;
    }

    async addToCart(item) {
        const response = await this.request('/cart-add', {
            method: 'POST',
            body: JSON.stringify(item)
        });
        return response.data;
    }

    async updateCartItem(itemId, quantity) {
        const response = await this.request(`/cart-update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
        return response.data;
    }

    async removeFromCart(itemId) {
        const response = await this.request(`/cart-remove/${itemId}`, {
            method: 'DELETE'
        });
        return response.data;
    }

    async clearCart() {
        const response = await this.request('/cart-clear', {
            method: 'DELETE'
        });
        return response.data;
    }

    // Order methods
    async createOrder(orderData) {
        const response = await this.request('/orders-create', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response.data;
    }

    async getOrders(status = null) {
        const endpoint = status ? `/orders-get?status=${status}` : '/orders-get';
        const response = await this.request(endpoint);
        return response.data || [];
    }

    async getOrder(orderId) {
        const response = await this.request(`/orders-get/${orderId}`);
        return response.data;
    }

    async cancelOrder(orderId) {
        const response = await this.request(`/orders-cancel/${orderId}`, {
            method: 'PUT'
        });
        return response.data;
    }
}

// Create global API client instance
const apiClient = new APIClient();

// Make it available globally
window.apiClient = apiClient;

// Debug log
console.log('🔧 API Client initialized:', apiClient);