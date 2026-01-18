# 🔥 Firebase Setup Instructions for 24x7 Cafe

## ⚡ QUICK SETUP (15 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Project name: `24x7-cafe` (or your choice)
4. Enable Google Analytics: ✅ (recommended)
5. Click **"Create project"**

### Step 2: Enable Services
Once your project is created:

**Authentication:**
1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → **Email/Password** → **Enable** → **Save**

**Firestore Database:**
1. Left sidebar → **Firestore Database** → **Create database**
2. **Start in test mode** → **Next**
3. Choose location: **asia-south1** (for India) → **Done**

**Storage:**
1. Left sidebar → **Storage** → **Get started**
2. **Start in test mode** → **Done**

### Step 3: Get Your Config
1. Click **gear icon ⚙️** → **Project settings**
2. Scroll to **"Your apps"** section
3. Click **web icon `</>`**
4. App nickname: `24x7-cafe-web`
5. **Register app**
6. **Copy the config object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 4: Update Your Code
1. Open `js/firebase-config.js`
2. **Replace the config object** with your actual config
3. Save the file

### Step 5: Test Your Setup
1. Upload your updated files to Netlify
2. Visit your website
3. Try creating a new account
4. Check Firebase Console → Authentication → Users (you should see the new user)
5. Check Firestore Database → Data (you should see user data)

## 🎯 What You Get After Setup

### ✅ Real User Accounts
- Users can sign up with email/password
- User data stored in Firestore
- Secure authentication with Firebase

### ✅ Real-time Cart Sync
- Cart syncs across devices
- Cart persists after login/logout
- Real-time updates

### ✅ Order History
- Orders stored in Firestore
- Real-time order updates
- Persistent order history

### ✅ Admin Dashboard
- Real user management
- Real order management
- Real-time data

## 🔧 Firebase Console Overview

After setup, you can manage your app from Firebase Console:

**Authentication Tab:**
- View all registered users
- Disable/enable users
- Reset passwords

**Firestore Database Tab:**
- View all data (users, orders, carts)
- Edit data manually
- Set security rules

**Storage Tab:**
- View uploaded images
- Manage file permissions

## 🚨 Important Security Notes

**Current Setup (Test Mode):**
- Anyone can read/write to your database
- Good for development/testing
- **NOT suitable for production**

**For Production:**
You'll need to add security rules. Here are basic rules:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Menu items are read-only for users
    match /menu/{itemId} {
      allow read: if true;
      allow write: if false; // Only admin can write
    }
  }
}
```

## 📊 Data Structure

Your Firebase will have these collections:

**users/** (User profiles)
```javascript
{
  firstName: "John",
  lastName: "Doe", 
  email: "john@example.com",
  phone: "+91 98765 43210",
  hostel: "Hostel A",
  roomNumber: "101",
  createdAt: timestamp
}
```

**carts/** (User shopping carts)
```javascript
{
  items: [
    {
      id: 1,
      name: "Chicken Biryani (Full)",
      price: 131,
      quantity: 2,
      instructions: "Extra spicy"
    }
  ],
  updatedAt: timestamp
}
```

**orders/** (Order history)
```javascript
{
  id: "247123456ABCDE",
  userId: "firebase-user-id",
  items: [...],
  delivery: {...},
  contact: {...},
  payment: {...},
  pricing: {...},
  status: "received",
  createdAt: timestamp
}
```

## 🎉 You're Done!

After completing these steps:
1. Your website will have **real user authentication**
2. **Real database storage** instead of localStorage
3. **Real-time data sync** across devices
4. **Persistent data** that doesn't get lost

Your 24x7 Cafe is now powered by Firebase! 🚀

## 🆘 Troubleshooting

**Problem: "Firebase is not defined"**
- Solution: Make sure Firebase CDN scripts are loaded before firebase-config.js

**Problem: "Permission denied"**
- Solution: Check if user is logged in, or update Firestore security rules

**Problem: "Config not found"**
- Solution: Make sure you replaced the config object in firebase-config.js

**Problem: "Network error"**
- Solution: Check internet connection and Firebase project status

Need help? Check the browser console for detailed error messages!