# 24x7 Cafe - Food Ordering System

A modern, responsive food ordering website for college/university cafeterias with student and admin features.

## 🚀 Features

### For Students
- **Browse Menu**: View categorized food items with prices
- **User Authentication**: Secure signup and login system
- **Shopping Cart**: Add items, modify quantities, and manage orders
- **Order Placement**: Complete checkout with delivery details
- **Order History**: View past orders and reorder functionality
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### For Administrators
- **Admin Dashboard**: Manage orders and view statistics
- **Order Management**: Update order status and track deliveries
- **Menu Management**: Add, edit, and remove menu items
- **User Management**: View registered users

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Icons and UI elements
- **Google Fonts**: Typography

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **bcryptjs**: Password hashing

## 📁 Project Structure

```
24x7-cafe/
├── index.html              # Homepage
├── menu.html              # Menu browsing page
├── cart.html              # Shopping cart page
├── checkout.html          # Order checkout page
├── login.html             # User login page
├── signup.html            # User registration page
├── orders.html            # Order history page
├── admin.html             # Admin dashboard
├── css/                   # Stylesheets
│   ├── style.css         # Main styles
│   ├── menu.css          # Menu page styles
│   ├── cart.css          # Cart page styles
│   ├── checkout.css      # Checkout page styles
│   ├── orders.css        # Orders page styles
│   └── admin.css         # Admin page styles
├── js/                    # JavaScript files
│   ├── config.js         # Configuration settings
│   ├── api-client.js     # API communication
│   ├── auth-manager-clean.js  # Authentication management
│   ├── cart-manager-clean.js  # Cart management
│   ├── app.js            # Main application logic
│   ├── menu.js           # Menu page functionality
│   ├── cart.js           # Cart page functionality
│   ├── checkout.js       # Checkout functionality
│   ├── orders.js         # Orders page functionality
│   └── admin.js          # Admin functionality
├── images/                # Image assets
├── backend/               # Backend server
│   ├── server.js         # Main server file
│   ├── package.json      # Dependencies
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── .env.example      # Environment variables template
└── DEPLOYMENT-GUIDE.md    # Production deployment guide
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/your-username/24x7-cafe.git
cd 24x7-cafe
```

2. **Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string
npm start
```

3. **Set up the frontend**
```bash
# Open another terminal in the root directory
# Serve the frontend using any static server
npx http-server -p 8080
```

4. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

### Production Deployment

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed production deployment instructions.

## 🔧 Configuration

### Environment Variables (Backend)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
FRONTEND_URL=your_frontend_url
PORT=5000
```

### Frontend Configuration
Update `js/config.js` with your production API URL:
```javascript
API_BASE_URL: 'https://your-backend-url.herokuapp.com/api'
```

## 📱 Menu Items

The system comes with a pre-configured menu including:
- **Noodles**: Various noodle dishes
- **Veg Manchurian & Gravy**: Vegetarian options
- **Rolls**: Different types of rolls
- **Momos**: Steamed and fried varieties
- **Rice**: Rice-based dishes
- **Parathas**: Indian flatbreads
- **Drinks & Snacks**: Beverages and light snacks

## 🔐 Authentication

- **JWT-based authentication**
- **Secure password hashing with bcrypt**
- **Session management**
- **Role-based access (Student/Admin)**

## 💳 Order Management

- **Sequential order ID generation** (001001, 001002, etc.)
- **Order status tracking** (Received, Preparing, Ready, Delivered)
- **Automatic cart clearing** after successful orders
- **Order history with filtering options**

## 🎨 UI/UX Features

- **Responsive design** for all screen sizes
- **Modern, clean interface**
- **Intuitive navigation**
- **Real-time cart updates**
- **Loading states and error handling**
- **Success notifications**

## 🔒 Security Features

- **Input validation and sanitization**
- **SQL injection prevention**
- **XSS protection**
- **CORS configuration**
- **Secure password storage**
- **JWT token expiration**

## 📊 Admin Features

- **Order management dashboard**
- **Real-time order status updates**
- **User management**
- **Sales analytics**
- **Menu item management**

## 🚀 Performance

- **Optimized images and assets**
- **Minified CSS and JavaScript**
- **Efficient database queries**
- **Caching strategies**
- **CDN integration for fonts and icons**

## 🐛 Troubleshooting

### Common Issues
1. **CORS errors**: Check backend CORS configuration
2. **Database connection**: Verify MongoDB connection string
3. **Authentication issues**: Check JWT secret and token expiration
4. **Cart not updating**: Ensure API endpoints are accessible

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your backend environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@24x7cafe.com
- **Phone**: +91 98765 43210
- **Address**: Campus Food Court, University Campus

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- MongoDB Atlas for database hosting
- All contributors and testers

---

**Made with ❤️ for college students**