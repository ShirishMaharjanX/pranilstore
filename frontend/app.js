// ==================== MAIN APPLICATION ====================
let currentCompanyId = null;
let allCompanies = [];
let searchQuery = '';
let scrollRevealObserver = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatNpr(value) {
    const numeric = Number(value) || 0;
    return `NPR ${numeric.toLocaleString()}`;
}

function isSafeImageSource(value) {
    const image = String(value || '').trim();
    if (!image) return false;
    if (image.startsWith('data:image/')) return true;
    if (image.startsWith('http://') || image.startsWith('https://')) return true;
    if (image.startsWith('/') || image.startsWith('./') || image.startsWith('../')) return true;
    if (/^[^:<>"]+\.(png|jpe?g|gif|webp|svg)$/i.test(image)) return true;
    return false;
}

function toSafeCssUrl(value) {
    return String(value || '').replace(/["'()\\\r\n]/g, '');
}

window.escapeHtml = escapeHtml;
window.formatNpr = formatNpr;
window.isSafeImageSource = isSafeImageSource;

function initScrollRevealObserver() {
    if (scrollRevealObserver) {
        return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    scrollRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in-view');
            scrollRevealObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    });

    refreshScrollRevealTargets();
}

function refreshScrollRevealTargets() {
    if (!scrollRevealObserver) {
        return;
    }

    const targets = document.querySelectorAll(
        '.page-header, .company-card, .products-header, .product-card, .footer-column, .dashboard-card'
    );

    let order = 0;
    targets.forEach(target => {
        if (target.classList.contains('in-view')) {
            return;
        }
        target.classList.add('scroll-reveal');
        target.style.setProperty('--reveal-delay', `${Math.min(order * 50, 350)}ms`);
        scrollRevealObserver.observe(target);
        order += 1;
    });
}

window.refreshScrollRevealTargets = refreshScrollRevealTargets;

function renderImageMarkup(image, altText, size = '100%', fontSize = '2rem') {
    if (!image) {
        return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);color:#999;font-size:2rem;">Image</div>';
    }

    if (isSafeImageSource(image)) {
        return `<img src="${escapeHtml(image)}" alt="${escapeHtml(altText)}" style="width:${size};height:${size};object-fit:cover;">`;
    }

    // Non-image values are intentionally hidden to keep visuals clean and emoji-free.
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);color:#999;font-size:${fontSize};">Image</div>`;
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        await navigator.serviceWorker.register('sw.js');
    } catch (error) {
        console.warn('Service worker registration failed:', error);
    }
}

async function showCompanies() {
    await StorageManager.refreshData();
    allCompanies = await StorageManager.getCompaniesWithProducts();
    renderCompanies(allCompanies);
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';
    currentCompanyId = null;
    refreshScrollRevealTargets();
}

async function handleSearch(event) {
    const value = (event?.target?.value || '').toLowerCase();
    searchQuery = value;
    document.getElementById('searchClear').style.display = searchQuery ? 'block' : 'none';

    if (searchQuery.length >= 2) {
        await showSearchResults(searchQuery);
        return;
    }

    if (searchQuery.length === 0) {
        await showCompanies();
    }
}

async function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').style.display = 'none';
    searchQuery = '';
    await showCompanies();
}

async function showSearchResults(query) {
    await StorageManager.refreshData();
    const companies = await StorageManager.getCompanies();
    const results = [];

    companies.forEach(company => {
        (company.products || []).forEach(product => {
            const matchesProduct = (product.name || '').toLowerCase().includes(query);
            const matchesCompany = (company.name || '').toLowerCase().includes(query);
            if (matchesProduct || matchesCompany) {
                results.push({ ...product, company });
            }
        });
    });

    renderSearchResults(results, query);
}

function renderSearchResults(results, query) {
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';

    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = `<div class="search-results-header"><h2>Search Results for "${escapeHtml(query)}"</h2><p>Found ${results.length} products</p></div>`;

    if (results.length === 0) {
        grid.innerHTML += '<div class="empty-state"><p>No products found</p><button class="btn-primary" onclick="showCompanies()">Browse All</button></div>';
        return;
    }

    results.forEach(product => {
        const productName = escapeHtml(product.name || 'Unnamed Product');
        const companyName = escapeHtml(product.company?.name || 'Unknown Company');
        const productWeight = escapeHtml(product.gram || '');
        const imageMarkup = renderImageMarkup(product.image, productName);

        const card = document.createElement('div');
        card.className = 'product-card search-result-card';
        card.onclick = () => showProducts(product.company.id);
        card.innerHTML = `<div class="product-image"><div class="product-placeholder">${imageMarkup}</div></div><div class="product-details"><p class="product-company">${companyName}</p><h3>${productName}</h3><div class="product-meta"><span class="price">${formatNpr(product.price)}</span><span class="weight">${productWeight}</span></div></div>`;
        grid.appendChild(card);
    });

    refreshScrollRevealTargets();
}

