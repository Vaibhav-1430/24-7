# 24x7 Cafe - Food Ordering Website

A modern, responsive food ordering website designed specifically for college students to order food from their hostels 24/7.

## 🚀 Features

### Student Features
- **User Authentication**: Login/Signup with email or phone number
- **Browse Menu**: View food items organized by categories (Noodles, Veg Manchurian & Gravy, Rolls, Momos, Rice, Extra, Om Let & Maggi, Parathas, Drinks & Snacks)
- **Full/Half Options**: Select full or half portions where available
- **Shopping Cart**: Add/remove items, adjust quantities, special instructions
- **Checkout Process**: Enter delivery details, choose payment method
- **Order Tracking**: View order status (Received, Preparing, Ready, Delivered)
- **Responsive Design**: Mobile-first design optimized for all devices

### Admin Features
- **Admin Dashboard**: Overview of orders, revenue, and statistics
- **Order Management**: View and update order status in real-time
- **Menu Management**: Add, edit, delete, and toggle availability of menu items
- **Analytics**: View popular items and sales insights

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with Flexbox and Grid
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Poppins)
- **Storage**: LocalStorage (for demo purposes)
- **Responsive**: Mobile-first design approach

## 📁 Project Structure

```
24-7-restaurant/
├── index.html              # Home page
├── menu.html               # Menu browsing page
├── cart.html               # Shopping cart page
├── checkout.html           # Checkout process page
├── login.html              # User login page
├── signup.html             # User registration page
├── admin.html              # Admin dashboard
├── css/
│   ├── style.css           # Main stylesheet
│   ├── menu.css            # Menu page styles
│   ├── cart.css            # Cart page styles
│   ├── checkout.css        # Checkout page styles
│   ├── auth.css            # Authentication pages styles
│   └── admin.css           # Admin dashboard styles
├── js/
│   ├── app.js              # Main application logic
│   ├── menu.js             # Menu page functionality
│   ├── cart.js             # Cart management
│   ├── checkout.js         # Checkout process
│   ├── auth.js             # Authentication logic
│   └── admin.js            # Admin dashboard functionality
├── images/                 # Image assets (placeholder folder)
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for better development experience)

### Installation

1. **Clone or download the project files**
   ```bash
   git clone <repository-url>
   cd 24-7-restaurant
   ```

2. **Open with a local server** (recommended)
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have live-server installed)
   npx live-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Or open directly in browser**
   - Simply open `index.html` in your web browser

### Demo Credentials

**Student Demo Login:**
- Click "Demo Student Login" button on login page
- Or use any email/password combination (demo mode)

**Admin Access:**
- Navigate to `/admin.html`
- Password: `admin123`

## 📱 Pages Overview

### 1. Home Page (`index.html`)
- Restaurant introduction and branding
- Popular menu items preview
- Call-to-action buttons
- Feature highlights

### 2. Menu Page (`menu.html`)
- Category-based filtering (All, Snacks, Meals, Beverages)
- Search functionality
- Item details with add-to-cart modal
- Quantity selection and special instructions

### 3. Cart Page (`cart.html`)
- Review selected items
- Quantity adjustment
- Remove items
- Price breakdown with taxes and delivery fee
- Proceed to checkout

### 4. Checkout Page (`checkout.html`)
- Delivery information form
- Contact details
- Payment method selection (COD/UPI)
- Order summary and confirmation

### 5. Authentication Pages
- **Login** (`login.html`): User login with demo option
- **Signup** (`signup.html`): New user registration

### 6. Admin Dashboard (`admin.html`)
- Order management and status updates
- Menu item management (CRUD operations)
- Sales analytics and popular items
- Real-time dashboard statistics

## 🎨 Design Features

### Color Scheme
- Primary: #e74c3c (Red)
- Secondary: #3498db (Blue)
- Success: #27ae60 (Green)
- Background: #f8f9fa (Light Gray)

### Typography
- Font Family: Poppins (Google Fonts)
- Responsive font sizes
- Clear hierarchy and readability

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 968px
- Flexible grid layouts
- Touch-friendly interface

## 💾 Data Management

### LocalStorage Structure
```javascript
// User session
currentUser: {
  id: string,
  name: string,
  email: string,
  phone: string,
  hostel: string,
  roomNumber: string
}

// Shopping cart
cart: [{
  id: number,
  name: string,
  price: number,
  quantity: number,
  instructions: string
}]

// Orders
orders: [{
  id: string,
  userId: string,
  items: array,
  delivery: object,
  contact: object,
  payment: object,
  pricing: object,
  status: string,
  orderTime: string
}]

// Menu items (admin)
adminMenuItems: [menu_item_objects]
```

## 🔧 Customization

### Adding New Menu Items
1. Access admin dashboard (`/admin.html`)
2. Navigate to "Menu Management"
3. Click "Add New Item"
4. Fill in item details and save

### Modifying Styles
- Edit CSS files in the `/css/` directory
- Main styles: `style.css`
- Page-specific styles: individual CSS files

### Adding New Features
- JavaScript files are modular and well-commented
- Add new functionality in appropriate JS files
- Follow existing code patterns and naming conventions

## 🚀 Deployment

### Static Hosting (Recommended)
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Enable in repository settings
- **Firebase Hosting**: Use Firebase CLI

### Traditional Web Hosting
- Upload all files to web server
- Ensure proper file permissions
- No server-side requirements

## 🔮 Future Enhancements

### Backend Integration
- Replace LocalStorage with proper database
- Implement real user authentication
- Add payment gateway integration
- Real-time order notifications

### Additional Features
- Order history and reordering
- User reviews and ratings
- Loyalty points system
- Push notifications
- GPS-based delivery tracking

### Technical Improvements
- Progressive Web App (PWA) features
- Offline functionality
- Performance optimizations
- SEO enhancements

## 🐛 Known Limitations

1. **Data Persistence**: Uses LocalStorage (data lost on browser clear)
2. **Authentication**: Simplified demo authentication
3. **Payment**: Mock payment system
4. **Real-time Updates**: No server-side real-time features
5. **Image Handling**: Placeholder images used

## 📄 License

This project is created for educational and demonstration purposes. Feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the code comments for implementation details
- Review the browser console for any errors
- Ensure all files are properly linked and accessible

---

**Built with ❤️ for college students who love good food!**