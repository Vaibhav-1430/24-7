// Clean Authentication Manager for MongoDB Backend
class AuthManagerClean {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');

        if (token && savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('✅ User restored from localStorage:', this.currentUser.email);
                
                // Try to verify token, but don't logout immediately if it fails
                try {
                    const user = await apiClient.getCurrentUser();
                    if (user) {
                        this.currentUser = user;
                        console.log('✅ Token validated, user updated:', user.email);
                    }
                } catch (error) {
                    console.log('⚠️ Token validation failed, but keeping user logged in for now');
                    // Don't logout immediately - let user continue with cached data
                }
            } catch (error) {
                console.log('⚠️ Error parsing saved user data, logging out');
                this.logout();
            }
        }

        this.updateAuthUI();
    }

    async signup(userData) {
        try {
            console.log('📝 Creating account for:', userData.email);
            
            const response = await apiClient.signup(userData);
            
            if (response.success) {
                // Set current user and update UI (automatic login)
                this.currentUser = response.data.user;
                console.log('✅ Account created and user logged in automatically');
                this.updateAuthUI();
                return response.data.user;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('❌ Signup error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Logging in user:', email);
            
            const response = await apiClient.login(email, password);
            
            if (response.success) {
                this.currentUser = response.data.user;
                console.log('✅ Login successful');
                this.updateAuthUI();
                return response.data.user;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            apiClient.logout();
            this.currentUser = null;
            console.log('✅ User logged out');
            this.updateAuthUI();
            
            // Redirect to home page
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    }

    isLoggedIn() {
        const token = localStorage.getItem('authToken');
        return this.currentUser !== null && !!token;
    }

    updateAuthUI() {
        // Update login/logout buttons
        const loginBtns = document.querySelectorAll('.login-btn');
        loginBtns.forEach(btn => {
            if (this.currentUser) {
                btn.textContent = 'Logout';
                btn.href = '#';
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            } else {
                btn.textContent = 'Login';
                btn.href = 'login.html';
                btn.onclick = null;
            }
        });

        // Update user name displays
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            if (this.currentUser) {
                el.textContent = this.currentUser.fullName || this.currentUser.email;
            }
        });

        console.log('🔄 Auth UI updated');
    }

    // Demo login for testing
    async demoLogin() {
        try {
            const demoUser = {
                firstName: 'Demo',
                lastName: 'Student',
                email: 'demo@student.com',
                phone: '+91 98765 43210',
                hostel: 'Demo Hostel',
                roomNumber: '101',
                password: 'demo123456'
            };

            // Try to login first
            try {
                await this.login(demoUser.email, demoUser.password);
            } catch (error) {
                // If login fails, create demo account
                console.log('👤 Creating demo account...');
                await this.signup(demoUser);
            }
        } catch (error) {
            console.error('❌ Demo login error:', error);
            throw error;
        }
    }
}

// Initialize auth manager
const authManagerClean = new AuthManagerClean();

// Make it globally available
window.authManager = authManagerClean;
window.authManagerClean = authManagerClean;

// Debug log
console.log('🔧 Auth Manager initialized:', authManagerClean);