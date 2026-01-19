// Firebase Configuration and Initialization
// Firebase v8 SDK Configuration

const firebaseConfig = {
  apiKey: "AIzaSyCNN5gijXy7DEi9YeY4shCYvu6ktMbkIDM",
  authDomain: "cafe-24-7-bfb39.firebaseapp.com",
  projectId: "cafe-24-7-bfb39",
  storageBucket: "cafe-24-7-bfb39.firebasestorage.app",
  messagingSenderId: "164822694308",
  appId: "1:164822694308:web:79c41a8fa157ed4906e931",
  measurementId: "G-QHW0PYZXEX"
};

// Global Firebase ready promise
window.firebaseReady = new Promise((resolve, reject) => {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK not loaded! Check if CDN scripts are working.');
    alert('Firebase not loaded. Please check your internet connection and refresh the page.');
    reject(new Error('Firebase SDK not loaded'));
    return;
  }

  try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Export for use in other files
    window.firebaseAuth = auth;
    window.firebaseDB = db;
    window.firebaseStorage = storage;
    
    console.log('🔥 Firebase initialized successfully!');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    
    // Test Firestore connection and resolve when ready
    Promise.all([
      // Enable persistence (optional)
      db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
          console.log('✅ Firestore offline persistence enabled');
        })
        .catch((err) => {
          if (err.code == 'failed-precondition') {
            console.log('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code == 'unimplemented') {
            console.log('⚠️ The current browser does not support offline persistence.');
          } else {
            console.log('⚠️ Persistence error:', err);
          }
        }),
      
      // Test Firestore connection
      db.collection('test').limit(1).get()
        .then(() => {
          console.log('✅ Firestore connection successful');
        })
        .catch((error) => {
          console.error('❌ Firestore connection failed:', error);
          console.error('🔍 This might be a security rules issue. Check FIRESTORE-RULES-FIX.md');
        })
    ]).finally(() => {
      // Resolve even if some tests fail - Firebase is still usable
      resolve({
        auth: auth,
        db: db,
        storage: storage
      });
    });
    
    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ User authenticated:', user.email);
        window.dispatchEvent(new CustomEvent('firebaseUserChanged', { detail: { user } }));
      } else {
        console.log('👤 No user authenticated');
        window.dispatchEvent(new CustomEvent('firebaseUserChanged', { detail: { user: null } }));
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Firebase initialization failed: ' + error.message);
    reject(error);
  }
});

// Utility function to wait for Firebase to be ready
window.waitForFirebase = async function() {
  try {
    return await window.firebaseReady;
  } catch (error) {
    console.error('❌ Firebase not ready:', error);
    throw error;
  }
};