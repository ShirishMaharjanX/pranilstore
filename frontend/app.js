// ==================== MAIN APPLICATION ====================
let currentCompanyId = null, currentUser = null, allCompanies = [], searchQuery = '';

async function showCompanies() {
    await StorageManager.refreshData();
    allCompanies = await StorageManager.getCompaniesWithProducts();
    renderCompanies(allCompanies);
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';
    currentCompanyId = null;
}

function handleSearch(event) {
    searchQuery = event.target.value.toLowerCase();
    document.getElementById('searchClear').style.display = searchQuery ? 'block' : 'none';
    if (searchQuery.length >= 2) showSearchResults(searchQuery);
    else if (searchQuery.length === 0) renderCompanies();
}

function clearSearch() { document.getElementById('searchInput').value = ''; document.getElementById('searchClear').style.display = 'none'; searchQuery = ''; renderCompanies(); }

async function showSearchResults(query) {
    const companies = await StorageManager.getCompanies();
    const results = [];
    companies.forEach(company => { company.products.forEach(product => { if (product.name.toLowerCase().includes(query) || company.name.toLowerCase().includes(query)) results.push({ ...product, company }); }); });
    renderSearchResults(results, query);
}

function renderSearchResults(results, query) {
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = `<div class="search-results-header"><h2>Search Results for "${query}"</h2><p>Found ${results.length} products</p></div>`;
    if (results.length === 0) { grid.innerHTML += `<div class="empty-state"><p>No products found</p><button class="btn-primary" onclick="showCompanies()">Browse All</button></div>`; return; }
    results.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card search-result-card';
        card.onclick = () => showProducts(product.company.id);
        let stockClass = product.stock > 10 ? 'in-stock' : (product.stock > 0 ? 'low-stock' : 'out-of-stock');
        card.innerHTML = `<div class="product-image"><span style="font-size:4rem;">${product.image || '📦'}</span></div><div class="product-details"><p class="product-company">${product.company.name}</p><h3>${product.name}</h3><div class="product-meta"><span class="price">NPR ${product.price.toLocaleString()}</span><span class="weight">${product.gram}</span></div><div class="stock-badge ${stockClass}">${stockClass === 'in-stock' ? 'In Stock' : stockClass === 'low-stock' ? 'Low Stock' : 'Out of Stock'}</div></div>`;
        grid.appendChild(card);
    });
}

function hideLoading() { const loader = document.getElementById('loadingScreen'); loader.classList.add('hidden'); setTimeout(() => loader.style.display = 'none', 500); }

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await StorageManager.init();
        allCompanies = await StorageManager.getCompaniesWithProducts();
        renderCompanies(allCompanies);
        await CustomerAuth.checkAuthStatus();
        Admin.checkAdminStatus();
    } catch (error) { console.error('Init error:', error); showNotification('Failed to load', 'error'); }
    finally { hideLoading(); }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('customerDashboard').classList.remove('active');
            document.getElementById('editProfileModal').classList.remove('active');
            document.getElementById('changePasswordModal').classList.remove('active');
            document.getElementById('adminPanel').classList.remove('active');
        }
    });
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.animation = 'slideIn 0.3s ease-out reverse'; setTimeout(() => notification.remove(), 300); }, 3000);
}

function renderCompanies(companies) {
    if (!companies) companies = allCompanies;
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = '';
    if (companies.length === 0) { grid.innerHTML = '<div class="empty-state"><h3>No companies yet</h3><button class="btn-primary" onclick="Admin.showAdminPanel()">Go to Admin</button></div>'; return; }
    companies.forEach((company, index) => {
        const card = document.createElement('div');
        card.className = 'company-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `<span style="font-size:4rem;">${company.logo}</span><h3>${company.name}</h3><p>${company.products.length} Products</p>`;
        card.addEventListener('click', () => showProducts(company.id));
        grid.appendChild(card);
    });
}

async function showProducts(companyId) {
    const company = await StorageManager.getCompanyById(companyId);
    if (!company) return;
    const products = await StorageManager.getProducts(companyId);
    currentCompanyId = companyId;
    document.getElementById('companyView').style.display = 'none';
    document.getElementById('productsView').style.display = 'block';
    document.getElementById('productsHeader').style.background = `linear-gradient(135deg, ${company.bgColor}22, ${company.bgColor}11)`;
    document.getElementById('companyInfoHeader').innerHTML = `<h2>${company.name}</h2>`;
    const bgEl = document.getElementById('productsBg');
    if (bgEl) { bgEl.style.backgroundImage = company.headerImage ? `url('${company.headerImage}')` : ''; requestAnimationFrame(() => { bgEl.style.opacity = '1'; }); }
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    if (products.length === 0) { grid.innerHTML = '<div class="empty-state"><h3>No products in this company</h3></div>'; return; }
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        let stockClass = product.stock > 10 ? 'in-stock' : (product.stock > 0 ? 'low-stock' : 'out-of-stock');
        card.innerHTML = `<div class="product-image"><span style="font-size:4rem;">${product.image || '📦'}</span></div><div class="product-details"><h3>${product.name}</h3><div class="product-meta"><span class="price">NPR ${product.price.toLocaleString()}</span><span class="weight">${product.gram}</span></div><div class="stock-badge ${stockClass}">${stockClass === 'in-stock' ? `In Stock (${product.stock})` : stockClass === 'low-stock' ? `Low Stock (${product.stock})` : 'Out of Stock'}</div><button class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button></div>`;
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => Cart.addToCart(product, company));
        grid.appendChild(card);
    });
}
