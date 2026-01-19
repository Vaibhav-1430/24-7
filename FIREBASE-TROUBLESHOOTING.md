# Firebase Troubleshooting Guide

## Current Issue: Empty Firestore Database

Your Firebase Authentication is working (2 users visible), but Firestore database appears empty. This is most likely due to **Firestore Security Rules** blocking writes.

## Step-by-Step Solution

### 1. 🔥 Update Firestore Security Rules (MOST IMPORTANT)

**Go to Firebase Console:**
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select project: `cafe-24-7-bfb39`
3. Click "Firestore Database" in left sidebar
4. Click "Rules" tab
5. Replace existing rules with:

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
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to write test documents
    match /debug/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /test/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Click "Publish"

### 2. 🧪 Test the Fix

**Option A: Use Debug Test Page**
1. Open `firebase-debug-test.html` in browser
2. Run all 5 test steps
3. Steps 4 and 5 should now pass

**Option B: Test Signup**
1. Go to your website signup page
2. Create a new test account
3. Check Firebase Console → Firestore Database → Data
4. You should see `users` collection with the new user

### 3. 🔍 Check for Errors

**Open Browser Console (F12) and look for:**
- ❌ `permission-denied` errors
- ❌ `Firebase not initialized` errors
- ❌ Any red error messages

### 4. 📊 Verify Database Structure

After successful signup/cart operations, you should see these collections in Firestore:

```
📁 users
  └── 📄 [user-id]
      ├── firstName: "John"
      ├── lastName: "Doe"
      ├── email: "john@example.com"
      └── ...

📁 carts
  └── 📄 [user-id]
      ├── items: [...]
      └── updatedAt: timestamp

📁 orders
  └── 📄 [order-id]
      ├── userId: "user-id"
      ├── items: [...]
      └── ...
```

## Common Issues & Solutions

### Issue 1: "permission-denied" Error
**Cause:** Firestore security rules are too restrictive
**Solution:** Update rules as shown in Step 1

### Issue 2: "Firebase not initialized" Error
**Cause:** Code runs before Firebase loads
**Solution:** Already fixed with improved `firebase-config.js`

### Issue 3: Empty Database After Rules Update
**Cause:** Need to test with new operations
**Solution:** 
1. Create a new user account
2. Add items to cart
3. Place an order

### Issue 4: Authentication Works but Writes Fail
**Cause:** Rules allow auth but block specific collections
**Solution:** Check rules match the collection names exactly

## Testing Checklist

- [ ] Firebase Console shows updated security rules
- [ ] `firebase-debug-test.html` Step 4 passes (Firestore write)
- [ ] `firebase-debug-test.html` Step 5 passes (User creation)
- [ ] New signup creates user in `users` collection
- [ ] Adding items to cart creates `carts` collection
- [ ] Placing order creates `orders` collection
- [ ] Browser console shows no permission errors

## Emergency: Temporary Open Rules (TESTING ONLY)

If you need to test quickly, use these **TEMPORARY** rules (NOT for production):

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

⚠️ **WARNING:** These rules allow anyone to read/write your database. Only use for testing, then switch back to secure rules!

## Next Steps After Fix

1. Test all website functionality
2. Verify data appears in Firebase Console
3. Check that orders, users, and carts are being saved
4. Update to production-ready security rules before going live

## Need Help?

If issues persist:
1. Check browser console for specific error messages
2. Verify Firebase project ID matches in `firebase-config.js`
3. Ensure you're using the correct Firebase project
4. Try the temporary open rules to isolate the issue