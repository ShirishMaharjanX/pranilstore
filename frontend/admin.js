/**
 * Admin Panel Module
 * ==================
 * Handles all administrative functions including:
 * - Admin authentication and session management
 * - Company CRUD operations
 * - Product management
 * - Order viewing
 * - Dashboard statistics
 */

const Admin = {
    // Track currently editing items
    currentEditingProduct: null,
    currentEditingCompany: null,
    
    // Store Base64 encoded images
    productImageBase64: null,
    companyImageBase64: null,
    
    // Session state
    isLoggedIn: false,
    currentView: 'overview',

    /**
     * Opens the admin panel, prompts for login if not authenticated
     */
    showAdminPanel() {
        if (!this.isLoggedIn && !StorageManager.isAdminLoggedIn()) {
            this.showAdminLoginModal();
            return;
        }

        const panel = document.getElementById('adminPanel');
        if (!panel) {
            console.error('Admin panel element not found (id="adminPanel").');
            return;
        }

        panel.classList.add('active');
        this.renderAdminHeader();
        this.showView('overview');
    },

    /**
     * Shows the admin login modal
     */
    showAdminLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        if (!modal) {
            console.error('Admin login modal not found (id="adminLoginModal").');
            return;
        }

        modal.classList.add('active');
        const passwordInput = document.getElementById('adminPassword');
        const errorEl = document.getElementById('adminLoginError');
        if (passwordInput) passwordInput.value = '';
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
    },

    /**
     * Closes the admin login modal
     */
    closeAdminLoginModal() { 
        document.getElementById('adminLoginModal').classList.remove('active'); 
    },

    /**
     * Authenticates admin with password
     */
    async login() {
        const passwordInput = document.getElementById('adminPassword');
        const errorEl = document.getElementById('adminLoginError');
        const submitButton = document.querySelector('#adminLoginModal .btn-primary');
        const password = passwordInput ? passwordInput.value.trim() : '';

        if (!password) {
            if (errorEl) {
                errorEl.textContent = 'Please enter the admin password';
                errorEl.classList.add('visible');
            }
            return;
        }

        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Checking...';
        }

        const result = await StorageManager.adminLogin(password);

        if (result.success) {
            this.isLoggedIn = true;
            this.closeAdminLoginModal();
            showNotification('Admin access granted', 'success');
            this.showAdminPanel();
        } else {
            if (errorEl) {
                errorEl.textContent = result.message || 'Incorrect password';
                errorEl.classList.add('visible');
            }
            if (passwordInput) passwordInput.value = '';
        }

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Access Panel';
        }
    },

    /**
     * Renders the admin panel header with navigation
     */
    renderAdminHeader() { 
        const header = document.querySelector('.admin-header'); 
        header.innerHTML = `
            <h2>Administration Panel</h2>
            <nav class="admin-nav">
                <button class="admin-nav-btn active" data-view="overview" onclick="Admin.showView('overview')">Overview</button>
                <button class="admin-nav-btn" data-view="companies" onclick="Admin.showView('companies')">Companies</button>
                <button class="admin-nav-btn" data-view="products" onclick="Admin.showView('products')">Products</button>
                <button class="admin-nav-btn" data-view="orders" onclick="Admin.showView('orders')">Orders</button>
            </nav>
            <button class="modal-close-btn" onclick="Admin.closeAdminPanel()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        `; 
    },

    /**
     * Closes the admin panel
     */
    closeAdminPanel() { 
        document.getElementById('adminPanel').classList.remove('active'); 
    },

    /**
     * Switches between admin views
     * @param {string} viewName - Name of view to show: overview, companies, products, orders
     */
    async showView(viewName) {
        this.currentView = viewName;
        const content = document.getElementById('adminContent');
        if (!content) {
            console.error('Admin content element not found (id="adminContent").');
            return;
        }

        // Update active nav button
        document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-view="' + viewName + '"]')?.classList.add('active');

        try {
            switch (viewName) {
                case 'overview':
                    await this.renderOverview(content);
                    break;
                case 'companies':
                    await this.renderCompaniesManagement(content);
                    break;
                case 'products':
                    await this.renderProductsManagement(content);
                    break;
                case 'orders':
                    await this.renderOrdersManagement(content);
                    break;
                default:
                    content.innerHTML = '<div class="admin-overview"><p style="padding:2rem;color:#2563eb;">Unknown admin view.</p></div>';
            }
        } catch (err) {
            console.error(`Admin view "${viewName}" failed:`, err);
            content.innerHTML = '<div class="admin-overview"><p style="padding:2rem;color:#2563eb;">Failed to load this section. Please refresh and try again.</p></div>';
        }
    },

    /**
     * Renders the dashboard overview with statistics
     * @param {HTMLElement} content - Container element for the view
     */
    async renderOverview(content) {
        if (!content) return;

        content.innerHTML = '<div class="admin-overview"><p style="padding:2rem;text-align:center;color:#999;">Loading...</p></div>';

        let stats = { companies: 0, products: 0, orders: 0, revenue: 0 };
        let statsWarning = '';
        
        try {
            const fetchedStats = await StorageManager.getStats();
            stats = {
                companies: fetchedStats?.companies ?? 0,
                products: fetchedStats?.products ?? 0,
                orders: fetchedStats?.orders ?? 0,
                revenue: parseFloat(fetchedStats?.revenue) || 0
            };
        } catch (err) {
            console.error('renderOverview stats error:', err);
            statsWarning = '<p style="padding:0.5rem 0 0;color:#b45309;font-size:0.875rem;">Live stats are unavailable right now. Showing fallback values.</p>';
        }

        content.innerHTML = `
            <div class="admin-overview">
                <div class="overview-header">
                    <h2>Dashboard Overview</h2>
                    <p class="overview-subtitle">Monitor your business performance</p>
                    ${statsWarning}
                </div>
                <div class="stats-grid-admin">
                    <div class="stat-card-admin">
                        <div class="stat-icon-admin companies-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                            </svg>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin">${stats.companies}</div>
                            <div class="stat-label-admin">Total Companies</div>
                        </div>
                    </div>
                    <div class="stat-card-admin">
                        <div class="stat-icon-admin products-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin">${stats.products}</div>
                            <div class="stat-label-admin">Total Products</div>
                        </div>
                    </div>
                    <div class="stat-card-admin">
                        <div class="stat-icon-admin orders-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin">${stats.orders}</div>
                            <div class="stat-label-admin">Total Orders</div>
                        </div>
                    </div>
                    <div class="stat-card-admin">
                        <div class="stat-icon-admin revenue-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin">NPR ${stats.revenue.toLocaleString()}</div>
                            <div class="stat-label-admin">Total Revenue</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renders the companies management view
     * @param {HTMLElement} content - Container element
     */
    async renderCompaniesManagement(content) {
        const companies = await StorageManager.getCompanies();
        
        // Helper to get company initials
        const getInitials = (name) => String(name || 'CO').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CO';

        const companyRows = companies.length === 0
            ? '<p>No companies yet.</p>'
            : companies.map(company => {
                const initials = getInitials(company.name);
                return `
                    <div class="company-item-admin">
                        <div class="company-item-header">
                            <span style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;">${initials}</span>
                            <div class="company-item-info">
                                <h3>${company.name}</h3>
                                <p>${company.products.length} Products</p>
                            </div>
                            <div class="company-item-actions">
                                <button class="btn-icon" onclick="Admin.showEditCompanyModal(${company.id})" title="Edit">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon" onclick="Admin.deleteCompany(${company.id})" title="Delete">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        content.innerHTML = `
            <div class="admin-section">
                <div class="section-header">
                    <div>
                        <h2>Companies Management</h2>
                        <p class="section-subtitle">Manage your partner companies</p>
                    </div>
                    <button class="btn-primary" onclick="Admin.showAddCompanyModal()">Add Company</button>
                </div>
                <div class="companies-list">${companyRows}</div>
            </div>
        `;
    },

    /**
     * Renders the products management view grouped by company
     * @param {HTMLElement} content - Container element
     */
    async renderProductsManagement(content) {
        content.innerHTML = '<div class="admin-section"><p style="padding:2rem;text-align:center;color:#999;">Loading products...</p></div>';
        try {
            const raw = await StorageManager.getCompanies();
            const companies = Array.isArray(raw) ? raw : [];
            const getInitials = (name) => String(name || 'CO').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CO';
            
            const companySections = companies.length === 0
                ? '<p style="padding:2rem;text-align:center;color:#999;">No companies yet. Add a company first.</p>'
                : companies.map(company => {
                    const initials = getInitials(company.name);
                    const productRows = (company.products || []).length === 0
                        ? '<tr><td colspan="4" style="text-align:center;color:#999;padding:1rem;">No products yet</td></tr>'
                        : (company.products || []).map(product => {
                            const imageCell = product.image
                                ? `<img src="${product.image}" alt="${product.name}" style="width:40px;height:40px;border-radius:4px;margin-right:0.5rem;object-fit:cover;">`
                                : '<div style="width:40px;height:40px;border-radius:4px;margin-right:0.5rem;background:linear-gradient(135deg,#0f172a,#1e3a8a);"></div>';
                            return `
                                <tr>
                                    <td>
                                        <div class="product-cell">
                                            ${imageCell}
                                            <span>${product.name}</span>
                                        </div>
                                    </td>
                                    <td>${product.gram}</td>
                                    <td><strong>NPR ${product.price.toLocaleString()}</strong></td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn-icon-small" onclick="Admin.editProduct(${company.id}, ${product.id})">Edit</button>
                                            <button class="btn-icon-small btn-danger" onclick="Admin.deleteProduct(${company.id}, ${product.id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    return `
                        <div class="products-company-section">
                            <div class="company-section-header">
                                <div class="company-section-title">
                                    <span style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;">${initials}</span>
                                    <h3>${company.name}</h3>
                                </div>
                                <button class="btn-secondary" onclick="Admin.showAddProductModal(${company.id})">+ Add Product</button>
                            </div>
                            <div class="products-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Weight</th>
                                            <th>Price</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>${productRows}</tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }).join('');
            content.innerHTML = `
                <div class="admin-section">
                    <div class="section-header">
                        <div>
                            <h2>Products Management</h2>
                            <p class="section-subtitle">Add, edit, and manage product inventory</p>
                        </div>
                    </div>
                    ${companySections}
                </div>
            `;
        } catch (err) {
            console.error('renderProductsManagement error:', err);
            content.innerHTML = '<div class="admin-section"><p style="padding:2rem;color:#2563eb;">Failed to load products. Check server connection and try again.</p></div>';
        }
    },

    /**
     * Renders the orders management view
     * @param {HTMLElement} content - Container element
     */
    async renderOrdersManagement(content) {
        content.innerHTML = '<div class="admin-section"><p style="padding:2rem;text-align:center;color:#999;">Loading orders...</p></div>';
        try {
            const raw = await StorageManager.getOrders();
            const orders = Array.isArray(raw) ? raw : [];
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            content.innerHTML = `
                <div class="admin-section">
                    <div class="section-header">
                        <div>
                            <h2>Orders Management</h2>
                            <p class="section-subtitle">View and manage customer orders</p>
                        </div>
                    </div>
                    <div class="orders-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.length === 0 
                                    ? '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#999;">No orders yet</td></tr>'
                                    : orders.map(order => `
                                        <tr>
                                            <td><code class="order-id-code">${order.id}</code></td>
                                            <td><strong>${order.customer?.name || 'N/A'}</strong><br><small>${order.customer?.phone || ''}</small></td>
                                            <td>${order.items?.length || 0} items</td>
                                            <td><strong>NPR ${parseFloat(order.total || 0).toLocaleString()}</strong></td>
                                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('renderOrdersManagement error:', err);
            content.innerHTML = '<div class="admin-section"><p style="padding:2rem;color:#2563eb;">Failed to load orders. Check server connection and try again.</p></div>';
        }
    },

    // ==================== PRODUCT CRUD ====================

    /**
     * Opens modal to add a new product
     * @param {number} companyId - Company to add product to
     */
    showAddProductModal(companyId) { 
        this.currentEditingCompany = companyId; 
        this.productImageBase64 = null;
        document.getElementById('editModal').classList.add('active'); 
        const modal = document.getElementById('editModal'); 
        modal.querySelector('h3').textContent = 'Add New Product'; 
        document.getElementById('editName').value = ''; 
        document.getElementById('editPrice').value = ''; 
        document.getElementById('editGram').value = ''; 
        document.getElementById('editStock').value = ''; 
        document.getElementById('editImageInput').value = '';
        const preview = document.getElementById('editImagePreview');
        preview.innerHTML = `
            <div class="drag-drop-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drag and drop your image here</p>
                <p class="drag-drop-hint">or click to browse</p>
            </div>
        `;
        setTimeout(() => this.setupImageDragDrop('editImageInput', 'editImagePreview'), 100);
        const form = modal.querySelector('.edit-form'); 
        form.onsubmit = (e) => { e.preventDefault(); this.addProduct(companyId); }; 
    },

    /**
     * Adds a new product via API
     * @param {number} companyId - Company ID
     */
    async addProduct(companyId) {
        const product = {
            companyId,
            name: document.getElementById('editName').value.trim(),
            price: parseFloat(document.getElementById('editPrice').value),
            gram: document.getElementById('editGram').value.trim(),
            stock: parseInt(document.getElementById('editStock').value),
            image: this.productImageBase64 || ''
        };
        if (!product.name || !product.price || !product.gram || isNaN(product.stock)) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        try {
            await StorageManager.addProduct(product);
            this.closeEditModal();
            showNotification('Product added successfully', 'success');
            await this.showView('products');
        } catch (err) {
            console.error('addProduct error:', err);
            showNotification(err.message || 'Failed to add product. Is the server running?', 'error');
        }
    },

    /**
     * Opens modal to edit an existing product
     * @param {number} companyId - Company ID
     * @param {number} productId - Product ID
     */
    async editProduct(companyId, productId) { 
        const company = await StorageManager.getCompanyById(companyId); 
        const product = company.products.find(p => p.id === productId); 
        if (!product) return; 
        this.currentEditingProduct = { companyId, productId }; 
        this.productImageBase64 = product.image || null;
        document.getElementById('editName').value = product.name; 
        document.getElementById('editPrice').value = product.price; 
        document.getElementById('editGram').value = product.gram; 
        document.getElementById('editStock').value = product.stock;
        document.getElementById('editImageInput').value = '';
        const preview = document.getElementById('editImagePreview');
        if (product.image) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${product.image}" alt="Preview" class="image-preview">
                    <br>
                    <button type="button" class="clear-image-btn" onclick="Admin.clearImage('editImagePreview')">Clear Image</button>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="drag-drop-zone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Drag and drop your image here</p>
                    <p class="drag-drop-hint">or click to browse</p>
                </div>
            `;
        }
        const modal = document.getElementById('editModal'); 
        modal.querySelector('h3').textContent = 'Edit Product'; 
        modal.classList.add('active');
        setTimeout(() => this.setupImageDragDrop('editImageInput', 'editImagePreview'), 100);
        const form = modal.querySelector('.edit-form'); 
        form.onsubmit = (e) => { e.preventDefault(); this.saveEditedProduct(); }; 
    },

    /**
     * Saves edited product changes
     */
    async saveEditedProduct() {
        if (!this.currentEditingProduct) return;
        const { companyId, productId } = this.currentEditingProduct;
        const company = await StorageManager.getCompanyById(companyId);
        const product = company.products.find(p => p.id === productId);
        if (!product) return;
        product.name = document.getElementById('editName').value.trim();
        product.price = parseFloat(document.getElementById('editPrice').value);
        product.gram = document.getElementById('editGram').value.trim();
        product.stock = parseInt(document.getElementById('editStock').value);
        product.image = this.productImageBase64 || product.image || null;
        try {
            await StorageManager.updateProduct(productId, { 
                name: product.name, 
                price: product.price, 
                gram: product.gram, 
                stock: product.stock, 
                image: product.image 
            });
            this.closeEditModal();
            showNotification('Product updated successfully', 'success');
            await this.showView('products');
        } catch (err) {
            console.error('saveEditedProduct error:', err);
            showNotification(err.message || 'Failed to update product. Is the server running?', 'error');
        }
    },

    /**
     * Closes the product edit modal
     */
    closeEditModal() { 
        document.getElementById('editModal').classList.remove('active'); 
        this.currentEditingProduct = null; 
        this.currentEditingCompany = null; 
        this.productImageBase64 = null; 
    },

    /**
     * Deletes a product
     * @param {number} companyId - Company ID
     * @param {number} productId - Product ID
     */
    async deleteProduct(companyId, productId) { 
        if (!confirm('Delete this product?')) return; 
        await StorageManager.deleteProduct(productId); 
        await StorageManager.refreshData(); 
        showNotification('Product deleted', 'success'); 
        await this.showView('products'); 
    },

    // ==================== COMPANY CRUD ====================

    /**
     * Deletes a company and all its products
     * @param {number} companyId - Company ID
     */
    async deleteCompany(companyId) { 
        const company = await StorageManager.getCompanyById(companyId); 
        if (!confirm(`Delete "${company.name}" and all its products?`)) return; 
        await StorageManager.deleteCompany(companyId); 
        await StorageManager.refreshData(); 
        showNotification('Company deleted', 'success'); 
        await this.showView('companies'); 
    },

    /**
     * Opens modal to add a new company
     */
    showAddCompanyModal() { 
        const modal = document.createElement('div'); 
        modal.className = 'modal-overlay'; 
        modal.id = 'addCompanyModal'; 
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Add New Company</h3>
                <form class="edit-form" onsubmit="event.preventDefault(); Admin.addCompany();">
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" id="companyName" required>
                    </div>
                    <div class="form-group">
                        <label>Logo (text)</label>
                        <input type="text" id="companyLogo" placeholder="e.g. Acme">
                    </div>
                    <div class="form-group">
                        <label>Background Color</label>
                        <input type="color" id="companyBgColor" value="#000000">
                    </div>
                    <div class="form-group">
                        <label>Company Image</label>
                        <input type="file" id="companyImageInput" accept="image/*" style="display:none;">
                        <div id="companyImagePreview">
                            <div class="drag-drop-zone">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p>Drag and drop company image</p>
                                <p class="drag-drop-hint">or click to browse</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Add Company</button>
                        <button type="button" class="btn-secondary" onclick="Admin.closeAddCompanyModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `; 
        document.body.appendChild(modal); 
        modal.classList.add('active'); 
        this.companyImageBase64 = null; 
        setTimeout(() => this.setupImageDragDrop('companyImageInput', 'companyImagePreview'), 100); 
    },

    /**
     * Closes and removes the add company modal
     */
    closeAddCompanyModal() { 
        const modal = document.getElementById('addCompanyModal'); 
        if (modal) modal.remove(); 
    },

    /**
     * Opens modal to edit an existing company
     * @param {number} companyId - Company ID
     */
    async showEditCompanyModal(companyId) { 
        const companies = await StorageManager.getCompanies(); 
        const company = companies.find(c => c.id === companyId); 
        if (!company) return; 
        this.companyImageBase64 = company.image || null;
        const imagePreviewHTML = company.image 
            ? `
                <div class="image-preview-container">
                    <img src="${company.image}" alt="Preview" class="image-preview">
                    <br>
                    <button type="button" class="clear-image-btn" onclick="Admin.clearCompanyImage()">Clear Image</button>
                </div>
            ` 
            : `
                <div class="drag-drop-zone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Drag and drop company image</p>
                    <p class="drag-drop-hint">or click to browse</p>
                </div>
            `; 
        const modal = document.createElement('div'); 
        modal.className = 'modal-overlay'; 
        modal.id = 'editCompanyModal'; 
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Edit Company</h3>
                <form class="edit-form" onsubmit="event.preventDefault(); Admin.updateCompany(${companyId});">
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" id="editCompanyName" value="${company.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Logo (text)</label>
                        <input type="text" id="editCompanyLogo" value="${company.logo}">
                    </div>
                    <div class="form-group">
                        <label>Background Color</label>
                        <input type="color" id="editCompanyBgColor" value="${company.bgColor}">
                    </div>
                    <div class="form-group">
                        <label>Company Image</label>
                        <input type="file" id="editCompanyImageInput" accept="image/*" style="display:none;">
                        <div id="editCompanyImagePreview">${imagePreviewHTML}</div>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Update Company</button>
                        <button type="button" class="btn-secondary" onclick="Admin.closeEditCompanyModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `; 
        document.body.appendChild(modal); 
        modal.classList.add('active'); 
        setTimeout(() => this.setupImageDragDrop('editCompanyImageInput', 'editCompanyImagePreview'), 100); 
    },

    /**
     * Closes and removes the edit company modal
     */
    closeEditCompanyModal() { 
        const modal = document.getElementById('editCompanyModal'); 
        if (modal) modal.remove(); 
    },

    /**
     * Adds a new company via API
     */
    async addCompany() {
        const name = document.getElementById('companyName').value.trim();
        const logo = document.getElementById('companyLogo').value.trim() || '';
        const bgColor = document.getElementById('companyBgColor').value;
        const image = this.companyImageBase64 || '';
        if (!name) { showNotification('Please enter company name', 'error'); return; }
        try {
            await StorageManager.addCompany({ name, logo, bgColor, image });
            this.closeAddCompanyModal();
            showNotification('Company added successfully', 'success');
            await this.showView('companies');
        } catch (err) {
            console.error('addCompany error:', err);
            showNotification(err.message || 'Failed to add company. Is the server running?', 'error');
        }
    },

    /**
     * Updates an existing company
     * @param {number} companyId - Company ID
     */
    async updateCompany(companyId) {
        const name = document.getElementById('editCompanyName').value.trim();
        const logo = document.getElementById('editCompanyLogo').value.trim();
        const bgColor = document.getElementById('editCompanyBgColor').value;
        const image = this.companyImageBase64;
        if (!name) { showNotification('Please enter company name', 'error'); return; }
        const updateData = { name, logo, bgColor };
        if (image !== null) updateData.image = image;
        try {
            await StorageManager.updateCompany(companyId, updateData);
            this.closeEditCompanyModal();
            showNotification('Company updated successfully', 'success');
            await this.showView('companies');
        } catch (err) {
            console.error('updateCompany error:', err);
            showNotification(err.message || 'Failed to update company. Is the server running?', 'error');
        }
    },

    /**
     * Checks if admin was previously logged in (session)
     */
    checkAdminStatus() { 
        if (StorageManager.isAdminLoggedIn()) this.isLoggedIn = true; 
    },

    // ==================== IMAGE HANDLING ====================

    /**
     * Sets up drag and drop for image uploads
     * @param {string} inputId - ID of the file input
     * @param {string} previewId - ID of the preview container
     */
    setupImageDragDrop(inputId, previewId) {
        const fileInput = document.getElementById(inputId);
        const previewContainer = document.getElementById(previewId);
        const dragDropZone = previewContainer.querySelector('.drag-drop-zone');
        
        if (!dragDropZone) return;
        
        // Click to open file dialog
        dragDropZone.addEventListener('click', () => fileInput.click());
        
        // Drag over styling
        dragDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragDropZone.classList.add('active');
        });
        
        // Drag leave styling
        dragDropZone.addEventListener('dragleave', () => {
            dragDropZone.classList.remove('active');
        });
        
        // Handle dropped files
        dragDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDropZone.classList.remove('active');
            this.handleFiles(e.dataTransfer.files, previewId);
        });
        
        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, previewId);
        });
    },

    /**
     * Processes selected/dropped files
     * @param {FileList} files - List of dropped/selected files
     * @param {string} previewId - Preview container ID
     */
    handleFiles(files, previewId) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const isCompanyImage = previewId.toLowerCase().includes('company');
            if (isCompanyImage) { 
                this.companyImageBase64 = e.target.result; 
            } else { 
                this.productImageBase64 = e.target.result; 
            }
            const imageData = isCompanyImage ? this.companyImageBase64 : this.productImageBase64;
            const clearFn = isCompanyImage ? `Admin.clearCompanyImage()` : `Admin.clearImage('${previewId}')`;
            const previewContainer = document.getElementById(previewId);
            previewContainer.innerHTML = `
                <div class="image-preview-container">
                    <img src="${imageData}" alt="Preview" class="image-preview">
                    <br>
                    <button type="button" class="clear-image-btn" onclick="${clearFn}">Clear Image</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    },

    /**
     * Clears product image
     * @param {string} previewId - Preview container ID
     */
    clearImage(previewId) {
        this.productImageBase64 = null;
        const previewContainer = document.getElementById(previewId);
        document.getElementById('editImageInput').value = '';
        previewContainer.innerHTML = `
            <div class="drag-drop-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drag and drop your image here</p>
                <p class="drag-drop-hint">or click to browse</p>
            </div>
        `;
        setTimeout(() => this.setupImageDragDrop('editImageInput', previewId), 100);
    },

    /**
     * Clears company image
     */
    clearCompanyImage() {
        this.companyImageBase64 = null;
        const previewContainer = document.getElementById('editCompanyImagePreview');
        if (document.getElementById('editCompanyImageInput')) document.getElementById('editCompanyImageInput').value = '';
        previewContainer.innerHTML = `
            <div class="drag-drop-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drag and drop company image</p>
                <p class="drag-drop-hint">or click to browse</p>
            </div>
        `;
        const inputId = document.getElementById('editCompanyImageInput') ? 'editCompanyImageInput' : 'companyImageInput';
        setTimeout(() => this.setupImageDragDrop(inputId, 'editCompanyImagePreview'), 100);
    }
};
window.Admin = Admin;
