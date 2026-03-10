const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.useMongo = false;
    }

    async connect(mongoUri) {
        if (!mongoUri) {
            console.log('Using JSON file storage');
            console.log('Set MONGODB_URI in .env for cloud database');
            return false;
        }

        try {
            this.client = new MongoClient(mongoUri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000
            });
            
            await this.client.connect();
            this.db = this.client.db();
            
            await this.initCollections();
            
            console.log('Connected to MongoDB');
            this.useMongo = true;
            return true;
        } catch (error) {
            console.log('MongoDB unavailable, using JSON file storage');
            this.useMongo = false;
            return false;
        }
    }

    async initCollections() {
        const collections = ['companies', 'products', 'customers', 'orders', 'counters'];
        for (const name of collections) {
            try {
                await this.db.createCollection(name);
            } catch (e) {}
        }
    }

    async nextId(collection) {
        if (this.useMongo) {
            const counter = await this.db.collection('counters').findOneAndUpdate(
                { _id: collection },
                { $inc: { seq: 1 } },
                { upsert: true, returnDocument: 'after' }
            );
            return counter.seq;
        }
        
        const db = this.readJsonDb();
        const map = { companies: db.companies, products: db.products, customers: db.customers, orders: db.orders };
        const items = map[collection] || [];
        return items.reduce((max, i) => Math.max(max, i.id || 0), 0) + 1;
    }

    readJsonDb() {
        if (!fs.existsSync(DB_FILE)) {
            this.initJsonDb();
        }
        try {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (e) {
            this.initJsonDb();
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    }

    writeJsonDb(data) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }

    initJsonDb() {
        const initialData = {
            schemaVersion: 2,
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

    async getCompanies(activeOnly = true) {
        if (this.useMongo) {
            const filter = activeOnly ? { isActive: true } : {};
            return await this.db.collection('companies').find(filter).toArray();
        }
        const db = this.readJsonDb();
        return activeOnly ? db.companies.filter(c => c.isActive) : db.companies;
    }

    async getCompanyById(id) {
        if (this.useMongo) {
            return await this.db.collection('companies').findOne({ id: parseInt(id), isActive: true });
        }
        const db = this.readJsonDb();
        return db.companies.find(c => c.id === parseInt(id) && c.isActive);
    }

    async createCompany(data) {
        const company = {
            id: await this.nextId('companies'),
            name: data.name,
            logo: data.logo || '',
            bgColor: data.bgColor || '#000000',
            image: data.image || '',
            headerImage: '',
            isActive: true
        };
        if (this.useMongo) {
            await this.db.collection('companies').insertOne(company);
        } else {
            const db = this.readJsonDb();
            db.companies.push(company);
            this.writeJsonDb(db);
        }
        return company;
    }

    async updateCompany(id, data) {
        if (this.useMongo) {
            await this.db.collection('companies').updateOne({ id: parseInt(id) }, { $set: data });
        } else {
            const db = this.readJsonDb();
            const idx = db.companies.findIndex(c => c.id === parseInt(id));
            if (idx !== -1) {
                Object.assign(db.companies[idx], data);
                this.writeJsonDb(db);
            }
        }
    }

    async deleteCompany(id) {
        if (this.useMongo) {
            await this.db.collection('companies').updateOne({ id: parseInt(id) }, { $set: { isActive: false } });
        } else {
            const db = this.readJsonDb();
            const idx = db.companies.findIndex(c => c.id === parseInt(id));
            if (idx !== -1) {
                db.companies[idx].isActive = false;
                this.writeJsonDb(db);
            }
        }
    }

    async getProducts(companyId = null, activeOnly = true) {
        if (this.useMongo) {
            const filter = activeOnly ? { isActive: true } : {};
            if (companyId) filter.companyId = parseInt(companyId);
            return await this.db.collection('products').find(filter).toArray();
        }
        const db = this.readJsonDb();
        let products = activeOnly ? db.products.filter(p => p.isActive) : db.products;
        if (companyId) products = products.filter(p => p.companyId === parseInt(companyId));
        return products;
    }

    async getProductById(id) {
        if (this.useMongo) {
            return await this.db.collection('products').findOne({ id: parseInt(id), isActive: true });
        }
        const db = this.readJsonDb();
        return db.products.find(p => p.id === parseInt(id) && p.isActive);
    }

    async createProduct(data) {
        const product = {
            id: await this.nextId('products'),
            companyId: parseInt(data.companyId),
            name: data.name,
            price: parseFloat(data.price),
            gram: data.gram || '',
            stock: parseInt(data.stock) || 0,
            image: data.image || '',
            isActive: true
        };
        if (this.useMongo) {
            await this.db.collection('products').insertOne(product);
        } else {
            const db = this.readJsonDb();
            db.products.push(product);
            this.writeJsonDb(db);
        }
        return product;
    }

    async updateProduct(id, data) {
        if (this.useMongo) {
            await this.db.collection('products').updateOne({ id: parseInt(id) }, { $set: data });
        } else {
            const db = this.readJsonDb();
            const idx = db.products.findIndex(p => p.id === parseInt(id));
            if (idx !== -1) {
                Object.assign(db.products[idx], data);
                this.writeJsonDb(db);
            }
        }
    }

    async deleteProduct(id) {
        if (this.useMongo) {
            await this.db.collection('products').updateOne({ id: parseInt(id) }, { $set: { isActive: false } });
        } else {
            const db = this.readJsonDb();
            const idx = db.products.findIndex(p => p.id === parseInt(id));
            if (idx !== -1) {
                db.products[idx].isActive = false;
                this.writeJsonDb(db);
            }
        }
    }

    async getCustomers(activeOnly = true) {
        if (this.useMongo) {
            const filter = activeOnly ? { isActive: true } : {};
            return await this.db.collection('customers').find(filter).toArray();
        }
        const db = this.readJsonDb();
        return activeOnly ? db.customers.filter(c => c.isActive) : db.customers;
    }

    async getCustomerById(id) {
        if (this.useMongo) {
            return await this.db.collection('customers').findOne({ id, isActive: true });
        }
        const db = this.readJsonDb();
        return db.customers.find(c => c.id === id && c.isActive);
    }

    async getCustomerByEmail(email) {
        if (this.useMongo) {
            return await this.db.collection('customers').findOne({ email: email.toLowerCase(), isActive: true });
        }
        const db = this.readJsonDb();
        return db.customers.find(c => c.email === email.toLowerCase() && c.isActive);
    }

    async createCustomer(data) {
        const now = new Date().toISOString();
        const customer = {
            id: data.id,
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
            phone: data.phone,
            alternatePhone: data.alternatePhone || '',
            location: data.location,
            pan: data.pan || '',
            profileImage: data.profileImage || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            notes: data.notes || '',
            addresses: data.addresses || [],
            preferences: data.preferences || { language: 'en', currency: 'NPR', newsletter: false, promotionalEmails: false, orderUpdatesBySms: true },
            security: data.security || { emailVerified: false, phoneVerified: false, lastLoginAt: null, passwordChangedAt: now, failedLoginAttempts: 0 },
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        if (this.useMongo) {
            await this.db.collection('customers').insertOne(customer);
        } else {
            const db = this.readJsonDb();
            db.customers.push(customer);
            this.writeJsonDb(db);
        }
        return customer;
    }

    async updateCustomer(id, data) {
        data.updatedAt = new Date().toISOString();
        const { passwordHash, id: _, isActive, createdAt, security, email, ...safeData } = data;
        if (this.useMongo) {
            await this.db.collection('customers').updateOne({ id }, { $set: safeData });
        } else {
            const db = this.readJsonDb();
            const idx = db.customers.findIndex(c => c.id === id);
            if (idx !== -1) {
                Object.assign(db.customers[idx], safeData);
                this.writeJsonDb(db);
            }
        }
    }

    async createOrder(data) {
        const order = {
            id: data.id,
            customerId: data.customerId,
            customer: data.customer,
            items: data.items,
            total: data.total,
            status: data.status || 'completed',
            createdAt: new Date().toISOString()
        };
        if (this.useMongo) {
            await this.db.collection('orders').insertOne(order);
        } else {
            const db = this.readJsonDb();
            db.orders.push(order);
            this.writeJsonDb(db);
        }
        return order;
    }

    async getOrders() {
        if (this.useMongo) {
            return await this.db.collection('orders').find().toArray();
        }
        return this.readJsonDb().orders;
    }

    async getOrdersByCustomer(customerId) {
        if (this.useMongo) {
            return await this.db.collection('orders').find({ customerId }).toArray();
        }
        const db = this.readJsonDb();
        return db.orders.filter(o => o.customerId === customerId);
    }

    async addSession(session) {
        if (this.useMongo) {
            await this.db.collection('customer_sessions').insertOne(session);
        } else {
            const db = this.readJsonDb();
            db.customer_sessions.push(session);
            this.writeJsonDb(db);
        }
    }

    async addAuditLog(log) {
        if (this.useMongo) {
            await this.db.collection('customer_audit_logs').insertOne(log);
        } else {
            const db = this.readJsonDb();
            db.customer_audit_logs.push(log);
            this.writeJsonDb(db);
        }
    }

    close() {
        if (this.client) this.client.close();
    }
}

module.exports = new Database();
