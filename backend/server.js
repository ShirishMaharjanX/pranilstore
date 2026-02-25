const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DB_FILE = path.join(__dirname, 'database.json');

function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            customers: [], orders: [], order_items: [],
            companies: [
                { id: 1, name: "Tech Solutions", logo: "🔧", bgColor: "#667eea", isActive: true, headerImage: "" },
                { id: 2, name: "Home Essentials", logo: "🏠", bgColor: "#f093fb", isActive: true, headerImage: "" },
                { id: 3, name: "Fashion Hub", logo: "👔", bgColor: "#4facfe", isActive: true, headerImage: "" },
                { id: 4, name: "Beauty Care", logo: "💄", bgColor: "#43e97b", isActive: true, headerImage: "" },
                { id: 5, name: "Sports Gear", logo: "⚽", bgColor: "#fa709a", isActive: true, headerImage: "" },
                { id: 6, name: "Books Corner", logo: "📚", bgColor: "#30cfd0", isActive: true, headerImage: "" },
                { id: 7, name: "Pet Paradise", logo: "🐾", bgColor: "#a8edea", isActive: true, headerImage: "" },
                { id: 8, name: "Garden Tools", logo: "🌱", bgColor: "#ff9a56", isActive: true, headerImage: "" },
                { id: 9, name: "Baby World", logo: "👶", bgColor: "#2e2e78", isActive: true, headerImage: "" },
                { id: 10, name: "Office Supplies", logo: "📎", bgColor: "#000000", isActive: true, headerImage: "" }
            ],
            products: [
                { id: 101, companyId: 1, name: "Wireless Mouse", price: 1299, gram: "120g", stock: 50, image: "🖱️", isActive: true },
                { id: 102, companyId: 1, name: "Mechanical Keyboard", price: 4999, gram: "980g", stock: 30, image: "⌨️", isActive: true },
                { id: 103, companyId: 1, name: "USB Hub", price: 899, gram: "85g", stock: 100, image: "🔌", isActive: true },
                { id: 201, companyId: 2, name: "Kitchen Knife Set", price: 2499, gram: "450g", stock: 25, image: "🔪", isActive: true },
                { id: 202, companyId: 2, name: "Glass Storage Jars", price: 799, gram: "1200g", stock: 60, image: "🫙", isActive: true },
                { id: 203, companyId: 2, name: "LED Bulbs Pack", price: 599, gram: "240g", stock: 150, image: "💡", isActive: true },
                { id: 301, companyId: 3, name: "Cotton T-Shirt", price: 599, gram: "180g", stock: 75, image: "👕", isActive: true },
                { id: 302, companyId: 3, name: "Denim Jeans", price: 1999, gram: "550g", stock: 40, image: "👖", isActive: true },
                { id: 303, companyId: 3, name: "Sneakers", price: 2499, gram: "800g", stock: 35, image: "👟", isActive: true },
                { id: 401, companyId: 4, name: "Face Cream", price: 899, gram: "50g", stock: 80, image: "🧴", isActive: true },
                { id: 402, companyId: 4, name: "Shampoo", price: 449, gram: "200ml", stock: 100, image: "🧴", isActive: true },
                { id: 403, companyId: 4, name: "Lipstick", price: 599, gram: "4g", stock: 60, image: "💄", isActive: true },
                { id: 501, companyId: 5, name: "Yoga Mat", price: 1299, gram: "1200g", stock: 45, image: "🧘", isActive: true },
                { id: 502, companyId: 5, name: "Dumbbells Set", price: 2999, gram: "5000g", stock: 20, image: "🏋️", isActive: true },
                { id: 503, companyId: 5, name: "Resistance Bands", price: 799, gram: "150g", stock: 70, image: "🎽", isActive: true },
                { id: 601, companyId: 6, name: "Fiction Novel", price: 399, gram: "350g", stock: 90, image: "📖", isActive: true },
                { id: 602, companyId: 6, name: "Cookbook", price: 699, gram: "600g", stock: 50, image: "📕", isActive: true },
                { id: 603, companyId: 6, name: "Self-Help Guide", price: 499, gram: "280g", stock: 65, image: "📗", isActive: true },
                { id: 701, companyId: 7, name: "Dog Food", price: 1499, gram: "3000g", stock: 40, image: "🦴", isActive: true },
                { id: 702, companyId: 7, name: "Cat Toy", price: 299, gram: "50g", stock: 85, image: "🐱", isActive: true },
                { id: 703, companyId: 7, name: "Pet Bed", price: 1999, gram: "1500g", stock: 25, image: "🛏️", isActive: true },
                { id: 801, companyId: 8, name: "Plant Seeds", price: 199, gram: "20g", stock: 150, image: "🌾", isActive: true },
                { id: 802, companyId: 8, name: "Watering Can", price: 599, gram: "400g", stock: 55, image: "💧", isActive: true },
                { id: 803, companyId: 8, name: "Garden Gloves", price: 299, gram: "100g", stock: 70, image: "🧤", isActive: true },
                { id: 901, companyId: 9, name: "Baby Bottle", price: 399, gram: "150g", stock: 80, image: "🍼", isActive: true },
                { id: 902, companyId: 9, name: "Diapers Pack", price: 899, gram: "2000g", stock: 60, image: "🧷", isActive: true },
                { id: 903, companyId: 9, name: "Baby Wipes", price: 249, gram: "500g", stock: 100, image: "🧻", isActive: true },
                { id: 1001, companyId: 10, name: "Notebook", price: 149, gram: "200g", stock: 120, image: "📓", isActive: true },
                { id: 1002, companyId: 10, name: "Pen Set", price: 299, gram: "80g", stock: 90, image: "🖊️", isActive: true },
                { id: 1003, companyId: 10, name: "Desk Organizer", price: 799, gram: "600g", stock: 45, image: "📋", isActive: true }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function readDB() { initDB(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function simpleHash(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; } return hash.toString(); }

app.get('/api/companies', (req, res) => res.json(readDB().companies.filter(c => c.isActive)));
app.get('/api/companies/:id', (req, res) => { const c = readDB().companies.find(c => c.id === parseInt(req.params.id) && c.isActive); return c ? res.json(c) : res.status(404).json({ error: 'Not found' }); });
app.post('/api/companies', (req, res) => { const db = readDB(); const { name, logo, bgColor, image } = req.body; const company = { id: Math.max(0, ...db.companies.map(c => c.id)) + 1, name, logo: logo || '🏪', bgColor: bgColor || '#000000', image: image || '', isActive: true, headerImage: '' }; db.companies.push(company); writeDB(db); res.status(201).json(company); });
app.patch('/api/companies/:id', (req, res) => { const db = readDB(); const idx = db.companies.findIndex(c => c.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ error: 'Not found' }); Object.assign(db.companies[idx], req.body); writeDB(db); res.json(db.companies[idx]); });
app.delete('/api/companies/:id', (req, res) => { const db = readDB(); const idx = db.companies.findIndex(c => c.id === parseInt(req.params.id)); if (idx !== -1) { db.companies[idx].isActive = false; writeDB(db); } res.json({ success: true }); });

app.get('/api/products', (req, res) => { let products = readDB().products.filter(p => p.isActive); if (req.query.companyId) products = products.filter(p => p.companyId === parseInt(req.query.companyId)); res.json(products); });
app.get('/api/products/:id', (req, res) => { const p = readDB().products.find(p => p.id === parseInt(req.params.id) && p.isActive); return p ? res.json(p) : res.status(404).json({ error: 'Not found' }); });
app.post('/api/products', (req, res) => { const db = readDB(); const { companyId, name, price, gram, stock, image } = req.body; const product = { id: Math.max(0, ...db.products.map(p => p.id)) + 1, companyId: parseInt(companyId), name, price: parseFloat(price), gram: gram || '', stock: parseInt(stock) || 0, image: image || '', isActive: true }; db.products.push(product); writeDB(db); res.status(201).json(product); });
app.patch('/api/products/:id', (req, res) => { const db = readDB(); const idx = db.products.findIndex(p => p.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ error: 'Not found' }); Object.assign(db.products[idx], req.body); writeDB(db); res.json(db.products[idx]); });
app.delete('/api/products/:id', (req, res) => { const db = readDB(); const idx = db.products.findIndex(p => p.id === parseInt(req.params.id)); if (idx !== -1) { db.products[idx].isActive = false; writeDB(db); } res.json({ success: true }); });

