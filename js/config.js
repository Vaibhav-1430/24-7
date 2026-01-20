// Production Configuration
const CONFIG = {
    // API Base URL - Automatically detects Netlify deployment
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8888/.netlify/functions'  // Netlify Dev
        : `${window.location.origin}/.netlify/functions`,  // Production Netlify
    
    // App Settings
    APP_NAME: '24x7 Cafe',
    VERSION: '1.0.0',
    
    // Features
    FEATURES: {
        ADMIN_PANEL: true,
        ORDER_TRACKING: true,
        PAYMENT_GATEWAY: false // Set to true when payment gateway is integrated
    },
    
    // UI Settings
    ITEMS_PER_PAGE: 12,
    CART_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    
    // Order Settings
    ORDER_ID_PREFIX: '001',
    DELIVERY_FEE: 10,
    TAX_RATE: 0.05,
    
    // Contact Info
    CONTACT: {
        PHONE: '+91 98765 43210',
        EMAIL: 'orders@24x7cafe.com',
        ADDRESS: 'Campus Food Court, University Campus'
    }
};

// Make config globally available
window.CONFIG = CONFIG;