# Pranil Sales & Marketing - E-Commerce Platform

A modern, professional e-commerce platform built with Node.js, Express, and vanilla JavaScript. Perfect for small to medium-sized businesses selling products online.

## 🎯 Features

### 🛍️ Shopping Experience
- **Multi-Company Support**: Browse products from multiple partner companies
- **Search Functionality**: Real-time search across all products
- **Product Details**: View detailed product information including price, weight, and stock status
- **Shopping Cart**: Add/remove products and manage your orders
- **Order Checkout**: Simple checkout process with customer information

### 👤 User Management
- **Customer Registration**: Create new customer accounts with validation
- **Customer Login**: Secure login with password management
- **Profile Management**: Update customer information anytime
- **Order History**: View all previous orders and spending statistics
- **Dashboard**: Personalized customer dashboard with statistics

### 🔐 Admin Panel
- **Admin Access**: Secure admin panel with password protection
- **Company Management**: Add, edit, and delete product categories (companies)
- **Product Management**: Full CRUD operations for products
  - Add new products with details
  - Edit existing product information
  - Delete products from inventory
  - Track stock levels
- **Order Management**: View and manage all customer orders
- **Dashboard Overview**: 
  - Total companies and products
  - Revenue tracking
  - Order statistics
  - Inventory alerts (low stock/out of stock)

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ installed
- npm (comes with Node.js)

### Installation

1. **Clone or extract the project**
```bash
cd appstore2html
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

The application will launch at `http://localhost:3000`

## 📊 Admin Access

**Admin Dashboard Password**: `admin123`

To access the admin panel:
1. Click the "Admin" button in the header
2. Enter the password: `admin123`
3. You'll have full access to:
   - Overview/Dashboard
   - Companies management
   - Products management
   - Orders management

## 🎨 User Interface

### Main Pages
- **Home**: Browse all companies and their products
- **Company View**: See all products from a selected company
- **Search Results**: Find specific products across all companies
- **Shopping Cart**: Review items and complete checkout
- **Customer Dashboard**: View profile and order history

### Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Professional Theme**: Clean, modern interface suitable for businesses
- **Real-time Notifications**: Toast notifications for user actions
- **Smooth Animations**: Polished user experience with transitions

## 💾 Data Storage

The application uses a simple JSON file (`backend/database.json`) for data storage:
- **Companies**: Partner company/category information
- **Products**: Product inventory with prices and stock levels
- **Customers**: User account information
- **Orders**: Complete order history with items and totals

## 🏗️ Project Structure

```
appstore2html/
├── backend/
│   ├── server.js           # Express server and API routes
│   └── database.json       # JSON database (auto-created)
├── frontend/
│   ├── index.html          # Main HTML structure
│   ├── style.css           # Professional styling
│   ├── app.js              # Main application logic
│   ├── app-config.js       # Configuration file
│   ├── storage.js          # Data management layer
│   ├── cart.js             # Shopping cart functionality
│   ├── auth.js             # Authentication & user management
│   ├── admin.js            # Admin panel functionality
│   ├── sw.js               # Service Worker (PWA)
│   ├── manifest.json       # PWA manifest
│   └── storage.json        # Local storage cache
└── package.json            # Project dependencies
```

## 🔌 API Endpoints

### Companies
- `GET /api/companies` - Get all active companies
- `GET /api/companies/:id` - Get specific company
- `POST /api/companies` - Create new company (admin)
- `PATCH /api/companies/:id` - Update company (admin)
- `DELETE /api/companies/:id` - Delete company (admin)

### Products
- `GET /api/products` - Get all products (with optional company filter)
- `GET /api/products/:id` - Get specific product
- `POST /api/products` - Create new product (admin)
- `PATCH /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Customer Management
- `POST /api/register` - Register new customer
- `POST /api/login` - Customer login
- `GET /api/customer/:id` - Get customer details
- `PATCH /api/customer/:id` - Update customer profile
- `PATCH /api/customer/:id/password` - Change password

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/customer/:customerId` - Get customer orders
- `GET /api/stats/customer/:customerId` - Get customer statistics

### Statistics
- `GET /api/stats` - Get overall platform statistics

## 🎓 Sample Data

The database comes pre-populated with:
- **10 Companies**: Tech Solutions, Home Essentials, Fashion Hub, Beauty Care, Sports Gear, Books Corner, Pet Paradise, Garden Tools, Baby World, Office Supplies
- **30 Products**: 3 products per company with realistic pricing
- **Inventory**: Varied stock levels to demonstrate low/out-of-stock features

## 🔒 Security Features

- **Session-based Authentication**: Uses session storage for user sessions
- **Admin Password Protection**: Admin panel requires password
- **Password Hashing**: Simple hash algorithm for password storage (consider upgrading for production)
- **Input Validation**: Client-side and server-side validation

## 📱 Progressive Web App

The application is PWA-ready with:
- Service Worker for offline capability
- Web manifest for installation
- Progressive enhancement

## 🎯 Customization

### Adding Your Company Logo
Edit the `brand-icon` SVG in `index.html` or replace with your own

### Changing Colors
Modify CSS variables in `style.css`:
```css
--color-primary: #000000;
--color-accent: #667eea;
```

### Custom Stock Thresholds
Edit product stock status logic in `app.js`:
```javascript
let stockClass = product.stock > 10 ? 'in-stock' : ...
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is occupied:
```bash
PORT=3001 npm start
```

### Database Reset
Delete `backend/database.json` to reset the database with sample data

### Service Worker Issues
Clear browser cache and reload the application

## 📈 Future Enhancements

Potential features to add:
- Multiple payment gateway integration
- Email notifications
- Inventory management with alerts
- Product ratings and reviews
- Wishlist functionality
- Advanced analytics and reporting
- Multi-language support
- International shipping

## 📄 License

This project is provided as-is for commercial use.

## 🤝 Support

For issues or feature requests, please refer to the code documentation and inline comments.

---

**Built with ❤️ for Pranil Sales & Marketing**

Version 1.0.0 | Created: 2026
