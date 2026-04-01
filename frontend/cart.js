/**
 * Shopping Cart Module
 * ====================
 * Handles all shopping cart functionality:
 * - Adding/removing items
 * - Cart UI updates
 * - Checkout process
 * - Order creation and printing
 */

const Cart = {
    // Cart items array
    items: [],

    /**
     * Adds a product to the cart
     * @param {Object} product - Product object to add
     * @param {Object} company - Company the product belongs to
     */
    addToCart(product, company) {
        const price = Number(product?.price) || 0;
        const item = {
            ...product,
            price,
            companyName: company?.name || 'Unknown Company'
        };

        this.items.push(item);
        this.updateUI();
        showNotification(`${product.name} added to cart!`, 'success');
    },

    /**
     * Removes an item from cart by index
     * @param {number} index - Index of item to remove
     */
    removeFromCart(index) {
        if (index < 0 || index >= this.items.length) return;
        const [removed] = this.items.splice(index, 1);
        this.updateUI();
        showNotification(`${removed.name} removed`, 'success');
    },

    /**
     * Calculates total price of all items in cart
     * @returns {number} - Total amount
     */
    calculateTotal() {
        return this.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    },

    /**
     * Safely escapes text for display
     * @param {*} value - Value to escape
     * @returns {string} - Escaped string
     */
    getSafeText(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(value);
        return String(value ?? '');
    },

    /**
     * Renders item image or placeholder
     * @param {Object} item - Cart item object
     * @returns {string} - HTML for image
     */
    renderItemImage(item) {
        if (!item.image) {
            return '<div style="width:40px;height:40px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;"></div>';
        }

        const image = String(item.image);
        if (typeof isSafeImageSource === 'function' && isSafeImageSource(image)) {
            return `<img src="${this.getSafeText(image)}" alt="${this.getSafeText(item.name)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">`;
        }

        return '<div style="width:40px;height:40px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1rem;"></div>';
    },

    /**
     * Formats amount as Nepali Rupees
     * @param {number} value - Amount to format
     * @returns {string} - Formatted currency
     */
    formatAmount(value) {
        if (typeof formatNpr === 'function') return formatNpr(value);
        return `NPR ${(Number(value) || 0).toLocaleString()}`;
    },

    /**
     * Updates the cart UI (items, total, count)
     */
    updateUI() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        // Update cart count badge in header
        document.getElementById('cartCount').textContent = this.items.length;

        // Show empty state when cart is empty
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <div style="width:64px;height:64px;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);border-radius:8px;">
                        <div style="font-size:2rem;"></div>
                    </div>
                    <p>Your cart is empty</p>
                </div>`;
            cartFooter.style.display = 'none';
            return;
        }

        // Show cart footer with checkout form
        cartFooter.style.display = 'block';
        
        // Render each cart item
        cartItemsContainer.innerHTML = this.items.map((item, index) => {
            const name = this.getSafeText(item.name);
            const companyName = this.getSafeText(item.companyName);
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-icon">${this.renderItemImage(item)}</span>
                        <div class="cart-item-details">
                            <strong>${name}</strong>
                            <small>${companyName}</small>
                            <div class="cart-item-price">${this.formatAmount(item.price)}</div>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="Cart.removeFromCart(${index})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // Update total display
        const total = this.calculateTotal();
        document.getElementById('totalAmount').textContent = this.formatAmount(total);
        document.getElementById('totalAmountFinal').textContent = this.formatAmount(total);
    },

    /**
     * Toggles the cart sidebar visibility
     */
    toggleCart() {
        const sidebar = document.getElementById('checkoutSidebar');
        const isOpen = sidebar.classList.contains('open');

        if (isOpen) {
            // Close sidebar
            sidebar.classList.remove('open');
            sidebar.style.display = 'none';
            return;
        }

        // Open sidebar
        sidebar.classList.add('open');
        sidebar.style.display = 'flex';

        // Pre-fill customer info if logged in
        if (StorageManager.isCustomerLoggedIn()) {
            StorageManager.getCurrentUser().then(customer => {
                if (!customer) return;
                document.getElementById('customerName').value = customer.name || '';
                document.getElementById('customerPhone').value = customer.phone || '';
                document.getElementById('customerLocation').value = customer.location || '';
                document.getElementById('customerPan').value = customer.pan || '';
            });
        }
    },

    /**
     * Processes checkout - creates order and sends to printer
     */
    async checkout() {
        // Get customer info from form
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const location = document.getElementById('customerLocation').value.trim();
        const pan = document.getElementById('customerPan').value.trim();
        const checkoutBtn = document.querySelector('.checkout-btn');

        // Validate required fields
        if (!name || !phone || !location) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        if (this.items.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }

        // Show loading state
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';

        try {
            // Get current user if logged in
            const currentUser = await StorageManager.getCurrentUser();
            
            // Build order object
            const order = {
                customerId: currentUser ? currentUser.customerId : null,
                customer: { name, phone, location, pan: pan || 'N/A' },
                items: this.items,
                total: this.calculateTotal()
            };

            // Create order via API
            const orderResult = await StorageManager.createOrder(order);
            const createdOrderId = orderResult?.orderId || null;

            // Try to print the order receipt
            let printMessage = '';
            try {
                const printResult = await StorageManager.printOrder({
                    orderId: createdOrderId,
                    order
                });
                if (!printResult?.success) {
                    printMessage = printResult?.message || 'Printer did not accept the job';
                }
            } catch (printError) {
                printMessage = printError.message || 'Printer request failed';
            }

            // Clear cart after successful order
            this.items = [];
            this.updateUI();
            
            // Show appropriate notification
            if (printMessage) {
                showNotification(`Order placed, but print failed: ${printMessage}`, 'error');
            } else {
                showNotification('Order placed and sent to printer!', 'success');
            }
            
            // Close cart and refresh after delay
            setTimeout(() => {
                this.toggleCart();
                showCompanies();
            }, 2000);
        } catch (err) {
            showNotification(err.message || 'Failed to place order', 'error');
        } finally {
            // Reset button state
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Complete Purchase';
        }
    }
};

window.Cart = Cart;
