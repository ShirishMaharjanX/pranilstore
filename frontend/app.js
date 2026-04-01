/**
 * Pranil Sales & Marketing - Main Application
 * =============================================
 * This is the core frontend application for the Pranil e-commerce platform.
 * It handles company/product display, search, filtering, and user interactions.
 * 
 * Features:
 * - Company listing with 3D card effects
 * - Product browsing and filtering
 * - Search functionality
 * - Review system
 * - Scroll reveal animations
 * - Service worker registration
 */

// ==================== GLOBAL STATE ====================
let currentCompanyId = null;
let allCompanies = [];
let searchQuery = '';
let scrollRevealObserver = null;
let currentFilters = { companyId: null, minPrice: null, maxPrice: null, inStock: false };

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {*} value - The value to escape
 * @returns {string} - HTML-escaped string
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Formats a numeric value as Nepali Rupees (NPR)
 * @param {number|string} value - The value to format
 * @returns {string} - Formatted currency string
 */
function formatNpr(value) {
    const numeric = Number(value) || 0;
    return `NPR ${numeric.toLocaleString()}`;
}

/**
 * Validates if a string is a safe image source
 * Accepts: data URIs, http/https URLs, relative paths, and common image extensions
 * @param {string} value - The image source to validate
 * @returns {boolean} - True if safe
 */
function isSafeImageSource(value) {
    const image = String(value || '').trim();
    if (!image) return false;
    if (image.startsWith('data:image/')) return true;
    if (image.startsWith('http://') || image.startsWith('https://')) return true;
    if (image.startsWith('/') || image.startsWith('./') || image.startsWith('../')) return true;
    if (/^[^:<>"]+\.(png|jpe?g|gif|webp|svg)$/i.test(image)) return true;
    return false;
}

/**
 * Sanitizes a value for use in CSS background-image URLs
 * Removes characters that could break CSS syntax
 * @param {string} value - The value to sanitize
 * @returns {string} - Sanitized CSS value
 */
function toSafeCssUrl(value) {
    return String(value || '').replace(/["'()\\\r\n]/g, '');
}

// Expose utility functions globally for use in HTML onclick handlers
window.escapeHtml = escapeHtml;
window.formatNpr = formatNpr;
window.isSafeImageSource = isSafeImageSource;

/**
 * Initializes the IntersectionObserver for scroll reveal animations
 * Respects user's motion preference settings
 */
function initScrollRevealObserver() {
    // Prevent multiple observers
    if (scrollRevealObserver) {
        return;
    }

    // Respect reduced motion preference for accessibility
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Create observer for elements entering the viewport
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

/**
 * Finds and registers elements for scroll reveal animations
 * Targets specific CSS classes used in the layout
 */
function refreshScrollRevealTargets() {
    if (!scrollRevealObserver) {
        return;
    }

    // Query elements that should animate on scroll
    const targets = document.querySelectorAll(
        '.page-header, .company-card, .products-header, .product-card, .footer-column, .dashboard-card'
    );

    let order = 0;
    targets.forEach(target => {
        if (target.classList.contains('in-view')) {
            return;
        }
        target.classList.add('scroll-reveal');
        // Add staggered animation delay based on order
        target.style.setProperty('--reveal-delay', `${Math.min(order * 50, 350)}ms`);
        scrollRevealObserver.observe(target);
        order += 1;
    });
}

// Expose for use by other modules
window.refreshScrollRevealTargets = refreshScrollRevealTargets;

/**
 * Renders image markup with fallback for missing or invalid images
 * @param {string} image - Image URL or data URI
 * @param {string} altText - Alt text for the image
 * @param {string} size - CSS size value
 * @param {string} fontSize - Font size for placeholder
 * @returns {string} - HTML markup for the image
 */
function renderImageMarkup(image, altText, size = '100%', fontSize = '2rem') {
    if (!image) {
        return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);color:#999;font-size:2rem;">Image</div>';
    }

    if (isSafeImageSource(image)) {
        return `<img src="${escapeHtml(image)}" alt="${escapeHtml(altText)}" style="width:${size};height:${size};object-fit:cover;">`;
    }

    // Non-image values are intentionally hidden to keep visuals clean
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);color:#999;font-size:${fontSize};">Image</div>`;
}

/**
 * Registers the service worker for PWA functionality
 * Provides offline support and faster loading
 */
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        await navigator.serviceWorker.register('sw.js');
    } catch (error) {
        console.warn('Service worker registration failed:', error);
    }
}

// ==================== COMPANY VIEW ====================

/**
 * Displays the main companies view
 * Loads all companies with their products and renders the grid
 */
async function showCompanies() {
    await StorageManager.refreshData();
    allCompanies = await StorageManager.getCompaniesWithProducts();
    renderCompanies(allCompanies);
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';
    currentCompanyId = null;
    refreshScrollRevealTargets();
}

/**
 * Handles search input changes
 * Triggers search after 2+ characters, returns to company view if cleared
 * @param {Event} event - Input event from search field
 */
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

/**
 * Clears the search input and returns to company view
 */
async function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').style.display = 'none';
    searchQuery = '';
    await showCompanies();
}

