# 🚀 MongoDB Backend Setup Instructions

## Step 1: Update Your MongoDB Connection String

1. **Open `backend/.env` file**
2. **Replace `YOUR_PASSWORD_HERE` with your actual MongoDB Atlas password**
3. **Replace `xxxxx` with your actual cluster URL**

Your connection string should look like:
```
MONGODB_URI=mongodb+srv://cafe_user:your_actual_password@cafe-24x7.abc123.mongodb.net/cafe_database
```

## Step 2: Install Backend Dependencies

Open terminal in the `backend` folder and run:

```bash
cd backend
npm install
```

This will install:
- express (web server)
- mongoose (MongoDB connection)
- cors (cross-origin requests)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- dotenv (environment variables)

## Step 3: Seed Your Menu Data

Run this command to populate your MongoDB with menu items:

```bash
npm run seed
```

This will:
- Connect to your MongoDB Atlas database
- Clear any existing menu items
- Insert all 24 menu items from your website

## Step 4: Start the Backend Server

```bash
npm start
```

Or for development (auto-restart on changes):
```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on port 5000
🌐 Health check: http://localhost:5000/api/health
```

## Step 5: Test Your Backend

Open your browser and go to:
- **Health Check**: http://localhost:5000/api/health
- **Menu Items**: http://localhost:5000/api/menu

You should see JSON responses with your data!

## Step 6: Update Frontend to Use MongoDB Backend

I'll create new JavaScript files that connect to your MongoDB backend instead of Firebase.

## API Endpoints Available

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single menu item
- `GET /api/menu/category/:category` - Get items by category

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update item quantity
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get single order
- `PUT /api/orders/:orderId/cancel` - Cancel order

## Troubleshooting

### Connection Issues
- Make sure your MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check your username and password are correct
- Ensure your cluster is running

### Port Issues
- If port 5000 is busy, change `PORT=5001` in `.env` file

### CORS Issues
- Make sure `FRONTEND_URL` in `.env` matches your frontend URL

## Next Steps

1. ✅ Complete MongoDB Atlas setup
2. ✅ Update `.env` with your connection string
3. ✅ Install dependencies (`npm install`)
4. ✅ Seed menu data (`npm run seed`)
5. ✅ Start backend server (`npm start`)
6. ✅ Test API endpoints
7. 🔄 Update frontend to use MongoDB (I'll help with this)

Once your backend is running, let me know and I'll create the frontend code to connect to MongoDB instead of Firebase! 🎉