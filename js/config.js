// Configuration for 24x7 Cafe Application
window.CONFIG = {
    // API Base URL - automatically detects environment
    API_BASE_URL: (() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        console.log('🔧 Detecting environment:', { hostname, protocol, port: window.location.port });
        
        // If we're using file:// protocol (opening HTML directly)
        if (protocol === 'file:') {
            console.log('🎭 File protocol detected - using mock mode');
            return 'mock';
        }
        
        // Production (Netlify)
        if (hostname.includes('netlify.app') || hostname.includes('24x7-cafe')) {
            console.log('🌐 Production environment detected');
            return `${window.location.origin}/.netlify/functions`;
        }
        
        // Local development with Netlify Dev
        if (hostname === 'localhost' && window.location.port === '8888') {
            console.log('🛠️ Netlify Dev environment detected');
            return 'http://localhost:8888/.netlify/functions';
        }
        
        // Local development fallback - use mock data
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            console.log('🎭 Local development detected - using mock mode');
            return 'mock';
        }
        
        // Default to mock for safety
        console.log('🎭 Unknown environment - defaulting to mock mode');
        return 'mock';
    })(),
    
    // App Configuration
    APP_NAME: '24x7 Cafe',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        DEMO_MODE: true,
        OFFLINE_SUPPORT: false,
        PUSH_NOTIFICATIONS: false
    },
    
    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 12,
        CART_AUTO_SAVE: true,
        SHOW_LOADING_STATES: true
    }
};

console.log('🔧 Config loaded - API URL:', window.CONFIG.API_BASE_URL);