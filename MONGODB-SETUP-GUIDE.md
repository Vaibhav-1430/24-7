# 🍃 MongoDB Atlas Setup for 24x7 Cafe

## Step 1: Create MongoDB Atlas Account

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Click "Try Free"**
3. **Sign up with your email**
4. **Choose "Shared" (Free tier)**
5. **Select closest region** (e.g., Mumbai for India)
6. **Cluster name**: `cafe-24x7`

## Step 2: Database Setup

1. **Create Database**: `cafe_database`
2. **Collections to create**:
   - `users` - Store user accounts
   - `menu_items` - Store food items
   - `carts` - Store user carts
   - `orders` - Store orders
   - `admin_users` - Store admin accounts

## Step 3: Get Connection String

1. **Click "Connect" on your cluster**
2. **Choose "Connect your application"**
3. **Copy the connection string**
4. **It looks like**: `mongodb+srv://username:password@cafe-24x7.xxxxx.mongodb.net/cafe_database`

## Step 4: Create Database User

1. **Go to Database Access**
2. **Add New Database User**
3. **Username**: `cafe_user`
4. **Password**: Generate strong password
5. **Database User Privileges**: Read and write to any database

## Step 5: Network Access

1. **Go to Network Access**
2. **Add IP Address**
3. **Choose "Allow access from anywhere"** (for development)
4. **IP Address**: `0.0.0.0/0`

## Your Connection Details

After setup, you'll have:
- **Cluster Name**: cafe-24x7
- **Database Name**: cafe_database
- **Username**: cafe_user
- **Password**: [your generated password]
- **Connection String**: mongodb+srv://cafe_user:PASSWORD@cafe-24x7.xxxxx.mongodb.net/cafe_database

## Next Steps

1. Complete the Atlas setup
2. Get your connection string
3. I'll create a simple Node.js backend for you
4. Replace all Firebase code with clean MongoDB code

This will be MUCH simpler than Firebase! 🎉