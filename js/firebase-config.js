// Firebase Configuration and Initialization
// Your actual Firebase config

const firebaseConfig = {
  apiKey: "AIzaSyCNN5gijXy7DEi9YeY4shCYvu6ktMbkIDM",
  authDomain: "cafe-24-7-bfb39.firebaseapp.com",
  projectId: "cafe-24-7-bfb39",
  storageBucket: "cafe-24-7-bfb39.firebasestorage.app",
  messagingSenderId: "164822694308",
  appId: "1:164822694308:web:79c41a8fa157ed4906e931",
  measurementId: "G-QHW0PYZXEX"
};

// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase SDK not loaded! Check if CDN scripts are working.');
} else {
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
    
    // Enable offline persistence with better error handling
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
      });
    
    console.log('🔥 Firebase initialized successfully!');
    
    // Test connection
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('👤 No user authenticated');
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}