// API Client for Netlify Functions
class APIClient {
    constructor() {
        // Use config if available, otherwise fallback to Netlify Functions
        this.baseURL = window.CONFIG ? window.CONFIG.API_BASE_URL : 
            (window.location.hostname === 'localhost' 
                ? 'http://localhost:8888/.netlify/functions'
                : `${window.location.origin}/.netlify/functions`);
        this.token = localStorage.getItem('authToken');
    }

    // Helper method to make API calls
    async request(endpoint, options = {}) {
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
                throw new Error('Cannot connect to backend. Make sure the server is running on http://localhost:5000');
            }
            
            throw error;
        }
    }

    // Authentication methods
    async signup(userData) {
        const response = await this.request('/auth-signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success && response.data.token) {
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

        if (response.success && response.data.token) {
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
        const response = await this.request(`/cart/update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
        return response.data;
    }

    async removeFromCart(itemId) {
        const response = await this.request(`/cart/remove/${itemId}`, {
            method: 'DELETE'
        });
        return response.data;
    }

    async clearCart() {
        const response = await this.request('/cart/clear', {
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
        const response = await this.request(`/orders/${orderId}/cancel`, {
            method: 'PUT'
        });
        return response.data;
    }
}

// Create global API client instance
const apiClient = new APIClient();

// Make it available globally
window.apiClient = apiClient;