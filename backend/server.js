require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const db = require('./database');

const app = express();
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, same-origin)
        // and common local development hosts (IPv4 + IPv6 localhost).
        if (!origin || LOCAL_ORIGIN_PATTERN.test(origin)) {
            return callback(null, true);
        }
        callback(new Error('CORS: origin not allowed'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_FILE = path.join(__dirname, 'database.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DB_SCHEMA_VERSION = 2;
const DEFAULT_CUSTOMER_PREFERENCES = {
    language: 'en',
    currency: 'NPR',
    newsletter: false,
    promotionalEmails: false,
    orderUpdatesBySms: true
};

function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            schemaVersion: DB_SCHEMA_VERSION,
            customers: [],
            customer_sessions: [],
            customer_audit_logs: [],
            password_reset_tokens: [],
            orders: [],
            order_items: [],
            companies: [
                { id: 1, name: "Tech Solutions", logo: "", bgColor: "#667eea", isActive: true, headerImage: "" },
                { id: 2, name: "Home Essentials", logo: "", bgColor: "#f093fb", isActive: true, headerImage: "" },
                { id: 3, name: "Fashion Hub", logo: "", bgColor: "#4facfe", isActive: true, headerImage: "" },
                { id: 4, name: "Beauty Care", logo: "", bgColor: "#43e97b", isActive: true, headerImage: "" },
                { id: 5, name: "Sports Gear", logo: "", bgColor: "#fa709a", isActive: true, headerImage: "" },
                { id: 6, name: "Books Corner", logo: "", bgColor: "#30cfd0", isActive: true, headerImage: "" },
                { id: 7, name: "Pet Paradise", logo: "", bgColor: "#a8edea", isActive: true, headerImage: "" },
                { id: 8, name: "Garden Tools", logo: "", bgColor: "#ff9a56", isActive: true, headerImage: "" },
                { id: 9, name: "Baby World", logo: "", bgColor: "#2e2e78", isActive: true, headerImage: "" },
                { id: 10, name: "Office Supplies", logo: "", bgColor: "#000000", isActive: true, headerImage: "" }
            ],
            products: [
                { id: 101, companyId: 1, name: "Wireless Mouse", price: 1299, gram: "120g", stock: 50, image: "", isActive: true },
                { id: 102, companyId: 1, name: "Mechanical Keyboard", price: 4999, gram: "980g", stock: 30, image: "", isActive: true },
                { id: 103, companyId: 1, name: "USB Hub", price: 899, gram: "85g", stock: 100, image: "", isActive: true },
                { id: 201, companyId: 2, name: "Kitchen Knife Set", price: 2499, gram: "450g", stock: 25, image: "", isActive: true },
                { id: 202, companyId: 2, name: "Glass Storage Jars", price: 799, gram: "1200g", stock: 60, image: "", isActive: true },
                { id: 203, companyId: 2, name: "LED Bulbs Pack", price: 599, gram: "240g", stock: 150, image: "", isActive: true },
                { id: 301, companyId: 3, name: "Cotton T-Shirt", price: 599, gram: "180g", stock: 75, image: "", isActive: true },
                { id: 302, companyId: 3, name: "Denim Jeans", price: 1999, gram: "550g", stock: 40, image: "", isActive: true },
                { id: 303, companyId: 3, name: "Sneakers", price: 2499, gram: "800g", stock: 35, image: "", isActive: true },
                { id: 401, companyId: 4, name: "Face Cream", price: 899, gram: "50g", stock: 80, image: "", isActive: true },
                { id: 402, companyId: 4, name: "Shampoo", price: 449, gram: "200ml", stock: 100, image: "", isActive: true },
                { id: 403, companyId: 4, name: "Lipstick", price: 599, gram: "4g", stock: 60, image: "", isActive: true },
                { id: 501, companyId: 5, name: "Yoga Mat", price: 1299, gram: "1200g", stock: 45, image: "", isActive: true },
                { id: 502, companyId: 5, name: "Dumbbells Set", price: 2999, gram: "5000g", stock: 20, image: "", isActive: true },
                { id: 503, companyId: 5, name: "Resistance Bands", price: 799, gram: "150g", stock: 70, image: "", isActive: true },
                { id: 601, companyId: 6, name: "Fiction Novel", price: 399, gram: "350g", stock: 90, image: "", isActive: true },
                { id: 602, companyId: 6, name: "Cookbook", price: 699, gram: "600g", stock: 50, image: "", isActive: true },
                { id: 603, companyId: 6, name: "Self-Help Guide", price: 499, gram: "280g", stock: 65, image: "", isActive: true },
                { id: 701, companyId: 7, name: "Dog Food", price: 1499, gram: "3000g", stock: 40, image: "", isActive: true },
                { id: 702, companyId: 7, name: "Cat Toy", price: 299, gram: "50g", stock: 85, image: "", isActive: true },
                { id: 703, companyId: 7, name: "Pet Bed", price: 1999, gram: "1500g", stock: 25, image: "", isActive: true },
                { id: 801, companyId: 8, name: "Plant Seeds", price: 199, gram: "20g", stock: 150, image: "", isActive: true },
                { id: 802, companyId: 8, name: "Watering Can", price: 599, gram: "400g", stock: 55, image: "", isActive: true },
                { id: 803, companyId: 8, name: "Garden Gloves", price: 299, gram: "100g", stock: 70, image: "", isActive: true },
                { id: 901, companyId: 9, name: "Baby Bottle", price: 399, gram: "150g", stock: 80, image: "", isActive: true },
                { id: 902, companyId: 9, name: "Diapers Pack", price: 899, gram: "2000g", stock: 60, image: "", isActive: true },
                { id: 903, companyId: 9, name: "Baby Wipes", price: 249, gram: "500g", stock: 100, image: "", isActive: true },
                { id: 1001, companyId: 10, name: "Notebook", price: 149, gram: "200g", stock: 120, image: "", isActive: true },
                { id: 1002, companyId: 10, name: "Pen Set", price: 299, gram: "80g", stock: 90, image: "", isActive: true },
                { id: 1003, companyId: 10, name: "Desk Organizer", price: 799, gram: "600g", stock: 45, image: "", isActive: true }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Failed to write database file:', err);
        throw err;
    }
}
function sanitizeText(value, maxLength = 500) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}
function normalizeBoolean(value, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
}
function normalizePreferences(rawPreferences) {
    const source = (rawPreferences && typeof rawPreferences === 'object') ? rawPreferences : {};
    return {
        language: sanitizeText(source.language, 12) || DEFAULT_CUSTOMER_PREFERENCES.language,
        currency: sanitizeText(source.currency, 12) || DEFAULT_CUSTOMER_PREFERENCES.currency,
        newsletter: normalizeBoolean(source.newsletter, DEFAULT_CUSTOMER_PREFERENCES.newsletter),
        promotionalEmails: normalizeBoolean(source.promotionalEmails, DEFAULT_CUSTOMER_PREFERENCES.promotionalEmails),
        orderUpdatesBySms: normalizeBoolean(source.orderUpdatesBySms, DEFAULT_CUSTOMER_PREFERENCES.orderUpdatesBySms)
    };
}
function normalizeAddress(rawAddress, fallbackLocation = '') {
    const source = (rawAddress && typeof rawAddress === 'object') ? rawAddress : {};
    const line1 = sanitizeText(source.line1, 160);
    const line2 = sanitizeText(source.line2, 160);
    const city = sanitizeText(source.city, 80);
    const state = sanitizeText(source.state, 80);
    const postalCode = sanitizeText(source.postalCode, 20);
    const country = sanitizeText(source.country, 80) || 'Nepal';
    const landmark = sanitizeText(source.landmark, 160);
    const label = sanitizeText(source.label, 40) || 'Primary';
    const recipientName = sanitizeText(source.recipientName, 120);
    const phone = sanitizeText(source.phone, 32);

    if (!line1 && !line2 && !city && !state && !postalCode && !fallbackLocation) {
        return null;
    }

    return {
        label,
        recipientName,
        phone,
        line1: line1 || sanitizeText(fallbackLocation, 160),
        line2,
        city,
        state,
        postalCode,
        country,
        landmark,
        isDefault: normalizeBoolean(source.isDefault, true)
    };
}
function normalizeSecurity(rawSecurity, fallbackLastLoginAt = null, fallbackPasswordChangedAt = null, nowIso = new Date().toISOString()) {
    const source = (rawSecurity && typeof rawSecurity === 'object') ? rawSecurity : {};
    const attempts = Number.isInteger(source.failedLoginAttempts) && source.failedLoginAttempts > 0
        ? source.failedLoginAttempts
        : 0;
    return {
        emailVerified: normalizeBoolean(source.emailVerified, false),
        phoneVerified: normalizeBoolean(source.phoneVerified, false),
        lastLoginAt: sanitizeText(source.lastLoginAt, 40) || sanitizeText(fallbackLastLoginAt, 40) || null,
        passwordChangedAt: sanitizeText(source.passwordChangedAt, 40) || sanitizeText(fallbackPasswordChangedAt, 40) || nowIso,
        failedLoginAttempts: attempts
    };
}
function normalizeCustomer(rawCustomer = {}) {
    const nowIso = new Date().toISOString();
    const customer = (rawCustomer && typeof rawCustomer === 'object') ? rawCustomer : {};
    const name = sanitizeText(customer.name, 120);
    const email = sanitizeText(customer.email, 180).toLowerCase();
    const phone = sanitizeText(customer.phone, 32);
    const location = sanitizeText(customer.location, 220);
    const sourceAddresses = Array.isArray(customer.addresses) ? customer.addresses : [];
    const addresses = sourceAddresses
        .map(address => normalizeAddress(address, location))
        .filter(Boolean);
    if (addresses.length === 0 && location) {
        addresses.push(normalizeAddress({}, location));
    }
    if (addresses.length > 0 && !addresses.some(address => address.isDefault)) {
        addresses[0].isDefault = true;
    }
    const defaultAddress = addresses.find(address => address.isDefault) || addresses[0] || null;
    const derivedLocation = location || (defaultAddress
        ? [defaultAddress.line1, defaultAddress.city, defaultAddress.state].filter(Boolean).join(', ')
        : '');
    const createdAt = sanitizeText(customer.createdAt, 40) || nowIso;
    const updatedAt = sanitizeText(customer.updatedAt, 40) || createdAt;

    return {
        id: sanitizeText(customer.id, 64) || `CUST-${Date.now()}`,
        email,
        passwordHash: sanitizeText(customer.passwordHash, 255),
        name: name || 'Customer',
        phone,
        alternatePhone: sanitizeText(customer.alternatePhone, 32),
        location: derivedLocation,
        pan: sanitizeText(customer.pan, 40),
        profileImage: normalizeProfileImage(customer.profileImage),
        dateOfBirth: sanitizeText(customer.dateOfBirth, 20),
        gender: sanitizeText(customer.gender, 20),
        notes: sanitizeText(customer.notes, 1000),
        addresses,
        preferences: normalizePreferences(customer.preferences),
        security: normalizeSecurity(customer.security, customer.lastLoginAt, customer.passwordChangedAt, nowIso),
        isActive: customer.isActive !== false,
        createdAt,
        updatedAt
    };
}
function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}
function normalizeDatabase(rawDB = {}) {
    const db = (rawDB && typeof rawDB === 'object') ? { ...rawDB } : {};
    let changed = false;

    if (db.schemaVersion !== DB_SCHEMA_VERSION) {
        db.schemaVersion = DB_SCHEMA_VERSION;
        changed = true;
    }

    const rawCustomers = ensureArray(db.customers);
    const normalizedCustomers = rawCustomers.map(normalizeCustomer);
    if (JSON.stringify(rawCustomers) !== JSON.stringify(normalizedCustomers)) {
        changed = true;
    }
    db.customers = normalizedCustomers;

    if (!Array.isArray(db.customer_sessions)) {
        db.customer_sessions = [];
        changed = true;
    }
    if (!Array.isArray(db.customer_audit_logs)) {
        db.customer_audit_logs = [];
        changed = true;
    }
    if (!Array.isArray(db.password_reset_tokens)) {
        db.password_reset_tokens = [];
        changed = true;
    }
    if (!Array.isArray(db.orders)) {
        db.orders = [];
        changed = true;
    }
    if (!Array.isArray(db.order_items)) {
        db.order_items = [];
        changed = true;
    }
    if (!Array.isArray(db.companies)) {
        db.companies = [];
        changed = true;
    }
    if (!Array.isArray(db.products)) {
        db.products = [];
        changed = true;
    }

    return { db, changed };
}
function readDB() {
    initDB();
    let rawContent;
    try {
        rawContent = fs.readFileSync(DB_FILE, 'utf8');
    } catch (err) {
        console.error('Failed to read DB file, re-initializing:', err);
        initDB();
        rawContent = fs.readFileSync(DB_FILE, 'utf8');
    }

    let rawDB;
    try {
        rawDB = JSON.parse(rawContent);
    } catch (err) {
        // Backup the corrupted file and re-create a fresh DB
        try {
            const corruptPath = `${DB_FILE}.corrupt-${Date.now()}.bak`;
            fs.writeFileSync(corruptPath, rawContent, 'utf8');
            console.error(`Database file was corrupted. Backed up to ${corruptPath}`);
        } catch (backupErr) {
            console.error('Failed to backup corrupted DB file:', backupErr);
        }
        initDB();
        rawDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    const normalized = normalizeDatabase(rawDB);
    if (normalized.changed) {
        writeDB(normalized.db);
    }
    return normalized.db;
}
// NOTE: simpleHash is a non-cryptographic hash. For production, replace with bcrypt or similar.
function simpleHash(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; } return hash.toString(); }
function nextId(arr) { return arr.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1; }
function postJson(urlString, payload, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        let urlObj;
        try {
            urlObj = new URL(urlString);
        } catch (e) {
            reject(new Error('Invalid printer URL'));
            return;
        }

        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        const body = JSON.stringify(payload);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: `${urlObj.pathname}${urlObj.search}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = client.request(options, (resp) => {
            let responseText = '';
            resp.on('data', chunk => { responseText += chunk.toString(); });
            resp.on('end', () => {
                resolve({
                    statusCode: resp.statusCode || 0,
                    body: responseText
                });
            });
        });

        req.setTimeout(timeoutMs, () => req.destroy(new Error('Printer request timed out')));
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
function normalizeProfileImage(image) {
    if (typeof image !== 'string') return '';
    const trimmed = image.trim();
    if (!trimmed) return '';
    if (trimmed.length > 2_500_000) return '';
    const isDataImage = trimmed.startsWith('data:image/');
    const isHttpUrl = /^https?:\/\//i.test(trimmed);
    return (isDataImage || isHttpUrl) ? trimmed : '';
}
function toPublicCustomer(customer) {
    return {
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone || '',
        location: customer.location,
        pan: customer.pan,
        profileImage: customer.profileImage || '',
        dateOfBirth: customer.dateOfBirth || '',
        gender: customer.gender || '',
        addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
        preferences: customer.preferences || DEFAULT_CUSTOMER_PREFERENCES
    };
}

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    return res.json({ success: true });
});

app.get('/api/companies', (req, res) => res.json(readDB().companies.filter(c => c.isActive)));
app.get('/api/companies/:id', (req, res) => { const c = readDB().companies.find(c => c.id === parseInt(req.params.id) && c.isActive); return c ? res.json(c) : res.status(404).json({ error: 'Not found' }); });
app.post('/api/companies', (req, res) => { const db = readDB(); const { name, logo, bgColor, image } = req.body; if (!name || !name.trim()) return res.status(400).json({ error: 'Company name is required' }); const company = { id: nextId(db.companies), name: name.trim(), logo: logo || '', bgColor: bgColor || '#000000', image: image || '', isActive: true, headerImage: '' }; db.companies.push(company); writeDB(db); res.status(201).json(company); });
app.patch('/api/companies/:id', (req, res) => { const db = readDB(); const idx = db.companies.findIndex(c => c.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ error: 'Not found' }); Object.assign(db.companies[idx], req.body); writeDB(db); res.json(db.companies[idx]); });
app.delete('/api/companies/:id', (req, res) => { const db = readDB(); const idx = db.companies.findIndex(c => c.id === parseInt(req.params.id)); if (idx !== -1) { db.companies[idx].isActive = false; writeDB(db); } res.json({ success: true }); });

app.get('/api/products', (req, res) => { let products = readDB().products.filter(p => p.isActive); if (req.query.companyId) products = products.filter(p => p.companyId === parseInt(req.query.companyId)); res.json(products); });
app.get('/api/products/:id', (req, res) => { const p = readDB().products.find(p => p.id === parseInt(req.params.id) && p.isActive); return p ? res.json(p) : res.status(404).json({ error: 'Not found' }); });
app.post('/api/products', (req, res) => { const db = readDB(); const { companyId, name, price, gram, stock, image } = req.body; if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required' }); if (!companyId || !db.companies.find(c => c.id === parseInt(companyId) && c.isActive)) return res.status(400).json({ error: 'Valid companyId is required' }); if (price == null || isNaN(parseFloat(price))) return res.status(400).json({ error: 'Valid price is required' }); const product = { id: nextId(db.products), companyId: parseInt(companyId), name: name.trim(), price: parseFloat(price), gram: gram || '', stock: parseInt(stock) || 0, image: image || '', isActive: true }; db.products.push(product); writeDB(db); res.status(201).json(product); });
app.patch('/api/products/:id', (req, res) => { const db = readDB(); const idx = db.products.findIndex(p => p.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ error: 'Not found' }); Object.assign(db.products[idx], req.body); writeDB(db); res.json(db.products[idx]); });
app.delete('/api/products/:id', (req, res) => { const db = readDB(); const idx = db.products.findIndex(p => p.id === parseInt(req.params.id)); if (idx !== -1) { db.products[idx].isActive = false; writeDB(db); } res.json({ success: true }); });

app.post('/api/register', (req, res) => {
    const db = readDB();
    const {
        name,
        email,
        phone,
        location,
        pan,
        password,
        profileImage,
        alternatePhone,
        dateOfBirth,
        gender,
        notes,
        addresses,
        preferences
    } = req.body || {};

    if (!name || !email || !phone || !location || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = sanitizeText(email, 180).toLowerCase();
    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (db.customers.find(c => c.email === normalizedEmail)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const nowIso = new Date().toISOString();
    const customer = normalizeCustomer({
        id: `CUST-${Date.now()}`,
        email: normalizedEmail,
        passwordHash: simpleHash(password),
        name,
        phone,
        alternatePhone,
        location,
        pan: pan || '',
        profileImage: normalizeProfileImage(profileImage),
        dateOfBirth,
        gender,
        notes,
        addresses,
        preferences,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        security: {
            lastLoginAt: null,
            passwordChangedAt: nowIso
        }
    });

    db.customers.push(customer);
    db.customer_audit_logs.push({
        id: `AUD-${Date.now()}`,
        customerId: customer.id,
        event: 'register',
        createdAt: nowIso
    });
    writeDB(db);
    res.json({ success: true, customer: toPublicCustomer(customer) });
});
app.post('/api/login', (req, res) => {
    const db = readDB();
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = sanitizeText(email, 180).toLowerCase();
    const customerIndex = db.customers.findIndex(c => c.email === normalizedEmail && c.isActive);
    if (customerIndex === -1 || simpleHash(password) !== db.customers[customerIndex].passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const nowIso = new Date().toISOString();
    const customer = db.customers[customerIndex];
    customer.security = normalizeSecurity(customer.security, customer.security?.lastLoginAt, customer.security?.passwordChangedAt, nowIso);
    customer.security.lastLoginAt = nowIso;
    customer.security.failedLoginAttempts = 0;
    customer.updatedAt = nowIso;
    db.customer_sessions.push({
        id: `SESS-${Date.now()}`,
        customerId: customer.id,
        source: 'web',
        createdAt: nowIso
    });
    db.customer_audit_logs.push({
        id: `AUD-${Date.now()}-LOGIN`,
        customerId: customer.id,
        event: 'login',
        createdAt: nowIso
    });
    writeDB(db);

    res.json({ success: true, customer: toPublicCustomer(customer) });
});
app.get('/api/customer/:id', (req, res) => { const c = readDB().customers.find(c => c.id === req.params.id && c.isActive); return c ? res.json(toPublicCustomer(c)) : res.status(404).json({ error: 'Not found' }); });
app.patch('/api/customer/:id', (req, res) => {
    const db = readDB();
    const idx = db.customers.findIndex(c => c.id === req.params.id && c.isActive);
    if (idx === -1) {
        return res.status(404).json({ error: 'Not found' });
    }

    const {
        passwordHash,
        id,
        isActive,
        createdAt,
        security,
        email,
        profileImage,
        preferences,
        addresses,
        ...safeUpdates
    } = req.body || {};

    Object.assign(db.customers[idx], safeUpdates);
    if (profileImage !== undefined) {
        db.customers[idx].profileImage = normalizeProfileImage(profileImage);
    }
    if (preferences !== undefined) {
        db.customers[idx].preferences = normalizePreferences(preferences);
    }
    if (addresses !== undefined) {
        const normalizedAddresses = Array.isArray(addresses)
            ? addresses.map(address => normalizeAddress(address, db.customers[idx].location)).filter(Boolean)
            : [];
        db.customers[idx].addresses = normalizedAddresses;
        if (db.customers[idx].addresses.length > 0 && !db.customers[idx].addresses.some(address => address.isDefault)) {
            db.customers[idx].addresses[0].isDefault = true;
        }
    }

    const nowIso = new Date().toISOString();
    db.customers[idx].updatedAt = nowIso;
    db.customers[idx] = normalizeCustomer(db.customers[idx]);
    db.customer_audit_logs.push({
        id: `AUD-${Date.now()}-PROFILE`,
        customerId: db.customers[idx].id,
        event: 'profile_update',
        createdAt: nowIso
    });
    writeDB(db);
    const c = db.customers[idx];
    res.json({ success: true, customer: toPublicCustomer(c) });
});
app.patch('/api/customer/:id/password', (req, res) => {
    const db = readDB();
    const idx = db.customers.findIndex(c => c.id === req.params.id && c.isActive);
    if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (!req.body.oldPassword || !req.body.newPassword) {
        return res.status(400).json({ success: false, message: 'Missing password fields' });
    }
    if (simpleHash(req.body.oldPassword) !== db.customers[idx].passwordHash) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    if (req.body.newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const nowIso = new Date().toISOString();
    db.customers[idx].passwordHash = simpleHash(req.body.newPassword);
    db.customers[idx].security = normalizeSecurity(
        db.customers[idx].security,
        db.customers[idx].security?.lastLoginAt,
        nowIso,
        nowIso
    );
    db.customers[idx].security.passwordChangedAt = nowIso;
    db.customers[idx].updatedAt = nowIso;
    db.customer_audit_logs.push({
        id: `AUD-${Date.now()}-PASSWORD`,
        customerId: db.customers[idx].id,
        event: 'password_change',
        createdAt: nowIso
    });
    writeDB(db);
    res.json({ success: true });
});

// Reviews API
app.get('/api/reviews', (req, res) => {
    const db = readDB();
    const productId = req.query.productId;
    let reviews = db.reviews || [];
    if (productId) {
        reviews = reviews.filter(r => r.productId === parseInt(productId) && r.isActive);
    }
    res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
    const db = readDB();
    const { productId, customerId, customerName, rating, comment } = req.body;
    
    if (!productId || !rating || !comment) {
        return res.status(400).json({ error: 'Product ID, rating, and comment are required' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = {
        id: `REV-${Date.now()}`,
        productId: parseInt(productId),
        customerId: customerId || null,
        customerName: customerName || 'Anonymous',
        rating: parseInt(rating),
        comment: comment.trim().slice(0, 1000),
        isActive: true,
        createdAt: new Date().toISOString()
    };
    
    if (!db.reviews) db.reviews = [];
    db.reviews.push(review);
    writeDB(db);
    res.status(201).json(review);
});

app.delete('/api/reviews/:id', (req, res) => {
    const db = readDB();
    const idx = (db.reviews || []).findIndex(r => r.id === req.params.id);
    if (idx !== -1) {
        db.reviews[idx].isActive = false;
        writeDB(db);
    }
    res.json({ success: true });
});

// Search with filters
app.get('/api/search', (req, res) => {
    const db = readDB();
    const { q, companyId, minPrice, maxPrice, inStock } = req.query;
    
    let products = db.products.filter(p => p.isActive);
    
    // Filter by company
    if (companyId) {
        products = products.filter(p => p.companyId === parseInt(companyId));
    }
    
    // Filter by price range
    if (minPrice) {
        products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
        products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    // Filter by stock
    if (inStock === 'true') {
        products = products.filter(p => p.stock > 0);
    }
    
    // Search by name
    if (q && q.trim()) {
        const search = q.toLowerCase().trim();
        products = products.filter(p => 
            p.name.toLowerCase().includes(search)
        );
    }
    
    // Get company info for each product
    const companies = db.companies.filter(c => c.isActive);
    const results = products.map(p => ({
        ...p,
        company: companies.find(c => c.id === p.companyId)
    }));
    
    res.json(results);
});

app.get('/api/stats', (req, res) => { const db = readDB(); const revenue = db.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0); res.json({ companies: db.companies.filter(c => c.isActive).length, products: db.products.filter(p => p.isActive).length, orders: db.orders.length, revenue }); });
app.get('/api/orders', (req, res) => res.json(readDB().orders));
app.get('/api/orders/customer/:customerId', (req, res) => res.json(readDB().orders.filter(o => o.customerId === req.params.customerId)));
app.get('/api/stats/customer/:customerId', (req, res) => { const orders = readDB().orders.filter(o => o.customerId === req.params.customerId); res.json({ totalOrders: orders.length, totalSpent: orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0), averageOrderValue: orders.length ? orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0) / orders.length : 0 }); });
app.post('/api/orders', (req, res) => { const db = readDB(); const { customerId, customer, items, total } = req.body; if (!customer || !items || !Array.isArray(items) || items.length === 0 || total == null) return res.status(400).json({ error: 'Missing required order fields' }); if (!customer.name || !customer.phone || !customer.location) return res.status(400).json({ error: 'Missing customer delivery information' }); const order = { id: `ORD-${Date.now()}`, customerId: customerId || null, customer, items, total: parseFloat(total) || 0, status: 'completed', createdAt: new Date().toISOString() }; db.orders.push(order); writeDB(db); res.json({ success: true, orderId: order.id }); });
app.post('/api/print-order', async (req, res) => {
    const configuredPrinterUrl = process.env.PRINTER_URL || '';
    const requestedPrinterUrl = typeof req.body?.printerUrl === 'string' ? req.body.printerUrl.trim() : '';
    const printerUrl = requestedPrinterUrl || configuredPrinterUrl;
    const orderId = req.body?.orderId || '';
    const order = req.body?.order || null;

    if (!printerUrl) {
        return res.status(400).json({
            success: false,
            message: 'Printer URL is not configured'
        });
    }

    const printPayload = {
        type: 'order',
        orderId,
        order,
        createdAt: new Date().toISOString()
    };

    try {
        const printResponse = await postJson(printerUrl, printPayload);
        if (printResponse.statusCode < 200 || printResponse.statusCode >= 300) {
            return res.status(502).json({
                success: false,
                message: `Printer responded with status ${printResponse.statusCode}`,
                printerStatus: printResponse.statusCode,
                printerBody: (printResponse.body || '').slice(0, 500)
            });
        }

        return res.json({
            success: true,
            printerStatus: printResponse.statusCode
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: `Failed to send print job: ${error.message}`
        });
    }
});

// Simple status page for browser verification
app.get('/status', (req, res) => {
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Pranil Store — Status</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:2rem;color:#111}a{color:#0366d6}</style></head><body><h1>Pranil Store</h1><p>Server is running.</p><ul><li><a href="/api/companies" target="_blank">/api/companies</a></li><li><a href="/api/products" target="_blank">/api/products</a></li><li><a href="/status" target="_blank">/status</a> (this page)</li></ul><p>Try opening <code>http://127.0.0.1:3000/</code> or <code>http://localhost:3000/</code> in your browser.</p></body></html>`);
});

// Diagnostic JSON endpoint
app.get('/diag', (req, res) => {
    res.json({ pid: process.pid, uptime: process.uptime(), platform: process.platform, nodeVersion: process.version, now: new Date().toISOString() });
});

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

const PORT = process.env.PORT || 3000;

async function startServer() {
    await db.connect(process.env.MONGODB_URI);
    
    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Pranil Store running at http://localhost:${PORT}`);
            console.log('Admin password: admin123 (or set ADMIN_PASSWORD env var)');
        });
    }
}

startServer();

module.exports = app;
module.exports.handler = serverless(app);
