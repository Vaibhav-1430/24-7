// Firebase Configuration and Initialization
// Replace the config object below with your actual Firebase config

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNN5gijXy7DEi9YeY4shCYvu6ktMbkIDM",
  authDomain: "cafe-24-7-bfb39.firebaseapp.com",
  projectId: "cafe-24-7-bfb39",
  storageBucket: "cafe-24-7-bfb39.firebasestorage.app",
  messagingSenderId: "164822694308",
  appId: "1:164822694308:web:79c41a8fa157ed4906e931",
  measurementId: "G-QHW0PYZXEX"
};

// Initialize Firebase (using CDN version for simplicity)
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support persistence.');
    }
  });

console.log('🔥 Firebase initialized successfully!');