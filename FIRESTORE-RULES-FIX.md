# Firestore Security Rules Fix

## Problem
The Firestore database appears empty despite authentication working. This is likely due to restrictive security rules.

## Solution

### 1. Update Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to create orders and read their own orders
    match /orders/{orderId} {
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow admin users to read all orders (for admin panel)
    match /orders/{orderId} {
      allow read, update: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow anyone to read menu items (public data)
    match /menu/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow authenticated users to write to debug collection (for testing)
    match /debug/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to write test documents
    match /test/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Alternative: Temporary Open Rules (FOR TESTING ONLY)

If you want to test quickly, you can temporarily use open rules (NOT for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING: These open rules allow anyone to read/write your database. Only use for testing!**

### 3. Steps to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `cafe-24-7-bfb39`
3. Go to "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the existing rules with the secure rules above
6. Click "Publish"

### 4. Test After Rules Update

1. Open `firebase-debug-test.html` in your browser
2. Run all 5 test steps
3. Check if Step 4 and Step 5 now pass
4. Try signing up a new user on your website
5. Check Firebase Console → Firestore Database → Data to see if collections are created

### 5. Current Default Rules (Likely Blocking Writes)

Your current rules probably look like this:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This blocks all reads and writes, which is why your database appears empty.