app.post('/api/register', (req, res) => { const db = readDB(); const { name, email, phone, location, pan, password } = req.body; if (!email || !password) return res.status(400).json({ error: 'Missing fields' }); if (db.customers.find(c => c.email === email)) return res.status(409).json({ error: 'Email exists' }); const customer = { id: `CUST-${Date.now()}`, email, passwordHash: simpleHash(password), name, phone, location, pan: pan || '', isActive: true, createdAt: new Date().toISOString() }; db.customers.push(customer); writeDB(db); res.json({ success: true, customer: { customerId: customer.id, name, email, phone, location, pan } }); });
app.post('/api/login', (req, res) => { const db = readDB(); const { email, password } = req.body; const customer = db.customers.find(c => c.email === email && c.isActive); if (!customer || simpleHash(password) !== customer.passwordHash) return res.status(401).json({ error: 'Invalid credentials' }); res.json({ success: true, customer: { customerId: customer.id, name: customer.name, email: customer.email, phone: customer.phone, location: customer.location, pan: customer.pan } }); });
app.get('/api/customer/:id', (req, res) => { const c = readDB().customers.find(c => c.id === req.params.id && c.isActive); return c ? res.json({ customerId: c.id, name: c.name, email: c.email, phone: c.phone, location: c.location, pan: c.pan }) : res.status(404).json({ error: 'Not found' }); });
app.patch('/api/customer/:id', (req, res) => { const db = readDB(); const idx = db.customers.findIndex(c => c.id === req.params.id && c.isActive); if (idx === -1) return res.status(404).json({ error: 'Not found' }); Object.assign(db.customers[idx], req.body); writeDB(db); res.json({ success: true, customer: db.customers[idx] }); });
app.patch('/api/customer/:id/password', (req, res) => { const db = readDB(); const idx = db.customers.findIndex(c => c.id === req.params.id && c.isActive); if (idx === -1) return res.status(404).json({ error: 'Not found' }); if (simpleHash(req.body.oldPassword) !== db.customers[idx].passwordHash) return res.status(400).json({ error: 'Wrong password' }); db.customers[idx].passwordHash = simpleHash(req.body.newPassword); writeDB(db); res.json({ success: true }); });

