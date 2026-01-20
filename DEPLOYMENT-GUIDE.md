# 24x7 Cafe - Netlify Full-Stack Deployment Guide

## Overview
This guide will help you deploy the complete 24x7 Cafe food ordering system on Netlify using:
- **Frontend**: Static HTML/CSS/JS files
- **Backend**: Netlify Functions (Serverless)
- **Database**: MongoDB Atlas (Cloud database)

## Prerequisites
- MongoDB Atlas account
- Netlify account
- Git repository

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new account or sign in
3. Create a new cluster (Free tier is sufficient for testing)
4. Choose your preferred cloud provider and region
5. Wait for cluster creation (5-10 minutes)

### 1.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with username and password
4. Set permissions to "Read and write to any database"
5. Click "Add User"

### 1.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for production
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `24x7cafe`

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/24x7cafe?retryWrites=true&w=majority`

## Step 2: Deploy to Netlify

### 2.1 Prepare Your Repository
1. Ensure all files are in your Git repository
2. Make sure `netlify.toml` and `package.json` are in the root
3. Verify all Netlify Functions are in `netlify/functions/` directory

### 2.2 Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com)
2. Sign in and click "New site from Git"
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm install`
   - Publish directory: `.` (root)
   - Functions directory: `netlify/functions`
5. Click "Deploy site"

### 2.3 Set Environment Variables
1. Go to your site dashboard on Netlify
2. Navigate to "Site settings" → "Environment variables"
3. Add the following variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/24x7cafe?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=production
```

### 2.4 Seed the Database
1. After deployment, visit: `https://your-site.netlify.app/.netlify/functions/seed-menu`
2. This will populate your database with menu items
3. You should see a success message with the count of items added

## Step 3: Test Your Deployment

### 3.1 Test API Endpoints
Visit these URLs to test your functions:
- Health check: `https://your-site.netlify.app/.netlify/functions/health`
- Menu items: `https://your-site.netlify.app/.netlify/functions/menu`

### 3.2 Test Frontend
1. Visit your Netlify site URL
2. Test user registration and login
3. Browse menu and add items to cart
4. Complete an order to test the full flow

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain
1. Go to "Domain settings" in your Netlify dashboard
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions

### 4.2 Enable HTTPS
1. Netlify automatically provides SSL certificates
2. Ensure "Force HTTPS" is enabled in domain settings

## Step 5: Monitoring and Maintenance

### 5.1 Function Logs
- View function logs in Netlify dashboard under "Functions"
- Monitor for errors and performance issues

### 5.2 Database Monitoring
- Use MongoDB Atlas monitoring dashboard
- Set up alerts for connection issues or high usage

### 5.3 Site Analytics
- Enable Netlify Analytics for traffic insights
- Monitor site performance and user behavior

## Troubleshooting

### Common Issues

1. **Function Timeout**
   - Netlify Functions have a 10-second timeout limit
   - Optimize database queries for better performance

2. **CORS Errors**
   - Ensure all functions include proper CORS headers
   - Check that frontend is making requests to correct URLs

3. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network access settings in Atlas
   - Ensure environment variables are set correctly

4. **Build Failures**
   - Check build logs in Netlify dashboard
   - Verify all dependencies are listed in package.json
   - Ensure Node.js version compatibility

### Debug Steps
1. Check Netlify function logs
2. Test API endpoints directly in browser
3. Verify environment variables are set
4. Check MongoDB Atlas connection and logs
5. Use browser developer tools for frontend debugging

## Environment Variables Summary

Set these in Netlify dashboard under Site Settings → Environment Variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/24x7cafe?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=production
```

## File Structure

Your deployed site will have this structure:
```
netlify-site/
├── index.html, menu.html, cart.html, etc.    # Frontend files
├── css/, js/, images/                         # Static assets
├── netlify.toml                               # Netlify configuration
├── package.json                               # Dependencies
└── netlify/functions/                         # Serverless functions
    ├── health.js                              # Health check
    ├── auth-signup.js, auth-login.js          # Authentication
    ├── menu.js                                # Menu operations
    ├── cart.js                                # Cart operations
    ├── orders.js                              # Order operations
    ├── seed-menu.js                           # Database seeding
    ├── models/                                # Database models
    └── utils/                                 # Shared utilities
```

## Benefits of Netlify Deployment

1. **Serverless**: No server management required
2. **Scalable**: Automatically scales with traffic
3. **Fast**: Global CDN for static assets
4. **Secure**: HTTPS by default
5. **Cost-effective**: Pay only for function executions
6. **Easy deployment**: Git-based deployment workflow

## Performance Optimization

1. **Database Connection Pooling**: Implemented in utils/db.js
2. **Function Caching**: MongoDB connections are cached
3. **Static Asset Optimization**: Netlify automatically optimizes assets
4. **Global CDN**: Fast content delivery worldwide

## Security Features

1. **JWT Authentication**: Secure token-based auth
2. **CORS Protection**: Proper CORS headers
3. **Input Validation**: Server-side validation
4. **Environment Variables**: Secure secret management
5. **HTTPS**: SSL encryption by default

---

**Your 24x7 Cafe is now fully deployed on Netlify with serverless backend!**