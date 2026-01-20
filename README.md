# 🍽️ 24x7 Cafe - College Food Ordering System

A modern, responsive web application for college students to order food online with real-time order tracking and admin management.

## 🚀 Live Demo

**Website:** [https://24x7-cafe.netlify.app](https://24x7-cafe.netlify.app)

## ✨ Features

### For Students
- 🔐 **Secure Authentication** - Sign up and login with JWT tokens
- 🍕 **Browse Menu** - View categorized food items with images and descriptions
- 🛒 **Smart Cart Management** - Add, remove, and modify items with real-time updates
- 💳 **Multiple Payment Options** - Cash on Delivery (COD) and UPI payments
- 📱 **Mobile Responsive** - Optimized for all devices
- 📋 **Order Tracking** - Real-time order status updates
- 🏠 **Hostel Delivery** - Specify hostel and room number for accurate delivery

### For Admins
- 📊 **Dashboard Analytics** - View sales, orders, and popular items
- 📝 **Order Management** - Update order status and track deliveries
- 🍽️ **Menu Management** - Add, edit, and manage food items
- 👥 **User Management** - View and manage customer accounts
- 📈 **Sales Reports** - Track revenue and performance metrics

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **Vanilla JavaScript** - Clean, dependency-free code
- **Font Awesome** - Icons and visual elements
- **Google Fonts** - Typography (Poppins)

### Backend
- **Netlify Functions** - Serverless backend
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Deployment
- **Netlify** - Static site hosting and serverless functions
- **MongoDB Atlas** - Database hosting
- **Git** - Version control

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Netlify account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/24x7-cafe.git
   cd 24x7-cafe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your MongoDB connection string and JWT secret:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secure-jwt-secret-key
   NODE_ENV=development
   FRONTEND_URL=http://localhost:8888
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:8888
   ```

## 🌐 Deployment

### Netlify Deployment

1. **Connect to Netlify**
   - Fork this repository
   - Connect your GitHub account to Netlify
   - Import the repository

2. **Configure Environment Variables**
   In Netlify dashboard, go to Site settings > Environment variables and add:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   FRONTEND_URL=https://your-site.netlify.app
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
24x7-cafe/
├── css/                    # Stylesheets
├── js/                     # JavaScript files
├── netlify/functions/      # Serverless functions
│   ├── models/            # Database models
│   ├── utils/             # Utility functions
│   └── *.js               # API endpoints
├── images/                 # Static images
├── *.html                 # HTML pages
├── netlify.toml           # Netlify configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured for specific origins
- **Environment Variables** - Sensitive data stored securely

## 📱 Mobile Responsiveness

- **Responsive Design** - Works on all screen sizes
- **Touch-Friendly** - Optimized for mobile interactions
- **Fast Loading** - Optimized images and minimal dependencies

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI in environment variables
   - Verify IP whitelist in MongoDB Atlas

2. **Authentication Not Working**
   - Verify JWT_SECRET is set and > 32 characters
   - Check browser localStorage for tokens

3. **Orders Not Creating**
   - Check cart has items before checkout
   - Verify all required fields are filled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, create an issue in the GitHub repository.

---

**Made with ❤️ for college students**