app.get('/api/stats', (req, res) => { const db = readDB(); const revenue = db.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0); res.json({ companies: db.companies.filter(c => c.isActive).length, products: db.products.filter(p => p.isActive).length, orders: db.orders.length, revenue }); });
app.get('/api/orders', (req, res) => res.json(readDB().orders));
app.get('/api/orders/customer/:customerId', (req, res) => res.json(readDB().orders.filter(o => o.customerId === req.params.customerId)));
app.get('/api/stats/customer/:customerId', (req, res) => { const orders = readDB().orders.filter(o => o.customerId === req.params.customerId); res.json({ totalOrders: orders.length, totalSpent: orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0), averageOrderValue: orders.length ? orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0) / orders.length : 0 }); });
app.post('/api/orders', (req, res) => { const db = readDB(); const { customerId, customer, items, total } = req.body; const order = { id: `ORD-${Date.now()}`, customerId, customer, items, total, status: 'completed', createdAt: new Date().toISOString() }; db.orders.push(order); writeDB(db); res.json({ success: true, orderId: order.id }); });
app.post('/api/print-order', (req, res) => res.json({ success: true }));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Pranil Store running at http://localhost:${PORT}`);
        console.log('📦 Admin Password: admin123\n');
    });
}

module.exports = app;
module.exports.handler = serverless(app);


