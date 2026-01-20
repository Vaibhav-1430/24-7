# 🚨 MONGODB CONNECTION FIX

## The Problem
The current MongoDB connection string is invalid:
```
mongodb+srv://cafe247sharda_db_user:nybG22fompH9QlRU@cluster0.mongodb.net/cafe-24x7
```

The cluster name `cluster0.mongodb.net` doesn't exist.

## IMMEDIATE SOLUTION

### Option 1: Use MongoDB Atlas Free Tier (Recommended)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Create a free account** or login
3. **Create a new cluster**:
   - Choose "M0 Sandbox" (Free)
   - Choose any cloud provider (AWS recommended)
   - Choose region closest to you
   - Cluster name: `Cluster0`

4. **Create Database User**:
   - Username: `cafe247user`
   - Password: `nybG22fompH9QlRU`
   - Role: `Atlas admin`

5. **Whitelist IP Addresses**:
   - Add `0.0.0.0/0` (Allow access from anywhere)
   - Or add specific IPs

6. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `cafe-24x7`

### Option 2: Use Free MongoDB Service

**MongoDB Atlas Alternative - Railway**:
1. Go to https://railway.app/
2. Create account
3. Deploy MongoDB
4. Get connection string

### Option 3: Use Temporary Working Connection

For immediate testing, I've created a simple auth function that works without database.

## NETLIFY ENVIRONMENT VARIABLES TO UPDATE

Once you have a working MongoDB connection string, update these in Netlify:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cafe-24x7?retryWrites=true&w=majority
JWT_SECRET=b0abcba6c167b5bedd1c212099fe54bbf0226afb36995bca3eae3bbcf0f3f999c88d6b76efc74bf452ba706806ee5e4758cc54241750b8e21719d96be2117fe4
NODE_ENV=production
```

## CURRENT TEMPORARY FIX

I've created `auth-signup-simple.js` that works without database for immediate testing.
The signup will work now, but data won't be permanently stored until MongoDB is fixed.

## NEXT STEPS

1. **Test the simple signup** - should work immediately
2. **Set up proper MongoDB Atlas cluster**
3. **Update environment variables**
4. **Switch back to full database functionality**