/**
 * Searches for products matching the query across all companies
 * @param {string} query - Search term
 * @returns {Array} - Array of matching products with company info
 */
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

/**
 * Renders search results in the company grid
 * @param {Array} results - Search results array
 * @param {string} query - Original search query
 */
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

// ==================== APP INITIALIZATION ====================

/**
 * Main application initialization on DOM ready
 * Sets up auth, admin status, service worker, and initial data
 */
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
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        // Close all modals on Escape key
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('customerDashboard').classList.remove('active');
        document.getElementById('editProfileModal').classList.remove('active');
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('adminPanel').classList.remove('active');
    });
});

/**
 * Shows a toast notification to the user
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success' or 'error'
 */
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

// ==================== COMPANY RENDERING ====================

/**
 * Renders the company cards grid
 * @param {Array} companies - Array of company objects
 */
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
        
        // Background image for 3D effect
        let bgStyle = '';
        if (isSafeImageSource(company.image)) {
            bgStyle = `background-image: url("${escapeHtml(company.image)}"); background-size: cover; background-position: center;`;
        } else if (company.headerImage) {
            bgStyle = `background-image: url("${escapeHtml(company.headerImage)}"); background-size: cover; background-position: center;`;
        }

        // Logo display with image or text fallback
        let logoDisplay = '<div style="width:120px;height:120px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:12px;color:white;font-weight:bold;">Logo</div>';
        if (isSafeImageSource(company.image)) {
            logoDisplay = `<img src="${escapeHtml(company.image)}" alt="${companyName}" style="width:120px;height:120px;object-fit:cover;border-radius:12px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">`;
        } else if (company.logo) {
            logoDisplay = `<div style="width:120px;height:120px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${companyColor},${companyColor}dd);border-radius:12px;font-size:3.5rem;">${companyLogo}</div>`;
        }

        card.innerHTML = `
            <div class="company-card-bg" style="${bgStyle}"></div>
            <div class="company-card-content">
                <div style="margin-bottom:1rem; position: relative; z-index: 2;">${logoDisplay}</div>
                <h3>${companyName}</h3>
                <p>${(company.products || []).length} Products</p>
            </div>`;
        
        // Add 3D tilt effect for interactivity
        card.addEventListener('mousemove', (e) => handle3DTilt(e, card));
        card.addEventListener('mouseleave', () => reset3DTilt(card));
        card.addEventListener('click', () => showProducts(company.id));
        grid.appendChild(card);
    });

    refreshScrollRevealTargets();
}

// ==================== 3D CARD EFFECTS ====================

/**
 * Creates 3D tilt effect on company cards when mouse moves
 * @param {MouseEvent} e - Mouse event
 * @param {HTMLElement} card - Card element
 */
function handle3DTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    card.style.zIndex = '10';
    
    const bg = card.querySelector('.company-card-bg');
    if (bg) {
        bg.style.opacity = '0.3';
        bg.style.transform = 'scale(1.2)';
    }
}

/**
 * Resets the 3D tilt effect when mouse leaves the card
 * @param {HTMLElement} card - Card element
 */
