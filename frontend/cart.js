const Cart = {
    items: [],
    addToCart(product, company) { this.items.push({ ...product, companyName: company.name }); this.updateUI(); showNotification(`${product.name} added to cart!`, 'success'); },
    removeFromCart(index) { const removed = this.items.splice(index, 1); this.updateUI(); showNotification(`${removed[0].name} removed`, 'success'); },
    calculateTotal() { return this.items.reduce((sum, item) => sum + item.price, 0); },
    updateUI() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        document.getElementById('cartCount').textContent = this.items.length;
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-state"><div style="width:64px;height:64px;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f5f5,#e5e5e5);border-radius:8px;"><div style="font-size:2rem;"></div></div><p>Your cart is empty</p></div>';
            cartFooter.style.display = 'none';
        } else {
            cartFooter.style.display = 'block';
            cartItemsContainer.innerHTML = this.items.map((item, index) => `<div class="cart-item"><div class="cart-item-info"><span class="cart-item-icon">${item.image ? `<img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` : '<div style="width:40px;height:40px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;"></div>'}</span><div class="cart-item-details"><strong>${item.name}</strong><small>${item.companyName}</small><div class="cart-item-price">NPR ${item.price.toLocaleString()}</div></div></div><button class="remove-btn" onclick="Cart.removeFromCart(${index})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`).join('');
            document.getElementById('totalAmount').textContent = `NPR ${this.calculateTotal().toLocaleString()}`;
            document.getElementById('totalAmountFinal').textContent = `NPR ${this.calculateTotal().toLocaleString()}`;
        }
    },
    async toggleCart() {
        const sidebar = document.getElementById('checkoutSidebar');
        if (sidebar.style.display === 'flex') sidebar.style.display = 'none';
        else {
            sidebar.style.display = 'flex';
            if (StorageManager.isCustomerLoggedIn()) {
                const customer = await StorageManager.getCurrentUser();
                if (customer) { document.getElementById('customerName').value = customer.name || ''; document.getElementById('customerPhone').value = customer.phone || ''; document.getElementById('customerLocation').value = customer.location || ''; document.getElementById('customerPan').value = customer.pan || ''; }
            }
        }
    },
    async checkout() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const location = document.getElementById('customerLocation').value.trim();
        const pan = document.getElementById('customerPan').value.trim();
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (!name || !phone || !location) { showNotification('Please fill all required fields', 'error'); return; }
        if (this.items.length === 0) { showNotification('Your cart is empty', 'error'); return; }
        checkoutBtn.disabled = true; checkoutBtn.textContent = 'Processing...';
        const currentUser = await StorageManager.getCurrentUser();
        const order = { customerId: currentUser ? currentUser.customerId : null, customer: { name, phone, location, pan: pan || 'N/A' }, items: this.items, total: this.calculateTotal() };
        await StorageManager.createOrder(order);
        this.items = []; this.updateUI();
        checkoutBtn.disabled = false; checkoutBtn.textContent = 'Complete Purchase';
        showNotification('Order placed successfully!', 'success');
        setTimeout(() => { this.toggleCart(); showCompanies(); }, 2000);
    }
};
window.Cart = Cart;
