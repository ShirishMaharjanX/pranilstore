const StorageManager = {
    cache: { companies: null, products: null },
    initialized: false,

    // Build a full API URL using the configured base (supports cross-port dev).
    url(path) {
        return `${(window.APP_CONFIG && window.APP_CONFIG.apiBase) || ''}${path}`;
    },

    async request(path, options = {}) {
        const { method = 'GET', headers = {}, body } = options;
        const requestOptions = {
            method,
            headers: { ...headers }
        };

        if (body !== undefined) {
            requestOptions.body = body;
            if (!requestOptions.headers['Content-Type'] && !requestOptions.headers['content-type']) {
                requestOptions.headers['Content-Type'] = 'application/json';
            }
        }

        const apiBases = (window.APP_CONFIG && Array.isArray(window.APP_CONFIG.apiBases) && window.APP_CONFIG.apiBases.length > 0)
            ? window.APP_CONFIG.apiBases
            : [((window.APP_CONFIG && window.APP_CONFIG.apiBase) || '')];

        let response;
        let requestedUrl = '';
        let networkError = null;

        for (const base of apiBases) {
            requestedUrl = `${base}${path}`;
            try {
                response = await fetch(requestedUrl, requestOptions);
                networkError = null;
                break;
            } catch (err) {
                networkError = err;
            }
        }

        if (!response) {
            const error = new Error(
                `Cannot reach server (${requestedUrl}). Run "npm run start:all" to auto-start backend + browser, then use http://localhost:3000/`
            );
            error.cause = networkError;
            throw error;
        }
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof payload === 'object' && payload
                ? payload.error || payload.message
                : null;
            const error = new Error(message || `Request failed (${response.status})`);
            error.status = response.status;
            error.payload = payload;
            throw error;
        }

        return payload;
    },

    getLocalCompanies() {
        try {
            return JSON.parse(localStorage.getItem('local_companies') || '[]');
        } catch (e) {
            return [];
        }
    },

    setLocalCompanies(companies) {
        localStorage.setItem('local_companies', JSON.stringify(companies));
    },

    removeEmoji(value) {
        const text = String(value ?? '');
        // Remove common emoji ranges and variation selectors.
        return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
    },

    isSafeImageValue(value) {
        const image = String(value || '').trim();
        if (!image) return false;
        if (image.startsWith('data:image/')) return true;
        if (image.startsWith('http://') || image.startsWith('https://')) return true;
        if (image.startsWith('/') || image.startsWith('./') || image.startsWith('../')) return true;
        if (/^[^:<>"]+\.(png|jpe?g|gif|webp|svg)$/i.test(image)) return true;
        return false;
    },

    sanitizeCompany(company) {
        if (!company || typeof company !== 'object') return company;
        return {
            ...company,
            logo: this.removeEmoji(company.logo || '')
        };
    },

    sanitizeProduct(product) {
        if (!product || typeof product !== 'object') return product;
        const rawImage = String(product.image || '').trim();
        return {
            ...product,
            image: this.isSafeImageValue(rawImage) ? rawImage : ''
        };
    },

    async init() {
        await this.refreshData();
        this.initialized = true;
    },

    async refreshData() {
        try {
            const [companies, products] = await Promise.all([
                this.request('/api/companies'),
                this.request('/api/products')
            ]);
            this.cache.companies = Array.isArray(companies) ? companies : [];
            this.cache.products = Array.isArray(products) ? products : [];
        } catch (err) {
            console.error('Failed to load data:', err);
            // Keep existing cache when possible so app remains usable.
            this.cache.companies = this.cache.companies || [];
            this.cache.products = this.cache.products || [];
        }
    },

    async getCompanies() {
        if (!this.cache.companies || !this.cache.products) {
            await this.refreshData();
        }

        const products = (this.cache.products || []).map(product => this.sanitizeProduct(product));
        const allCompanies = [...(this.cache.companies || []), ...this.getLocalCompanies()]
            .map(company => this.sanitizeCompany(company));

        return allCompanies.map(company => ({
            ...company,
            products: products.filter(p => p.companyId === company.id && p.isActive !== false)
        }));
    },

    async getCompanyById(id) {
        const companies = await this.getCompanies();
        return companies.find(c => c.id === parseInt(id, 10));
    },

    async addCompany(data) {
        try {
            const company = await this.request('/api/companies', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            await this.refreshData();
            return company;
        } catch (err) {
            // Backend unavailable: allow offline creation via localStorage fallback.
            if (err.status) {
                throw err;
            }

            console.warn('addCompany API failed, using local fallback:', err);
            const local = this.getLocalCompanies();
            const company = {
                id: Date.now(),
                name: data.name || '',
                logo: data.logo || '',
                bgColor: data.bgColor || '#000000',
                image: data.image || '',
                isActive: true
            };

            local.push(company);
            this.setLocalCompanies(local);
            this.cache.companies = [...(this.cache.companies || []), company];
            return company;
        }
    },

    async updateCompany(id, data) {
        await this.request(`/api/companies/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        await this.refreshData();
        return { success: true };
    },

    async deleteCompany(id) {
        await this.request(`/api/companies/${id}`, { method: 'DELETE' });
        await this.refreshData();
        return { success: true };
    },

    async getProducts(companyId = null) {
        if (!this.cache.products) {
            await this.refreshData();
        }

        let products = (this.cache.products || []).map(product => this.sanitizeProduct(product));
        if (companyId !== null) {
            const companyIdInt = parseInt(companyId, 10);
            products = products.filter(product => product.companyId === companyIdInt);
        }
        return products;
    },

    async addProduct(data) {
        const product = await this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        await this.refreshData();
        return product;
    },

    async updateProduct(id, data) {
        await this.request(`/api/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        await this.refreshData();
        return { success: true };
    },

    async deleteProduct(id) {
        await this.request(`/api/products/${id}`, { method: 'DELETE' });
        await this.refreshData();
        return { success: true };
    },

    async getCompaniesWithProducts() {
        return this.getCompanies();
    },

    async createOrder(order) {
        const result = await this.request('/api/orders', {
            method: 'POST',
            body: JSON.stringify(order)
        });
        await this.refreshData();
        return result;
    },

    async printOrder(orderPayload) {
        const printerUrl = (window.APP_CONFIG && window.APP_CONFIG.printerUrl)
            ? String(window.APP_CONFIG.printerUrl).trim()
            : '';

        return this.request('/api/print-order', {
            method: 'POST',
            body: JSON.stringify({
                printerUrl,
                ...orderPayload
            })
        });
    },

    async getOrders() {
        return this.request('/api/orders');
    },

    async getOrdersByCustomer(customerId) {
        try {
            return await this.request(`/api/orders/customer/${customerId}`);
        } catch (err) {
            return [];
        }
    },

    async getCustomerStats(customerId) {
        try {
            return await this.request(`/api/stats/customer/${customerId}`);
        } catch (err) {
            return { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 };
        }
    },

    async getStats() {
        return this.request('/api/stats');
    },

    isAdminLoggedIn() {
        return sessionStorage.getItem('admin_logged_in') === 'true';
    },

    setAdminLoggedIn(status) {
        sessionStorage.setItem('admin_logged_in', status ? 'true' : 'false');
    },

    async adminLogin(password) {
        try {
            const result = await this.request('/api/admin/login', {
                method: 'POST',
                body: JSON.stringify({ password })
            });
            if (result.success) {
                this.setAdminLoggedIn(true);
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    isCustomerLoggedIn() {
        return sessionStorage.getItem('current_user_id') !== null;
    },

    logoutCustomer() {
        sessionStorage.removeItem('current_user_id');
        sessionStorage.removeItem('current_user');
    },

    async getCurrentUser() {
        const user = sessionStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
    },

    async registerCustomer(data) {
        try {
            const result = await this.request('/api/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (result.success) {
                sessionStorage.setItem('current_user_id', result.customer.customerId);
                sessionStorage.setItem('current_user', JSON.stringify(result.customer));
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    async loginCustomer(email, password) {
        try {
            const result = await this.request('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (result.success) {
                sessionStorage.setItem('current_user_id', result.customer.customerId);
                sessionStorage.setItem('current_user', JSON.stringify(result.customer));
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    async updateCustomerProfile(customerId, updates) {
        try {
            const result = await this.request(`/api/customer/${customerId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            if (result.success) {
                sessionStorage.setItem('current_user', JSON.stringify(result.customer));
            }
            return result;
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    async changePassword(customerId, oldPassword, newPassword) {
        try {
            return await this.request(`/api/customer/${customerId}/password`, {
                method: 'PATCH',
                body: JSON.stringify({ oldPassword, newPassword })
            });
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
};

window.StorageManager = StorageManager;