function reset3DTilt(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    card.style.zIndex = '1';
    
    const bg = card.querySelector('.company-card-bg');
    if (bg) {
        bg.style.opacity = '0';
        bg.style.transform = 'scale(1)';
    }
}

/**
 * Creates 3D tilt effect on product cards
 * @param {MouseEvent} e - Mouse event
 * @param {HTMLElement} card - Card element
 */
function handleProduct3DTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    card.style.zIndex = '10';
    
    const bg = card.querySelector('.product-card-bg');
    if (bg) {
        bg.style.opacity = '0.25';
    }
}

/**
 * Resets the product card 3D effect
 * @param {HTMLElement} card - Card element
 */
function resetProduct3DTilt(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    card.style.zIndex = '1';
    
    const bg = card.querySelector('.product-card-bg');
    if (bg) {
        bg.style.opacity = '0';
    }
}

// ==================== PRODUCT VIEW ====================

/**
 * Displays products for a specific company
 * @param {number} companyId - Company ID to show products for
 */
async function showProducts(companyId) {
    const company = await StorageManager.getCompanyById(companyId);
    if (!company) return;

    const products = await StorageManager.getProducts(companyId);
    currentCompanyId = companyId;

    document.getElementById('companyView').style.display = 'none';
    document.getElementById('productsView').style.display = 'block';
    document.getElementById('productsHeader').style.background = `linear-gradient(135deg, ${company.bgColor}22, ${company.bgColor}11)`;

    // Set company title in header
    const companyHeader = document.getElementById('companyInfoHeader');
    companyHeader.innerHTML = '';
    const companyTitle = document.createElement('h2');
    companyTitle.textContent = company.name || 'Company';
    companyHeader.appendChild(companyTitle);

    // Set background image with blur effect
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
        
        // Product background image for 3D effect
        let bgStyle = '';
        if (isSafeImageSource(product.image)) {
            bgStyle = `background-image: url("${escapeHtml(product.image)}"); background-size: cover; background-position: center;`;
        }
        
        card.innerHTML = `
            <div class="product-card-bg" style="${bgStyle}"></div>
            <div class="product-image"><div class="product-placeholder">${imageMarkup}</div></div>
            <div class="product-details">
                <h3>${productName}</h3>
                <div class="product-meta"><span class="price">${formatNpr(product.price)}</span><span class="weight">${productWeight}</span></div>
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>`;
        
        // Add 3D tilt effect
        card.addEventListener('mousemove', (e) => handleProduct3DTilt(e, card));
        card.addEventListener('mouseleave', () => resetProduct3DTilt(card));
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => Cart.addToCart(product, company));
        grid.appendChild(card);
    });

    refreshScrollRevealTargets();
}

// ==================== FILTERS ====================

/**
 * Toggles the filter panel visibility
 */
function toggleFilters() {
    const panel = document.getElementById('filterPanel');
    panel.classList.toggle('active');
}

/**
 * Initializes the company filter dropdown
 */
async function initFilters() {
    const companies = await StorageManager.getCompanies();
    const select = document.getElementById('filterCompany');
    companies.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });
}

/**
 * Applies the current filter selections
 */
async function applyFilters() {
    const companyId = document.getElementById('filterCompany').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;
    const inStock = document.getElementById('filterInStock').checked;
    
    currentFilters = {
        companyId: companyId ? parseInt(companyId) : null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        inStock: inStock
    };
    
    await performFilteredSearch();
}

/**
 * Performs the filtered search using the API
 */
async function performFilteredSearch() {
    const params = new URLSearchParams();
    if (currentFilters.companyId) params.append('companyId', currentFilters.companyId);
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.inStock) params.append('inStock', 'true');
    if (searchQuery) params.append('q', searchQuery);
    
    try {
        const results = await StorageManager.request('/api/search?' + params.toString());
        renderFilteredProducts(results);
    } catch (error) {
        console.error('Filter error:', error);
    }
}

/**
 * Renders filtered products in the grid
 * @param {Array} products - Array of filtered products
 */
