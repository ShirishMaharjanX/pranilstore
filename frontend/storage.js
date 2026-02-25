const StorageManager = {
    ADMIN_PASSWORD: 'admin123',
    cache: { companies: null, products: null },
    initialized: false,
    async init() { await this.refreshData(); this.initialized = true; },
    async refreshData() {
        try {
            const [companiesRes, productsRes] = await Promise.all([fetch('/api/companies'), fetch('/api/products')]);
            this.cache.companies = await companiesRes.json();
            this.cache.products = await productsRes.json();
        } catch (err) { console.error('Failed to load data:', err); this.cache.companies = []; this.cache.products = []; }
    },
    async getCompanies() {
        if (!this.cache.companies) await this.refreshData();
        const products = this.cache.products || [];
        return this.cache.companies.map(c => ({ ...c, products: products.filter(p => p.companyId === c.id && p.isActive !== false) }));
    },
    async getCompanyById(id) { const companies = await this.getCompanies(); return companies.find(c => c.id === parseInt(id)); },
    async addCompany(data) { const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const company = await res.json(); await this.refreshData(); return company; },
    async updateCompany(id, data) { await fetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); await this.refreshData(); return { success: true }; },
    async deleteCompany(id) { await fetch(`/api/companies/${id}`, { method: 'DELETE' }); await this.refreshData(); return { success: true }; },
    async getProducts(companyId = null) { if (!this.cache.products) await this.refreshData(); let products = this.cache.products; if (companyId) products = products.filter(p => p.companyId === parseInt(companyId)); return products; },
    async addProduct(data) { const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const product = await res.json(); await this.refreshData(); return product; },
    async updateProduct(id, data) { await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); await this.refreshData(); return { success: true }; },
    async deleteProduct(id) { await fetch(`/api/products/${id}`, { method: 'DELETE' }); await this.refreshData(); return { success: true }; },
    async getCompaniesWithProducts() { return this.getCompanies(); },
    async createOrder(order) { const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }); await this.refreshData(); return await res.json(); },
    async getOrders() { const res = await fetch('/api/orders'); return await res.json(); },
    async getOrdersByCustomer(customerId) { const res = await fetch(`/api/orders/customer/${customerId}`); return await res.json(); },
    async getCustomerStats(customerId) { const res = await fetch(`/api/stats/customer/${customerId}`); return await res.json(); },
    async getStats() { const res = await fetch('/api/stats'); return await res.json(); },
    isAdminLoggedIn() { return sessionStorage.getItem('admin_logged_in') === 'true'; },
    setAdminLoggedIn(status) { sessionStorage.setItem('admin_logged_in', status ? 'true' : 'false'); },
    isCustomerLoggedIn() { return sessionStorage.getItem('current_user_id') !== null; },
    logoutCustomer() { sessionStorage.removeItem('current_user_id'); sessionStorage.removeItem('current_user'); },
    async getCurrentUser() { const user = sessionStorage.getItem('current_user'); return user ? JSON.parse(user) : null; },
    async registerCustomer(data) { const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await res.json(); if (result.success) { sessionStorage.setItem('current_user_id', result.customer.customerId); sessionStorage.setItem('current_user', JSON.stringify(result.customer)); } return result; },
    async loginCustomer(email, password) { const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); const result = await res.json(); if (result.success) { sessionStorage.setItem('current_user_id', result.customer.customerId); sessionStorage.setItem('current_user', JSON.stringify(result.customer)); } return result; },
    async updateCustomerProfile(customerId, updates) { const res = await fetch(`/api/customer/${customerId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); const result = await res.json(); if (result.success) sessionStorage.setItem('current_user', JSON.stringify(result.customer)); return result; },
    async changePassword(customerId, oldPassword, newPassword) { const res = await fetch(`/api/customer/${customerId}/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) }); return await res.json(); }
};
window.StorageManager = StorageManager;
