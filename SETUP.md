# Quick Start Guide

## Installation & Setup

### Step 1: Check Prerequisites
- Ensure Node.js is installed: `node --version`
- Ensure npm is installed: `npm --version`

### Step 2: Navigate to Project
```bash
cd c:\appstore2html
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start Server
```bash
npm start
```

You should see:
```
🚀 Pranil Store running at http://localhost:3000
📦 Admin Password: admin123
```

### Step 5: Open Browser
Visit `http://localhost:3000` in your web browser

## Default Admin Credentials
- **Password**: `admin123`
- Click "Admin" button in header to access the admin panel

## First-Time Features

### Browse Products
1. Home page shows all companies
2. Click any company to see their products
3. Use search bar to find specific items

### Customer Account
1. Click "Get Started" to register
2. Fill in your details (name, email, phone, etc.)
3. Create an account

### Shopping
1. Click "Add to Cart" on products
2. Click cart icon to view items
3. Enter delivery details
4. Complete purchase

### Admin Panel
1. Click "Admin" button
2. Enter password: `admin123`
3. Access Dashboard, Companies, Products, and Orders

## Sample Data Included

The application comes with:
- 10 sample companies (product categories)
- 30 sample products (3 per company)
- Sample orders (if any were placed during testing)
- Pre-configured admin access

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
$env:PORT=3001
npm start
```

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
```

### Website Showing Blank
1. Check browser console (F12) for errors
2. Ensure server is running (check terminal)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try a different browser

### Admin Panel Not Loading
1. Verify correct password: `admin123`
2. Check browser console for JavaScript errors
3. Ensure server is running and database exists

## Additional Commands

```bash
# Start in development mode
npm run dev

# View logs
npm start (watch terminal output)

# Kill server (if it's running)
Ctrl+C (in terminal)
```

## Features Checklist

- ✅ Browse Companies
- ✅ View Products
- ✅ Search Functionality
- ✅ Shopping Cart
- ✅ Customer Registration
- ✅ Customer Login
- ✅ Order Checkout
- ✅ Customer Dashboard
- ✅ Order History
- ✅ Admin Panel
- ✅ Company Management
- ✅ Product Management
- ✅ Order Management
- ✅ Dashboard Overview

## Next Steps

1. **Customize**: Edit company names, logos, and product details in admin panel
2. **Add Products**: Use admin panel to add more products
3. **Process Orders**: View customer orders in admin panel
4. **Monitor Stats**: Check dashboard for business metrics

---

For detailed documentation, see `README.md`