function renderFilteredProducts(products) {
    document.getElementById('companyView').style.display = 'block';
    document.getElementById('productsView').style.display = 'none';
    
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = `<div class="search-results-header"><h2>Search Results</h2><p>Found ${products.length} products</p></div>`;
    
    if (products.length === 0) {
        grid.innerHTML += '<div class="empty-state"><p>No products found</p><button class="btn-primary" onclick="clearFilters()">Clear Filters</button></div>';
        return;
    }
    
    products.forEach(product => {
        const productName = escapeHtml(product.name || 'Unnamed Product');
        const productWeight = escapeHtml(product.gram || '');
        const imageMarkup = renderImageMarkup(product.image, productName);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `<div class="product-image"><div class="product-placeholder">${imageMarkup}</div></div><div class="product-details"><h3>${productName}</h3><div class="product-meta"><span class="price">${formatNpr(product.price)}</span><span class="weight">${productWeight}</span></div><button class="add-to-cart-btn">Add to Cart</button></div>`;
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            if (product.company) {
                Cart.addToCart(product, product.company);
            }
        });
        grid.appendChild(card);
    });
    
    refreshScrollRevealTargets();
}

/**
 * Clears all filters and resets the view
 */
function clearFilters() {
    document.getElementById('filterCompany').value = '';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    document.getElementById('filterInStock').checked = false;
    currentFilters = { companyId: null, minPrice: null, maxPrice: null, inStock: false };
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    showCompanies();
    document.getElementById('filterPanel').classList.remove('active');
}

// ==================== REVIEWS ====================

/**
 * Loads and displays reviews for a product
 * @param {number} productId - Product ID
 */
async function showProductReviews(productId) {
    const section = document.getElementById('reviewsSection');
    section.innerHTML = '<h3>Reviews</h3><div id="reviewsList" class="reviews-list"></div>';
    
    try {
        const reviews = await StorageManager.request('/api/reviews?productId=' + productId);
        renderReviews(reviews, productId);
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Renders reviews list and review submission form
 * @param {Array} reviews - Array of review objects
 * @param {number} productId - Product ID
 */
function renderReviews(reviews, productId) {
    const list = document.getElementById('reviewsList');
    
    if (!reviews || reviews.length === 0) {
        list.innerHTML = '<p class="empty-state">No reviews yet. Be the first to review!</p>';
    }
    
    reviews.forEach(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = new Date(review.createdAt).toLocaleDateString();
        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = `
            <div class="review-header">
                <span class="review-author">${escapeHtml(review.customerName)}</span>
                <span class="review-rating">${stars}</span>
            </div>
            <p class="review-comment">${escapeHtml(review.comment)}</p>
            <span class="review-date">${date}</span>
        `;
        list.appendChild(item);
    });
    
    // Add review submission form
    const form = document.createElement('div');
    form.className = 'review-form';
    form.innerHTML = `
        <h4>Write a Review</h4>
        <select id="reviewRating">
            <option value="5">5 Stars - Excellent</option>
            <option value="4">4 Stars - Very Good</option>
            <option value="3">3 Stars - Good</option>
            <option value="2">2 Stars - Fair</option>
            <option value="1">1 Star - Poor</option>
        </select>
        <textarea id="reviewComment" placeholder="Share your experience with this product..."></textarea>
        <button class="btn-primary" onclick="submitReview(${productId})">Submit Review</button>
    `;
    list.appendChild(form);
}

/**
 * Submits a new review for a product
 * @param {number} productId - Product ID
 */
async function submitReview(productId) {
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value;
    
    if (!comment.trim()) {
        showNotification('Please write a review', 'error');
        return;
    }
    
    const user = await StorageManager.getCurrentUser();
    const reviewData = {
        productId: productId,
        rating: parseInt(rating),
        comment: comment,
        customerId: user ? user.customerId : null,
        customerName: user ? user.name : 'Guest'
    };
    
    try {
        await StorageManager.request('/api/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
        showNotification('Review submitted successfully!', 'success');
        showProductReviews(productId);
    } catch (error) {
        showNotification('Failed to submit review', 'error');
    }
}

// Initialize filters on page load
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
});
