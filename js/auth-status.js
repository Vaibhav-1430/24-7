// Simple Authentication Status Manager
class AuthStatus {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            console.log('🔐 Auth Status: Firebase ready');
            
            // Set up authentication listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    
                    // Try to get user data from Firestore
                    try {
                        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                        this.currentUser = {
                            id: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified,
                            ...userDoc.data()
                        };
                        console.log('📄 User data loaded:', this.currentUser.name || this.currentUser.email);
                    } catch (error) {
                        console.log('⚠️ Could not load user data from Firestore, using basic info');
                        this.currentUser = {
                            id: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified
                        };
                    }
                } else {
                    console.log('👤 No user authenticated');
                    this.currentUser = null;
                }
                
                this.updateAuthUI();
            });
            
        } catch (error) {
            console.error('❌ Auth Status initialization failed:', error);
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds max wait
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && 
                    firebase.auth && 
                    firebase.firestore) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase not available after 10 seconds'));
                } else {
                    setTimeout(checkFirebase, 500);
                }
            };
            
            checkFirebase();
        });
    }

    isLoggedIn() {
        return this.currentUser !== null;
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
                el.textContent = this.currentUser.name || this.currentUser.email;
            }
        });

        console.log('🔄 Auth UI updated');
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            console.log('✅ User logged out successfully');
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Logout failed. Please try again.');
        }
    }
}

// Initialize auth status
let authStatus;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthStatus);
} else {
    initializeAuthStatus();
}

function initializeAuthStatus() {
    console.log('🚀 Initializing Auth Status');
    authStatus = new AuthStatus();
    
    // Make it globally available for backward compatibility
    window.authManager = authStatus;
    window.authStatus = authStatus;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthStatus;
}