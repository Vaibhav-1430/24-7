// Authentication functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Firebase to be ready before setting up event listeners
    try {
        console.log('🔄 Waiting for Firebase to initialize...');
        await window.waitForFirebase();
        console.log('✅ Firebase ready, setting up auth handlers');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        showMessage('System initialization failed. Please refresh the page.', 'error');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form handler
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Check if user is already logged in
    if (authManager && authManager.isLoggedIn()) {
        // Redirect to home page if already logged in
        window.location.href = 'index.html';
    }
});

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.auth-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    // Get form data
    const formData = new FormData(e.target);
    const email = formData.get('email').trim();
    const password = formData.get('password');
    
    // Validate inputs
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    btnSpinner.style.display = 'block';
    
    try {
        // Use Firebase authentication
        await authManager.login(email, password);
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
            window.location.href = returnUrl;
        }, 1000);
        
    } catch (error) {
        let errorMessage = 'Login failed. Please try again.';
        
        // Handle specific Firebase errors
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        btnSpinner.style.display = 'none';
    }
}

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    
    console.log('🚀 Signup form submitted');
    
    const submitBtn = e.target.querySelector('.auth-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    // Get form data
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName').trim();
    const lastName = formData.get('lastName').trim();
    const email = formData.get('email').trim();
    const phone = formData.get('phone').trim();
    const hostel = formData.get('hostel').trim();
    const roomNumber = formData.get('roomNumber').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    console.log('📝 Form data collected:', { firstName, lastName, email, phone, hostel, roomNumber });
    
    // Validate inputs
    const validation = validateSignupForm({
        firstName, lastName, email, phone, hostel, roomNumber, password, confirmPassword
    });
    
    if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.message);
        showMessage(validation.message, 'error');
        return;
    }
    
    console.log('✅ Form validation passed');
    
    // Check if authManager is available
    if (!window.authManager) {
        console.error('❌ AuthManager not available');
        showMessage('System not ready. Please refresh the page and try again.', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    btnSpinner.style.display = 'block';
    
    try {
        console.log('🔐 Starting Firebase signup...');
        
        // Use Firebase authentication
        await authManager.signup({
            firstName,
            lastName,
            email,
            phone,
            hostel,
            roomNumber,
            password
        });
        
        console.log('✅ Signup successful');
        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        // Handle specific Firebase errors
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters long.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled.';
                break;
            case 'permission-denied':
                errorMessage = 'Database access denied. Please contact support.';
                console.error('🔧 SOLUTION: Update Firestore security rules');
                break;
            default:
                if (error.message) {
                    errorMessage = error.message;
                }
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        btnSpinner.style.display = 'none';
    }
}

// Demo login function
async function demoLogin() {
    try {
        await authManager.demoLogin();
        showMessage('Demo login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showMessage('Demo login failed. Please try again.', 'error');
    }
}

// Validation functions
function validateSignupForm(data) {
    const { firstName, lastName, email, phone, hostel, roomNumber, password, confirmPassword } = data;
    
    if (!firstName || !lastName) {
        return { isValid: false, message: 'Please enter your full name' };
    }
    
    if (!isValidEmail(email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    if (!isValidPhone(phone)) {
        return { isValid: false, message: 'Please enter a valid phone number' };
    }
    
    if (!hostel || !roomNumber) {
        return { isValid: false, message: 'Please enter your hostel and room number' };
    }
    
    if (password.length < 6) {
        return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    
    if (password !== confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isPhoneNumber(input) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(input);
}

function extractNameFromEmail(email) {
    const username = email.split('@')[0];
    return username.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentNode.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message ${type}`;
    messageEl.textContent = message;
    
    // Insert message at the top of the form
    const form = document.querySelector('.auth-form');
    form.insertBefore(messageEl, form.firstChild);
    
    // Show message with animation
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    // Auto-hide error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.classList.remove('show');
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}