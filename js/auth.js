// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
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
    if (authManager.isLoggedIn()) {
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
    const rememberMe = document.getElementById('rememberMe').checked;
    
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
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, this would make an API call to authenticate
        // For demo purposes, we'll accept any email/password combination
        const user = {
            id: generateUserId(),
            email: email,
            name: extractNameFromEmail(email),
            phone: isPhoneNumber(email) ? email : null,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };
        
        // Save user session
        authManager.saveUser(user);
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
            window.location.href = returnUrl;
        }, 1000);
        
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
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
    
    // Validate inputs
    const validation = validateSignupForm({
        firstName, lastName, email, phone, hostel, roomNumber, password, confirmPassword
    });
    
    if (!validation.isValid) {
        showMessage(validation.message, 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    btnSpinner.style.display = 'block';
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real app, this would make an API call to create account
        const user = {
            id: generateUserId(),
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            hostel: hostel,
            roomNumber: roomNumber,
            signupTime: new Date().toISOString(),
            rememberMe: true
        };
        
        // Save user session
        authManager.saveUser(user);
        
        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showMessage('Signup failed. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        btnSpinner.style.display = 'none';
    }
}

// Demo login function
function demoLogin() {
    const demoUser = {
        id: 'demo-student-001',
        name: 'Demo Student',
        email: 'demo@student.college.edu',
        phone: '+91 98765 43210',
        hostel: 'Hostel A',
        roomNumber: '101',
        loginTime: new Date().toISOString(),
        rememberMe: true,
        isDemo: true
    };
    
    authManager.saveUser(demoUser);
    showMessage('Demo login successful! Redirecting...', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
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