function hideLoading() {
    const loader = document.getElementById('loadingScreen');
    loader.classList.add('hidden');
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await StorageManager.init();
        allCompanies = await StorageManager.getCompaniesWithProducts();
        renderCompanies(allCompanies);
        initScrollRevealObserver();
        await CustomerAuth.checkAuthStatus();
        Admin.checkAdminStatus();
        registerServiceWorker();
    } catch (error) {
        console.error('Init error:', error);
        showNotification('Failed to load', 'error');
    } finally {
        hideLoading();
    }

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('customerDashboard').classList.remove('active');
        document.getElementById('editProfileModal').classList.remove('active');
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('adminPanel').classList.remove('active');
    });
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    notification.appendChild(messageEl);

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function renderCompanies(companies = allCompanies) {
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = '';

    if (!companies || companies.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No companies yet</h3><button class="btn-primary" onclick="Admin.showAdminPanel()">Go to Admin</button></div>';
        return;
    }

    companies.forEach((company, index) => {
        const companyName = escapeHtml(company.name || 'Unnamed Company');
        const companyLogo = escapeHtml(company.logo || '');
        const companyColor = escapeHtml(company.bgColor || '#1e3a8a');

        const card = document.createElement('div');
        card.className = 'company-card';
        card.style.animationDelay = `${index * 0.1}s`;

        let logoDisplay = '<div style="width:120px;height:120px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:12px;color:white;font-weight:bold;">Logo</div>';
        if (isSafeImageSource(company.image)) {
            logoDisplay = `<img src="${escapeHtml(company.image)}" alt="${companyName}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;">`;
        } else if (company.logo) {
            logoDisplay = `<div style="width:120px;height:120px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${companyColor},${companyColor}dd);border-radius:12px;font-size:3.5rem;">${companyLogo}</div>`;
        }

        card.innerHTML = `<div style="margin-bottom:1rem;">${logoDisplay}</div><h3>${companyName}</h3><p>${(company.products || []).length} Products</p>`;
        card.addEventListener('click', () => showProducts(company.id));
        grid.appendChild(card);
    });

    refreshScrollRevealTargets();
}

async function showProducts(companyId) {
    const company = await StorageManager.getCompanyById(companyId);
    if (!company) return;

    const products = await StorageManager.getProducts(companyId);
    currentCompanyId = companyId;

    document.getElementById('companyView').style.display = 'none';
    document.getElementById('productsView').style.display = 'block';
    document.getElementById('productsHeader').style.background = `linear-gradient(135deg, ${company.bgColor}22, ${company.bgColor}11)`;

    const companyHeader = document.getElementById('companyInfoHeader');
    companyHeader.innerHTML = '';
    const companyTitle = document.createElement('h2');
    companyTitle.textContent = company.name || 'Company';
    companyHeader.appendChild(companyTitle);

    const bgEl = document.getElementById('productsBg');
    if (bgEl) {
        if (isSafeImageSource(company.image)) {
            bgEl.style.backgroundImage = `url("${toSafeCssUrl(company.image)}")`;
            bgEl.style.backgroundSize = 'cover';
            bgEl.style.backgroundPosition = 'center';
            bgEl.style.filter = 'blur(8px)';
        } else if (isSafeImageSource(company.headerImage)) {
            bgEl.style.backgroundImage = `url("${toSafeCssUrl(company.headerImage)}")`;
            bgEl.style.filter = 'none';
        } else {
            const color = escapeHtml(company.bgColor || '#1e3a8a');
            bgEl.style.backgroundImage = `linear-gradient(135deg, ${color}, ${color}dd)`;
            bgEl.style.backgroundSize = 'cover';
            bgEl.style.filter = 'none';
        }
        requestAnimationFrame(() => {
            bgEl.style.opacity = '1';
        });
    }

    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No products in this company</h3></div>';
        return;
    }

    products.forEach(product => {
        const productName = escapeHtml(product.name || 'Unnamed Product');
        const productWeight = escapeHtml(product.gram || '');
        const imageMarkup = renderImageMarkup(product.image, productName);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `<div class="product-image"><div class="product-placeholder">${imageMarkup}</div></div><div class="product-details"><h3>${productName}</h3><div class="product-meta"><span class="price">${formatNpr(product.price)}</span><span class="weight">${productWeight}</span></div><button class="add-to-cart-btn">Add to Cart</button></div>`;
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => Cart.addToCart(product, company));
        grid.appendChild(card);
    });

    refreshScrollRevealTargets();
}
