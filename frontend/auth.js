const CustomerAuth = {
    currentUser: null,
    registerProfileImage: '',
    editProfileImage: '',

    escape(value) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    formatAmount(value) {
        if (typeof window.formatNpr === 'function') return window.formatNpr(value);
        return `NPR ${(Number(value) || 0).toLocaleString()}`;
    },

    isSafeImage(value) {
        if (typeof window.isSafeImageSource === 'function') return window.isSafeImageSource(value);
        const image = String(value || '').trim();
        return image.startsWith('data:image/') || /^https?:\/\//i.test(image);
    },

    toSafeCssUrl(value) {
        return String(value || '').replace(/["'()\\\r\n]/g, '');
    },

    setAvatar(elementId, customer) {
        const avatar = document.getElementById(elementId);
        if (!avatar) return;

        const fallback = (customer?.name || 'U').charAt(0).toUpperCase();
        const image = customer?.profileImage || '';
        if (this.isSafeImage(image)) {
            avatar.textContent = '';
            avatar.style.backgroundImage = `url("${this.toSafeCssUrl(image)}")`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.style.backgroundColor = 'transparent';
            return;
        }

        avatar.style.backgroundImage = 'none';
        avatar.style.backgroundColor = '';
        avatar.textContent = fallback;
    },

    renderImagePreview(containerId, imageData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!imageData || !this.isSafeImage(imageData)) {
            container.innerHTML = '<div class="profile-image-placeholder">No image selected</div>';
            return;
        }

        container.innerHTML = `<img src="${this.escape(imageData)}" alt="Profile image preview">`;
    },

    async readImageAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Could not read image'));
            reader.readAsDataURL(file);
        });
    },

    async handleImageSelection(file, targetField, previewId) {
        if (!file) {
            this[targetField] = '';
            this.renderImagePreview(previewId, '');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showNotification('Please choose an image file', 'error');
            return;
        }

        const dataUrl = await this.readImageAsDataUrl(file);
        this[targetField] = dataUrl;
        this.renderImagePreview(previewId, dataUrl);
    },

    async previewRegisterImage(event) {
        try {
            await this.handleImageSelection(event.target.files[0], 'registerProfileImage', 'registerProfilePreview');
        } catch (error) {
            showNotification(error.message || 'Failed to load image', 'error');
        }
    },

    async previewEditProfileImage(event) {
        try {
            await this.handleImageSelection(event.target.files[0], 'editProfileImage', 'editProfilePreview');
        } catch (error) {
            showNotification(error.message || 'Failed to load image', 'error');
        }
    },

    clearEditProfileImage() {
        this.editProfileImage = '';
        const input = document.getElementById('editProfileImage');
        if (input) input.value = '';
        this.renderImagePreview('editProfilePreview', '');
    },

    showLoginModal() {
        document.getElementById('authModal').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    },

    showRegisterModal() {
        document.getElementById('authModal').classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.renderImagePreview('registerProfilePreview', this.registerProfileImage);
    },

    switchToLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    },

    switchToRegister() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.renderImagePreview('registerProfilePreview', this.registerProfileImage);
    },

    closeAuthModal() {
        document.getElementById('authModal').classList.remove('active');
        this.clearForms();
    },

    clearForms() {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPhone').value = '';
        document.getElementById('registerLocation').value = '';
        document.getElementById('registerPan').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';

        const registerImageInput = document.getElementById('registerProfileImage');
        if (registerImageInput) registerImageInput.value = '';
        this.registerProfileImage = '';
        this.renderImagePreview('registerProfilePreview', '');
    },

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.querySelector('#loginForm .auth-submit-btn');

        if (!email || !password) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            const result = await StorageManager.loginCustomer(email, password);
            if (!result.success) {
                showNotification(result.message || result.error, 'error');
                return;
            }
            showNotification(`Welcome back, ${result.customer.name}!`, 'success');
            this.closeAuthModal();
            this.updateUIForLoggedInUser(result.customer);
        } catch (error) {
            showNotification('Login failed: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    },

    async register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const location = document.getElementById('registerLocation').value.trim();
        const pan = document.getElementById('registerPan').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const submitBtn = document.querySelector('#registerForm .auth-submit-btn');

        if (!name || !email || !phone || !location || !password || !confirmPassword) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        if (!document.getElementById('acceptTerms').checked) {
            showNotification('Please accept the Terms of Service', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
            const result = await StorageManager.registerCustomer({
                name,
                email,
                phone,
                location,
                pan,
                password,
                profileImage: this.registerProfileImage || ''
            });

            if (!result.success) {
                showNotification(result.message || result.error, 'error');
                return;
            }

            showNotification('Registration successful!', 'success');
            this.updateUIForLoggedInUser(result.customer);
            this.closeAuthModal();
        } catch (error) {
            showNotification('Registration failed: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    },

    logout() {
        if (!confirm('Are you sure you want to logout?')) return;
        StorageManager.logoutCustomer();
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('current_user');
        sessionStorage.removeItem('current_user_id');
        this.currentUser = null;
        showNotification('Logged out successfully', 'success');
        this.updateUIForLoggedOutUser();
        this.closeDashboard();
    },

    updateUIForLoggedInUser(customer) {
        this.currentUser = customer;
        document.getElementById('guestControls').style.display = 'none';
        document.getElementById('userControls').style.display = 'flex';
        document.getElementById('userName').textContent = (customer.name || 'User').split(' ')[0];

        this.setAvatar('userAvatar', customer);

        document.getElementById('customerName').value = customer.name || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerLocation').value = customer.location || '';
        document.getElementById('customerPan').value = customer.pan || '';
    },

    updateUIForLoggedOutUser() {
        document.getElementById('guestControls').style.display = 'flex';
        document.getElementById('userControls').style.display = 'none';
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerLocation').value = '';
        document.getElementById('customerPan').value = '';

        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.style.backgroundImage = 'none';
            userAvatar.textContent = 'U';
        }
    },

    async showDashboard() {
        const customer = await StorageManager.getCurrentUser();
        if (!customer) {
            showNotification('Please login first', 'error');
            return;
        }
        document.getElementById('customerDashboard').classList.add('active');
        await this.loadDashboardData();
    },

    closeDashboard() {
        document.getElementById('customerDashboard').classList.remove('active');
    },

    async loadDashboardData() {
        const customer = await StorageManager.getCurrentUser();
        if (!customer) return;

        const stats = await StorageManager.getCustomerStats(customer.customerId);
        const orders = await StorageManager.getOrdersByCustomer(customer.customerId);

        document.getElementById('dashboardCustomerName').textContent = customer.name || '-';
        document.getElementById('dashboardCustomerEmail').textContent = customer.email || '-';
        document.getElementById('dashboardCustomerPhone').textContent = customer.phone || '-';
        document.getElementById('dashboardCustomerLocation').textContent = customer.location || '-';
        document.getElementById('dashboardCustomerPan').textContent = customer.pan || 'N/A';
        document.getElementById('dashboardTotalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('dashboardTotalSpent').textContent = this.formatAmount(stats.totalSpent || 0);
        document.getElementById('dashboardAvgOrder').textContent = this.formatAmount(Math.round(stats.averageOrderValue || 0));
        this.setAvatar('dashboardCustomerAvatar', customer);

        const ordersContainer = document.getElementById('dashboardOrders');
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = '<p class="empty-state">No orders yet</p>';
            return;
        }

        ordersContainer.innerHTML = orders.slice(-10).reverse().map(order => {
            const safeOrderId = this.escape(order.id || '');
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            const itemsHtml = (order.items || []).map(item => {
                const itemName = this.escape(item.name || 'Item');
                const price = this.formatAmount(item.price || 0);
                let itemImage = '<div style="width:30px;height:30px;background:#f5f5f5;border-radius:3px;margin-right:8px;display:inline-block;vertical-align:middle;"></div>';
                if (item.image && this.isSafeImage(item.image)) {
                    itemImage = `<img src="${this.escape(item.image)}" alt="${itemName}" style="width:30px;height:30px;object-fit:cover;border-radius:3px;margin-right:8px;vertical-align:middle;">`;
                }
                return `<div class="order-item"><span>${itemImage}${itemName}</span><span>${price}</span></div>`;
            }).join('');
            return `<div class="dashboard-order-card"><div class="order-header"><span class="order-id">Order #${safeOrderId}</span><span class="order-date">${orderDate}</span></div><div class="order-items">${itemsHtml}</div><div class="order-total"><strong>Total:</strong><strong>${this.formatAmount(parseFloat(order.total || 0))}</strong></div></div>`;
        }).join('');
    },

    async showEditProfile() {
        const customer = await StorageManager.getCurrentUser();
        if (!customer) return;

        document.getElementById('editProfileName').value = customer.name || '';
        document.getElementById('editProfilePhone').value = customer.phone || '';
        document.getElementById('editProfileLocation').value = customer.location || '';
        document.getElementById('editProfilePan').value = customer.pan || '';
        document.getElementById('editProfileImage').value = '';
        this.editProfileImage = customer.profileImage || '';
        this.renderImagePreview('editProfilePreview', this.editProfileImage);
        document.getElementById('editProfileModal').classList.add('active');
    },

    closeEditProfile() {
        document.getElementById('editProfileModal').classList.remove('active');
    },

    async saveProfile() {
        const customer = await StorageManager.getCurrentUser();
        if (!customer) return;

        const updates = {
            name: document.getElementById('editProfileName').value.trim(),
            phone: document.getElementById('editProfilePhone').value.trim(),
            location: document.getElementById('editProfileLocation').value.trim(),
            pan: document.getElementById('editProfilePan').value.trim(),
            profileImage: this.editProfileImage || ''
        };

        if (!updates.name || !updates.phone || !updates.location) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        const result = await StorageManager.updateCustomerProfile(customer.customerId, updates);
        if (!result.success) {
            showNotification(result.message || 'Failed', 'error');
            return;
        }

        showNotification('Profile updated successfully!', 'success');
        this.closeEditProfile();
        const updatedCustomer = await StorageManager.getCurrentUser();
        this.updateUIForLoggedInUser(updatedCustomer);
        await this.loadDashboardData();
    },

    showChangePassword() {
        document.getElementById('changePasswordModal').classList.add('active');
    },

    closeChangePassword() {
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    },

    async changePassword() {
        const customer = await StorageManager.getCurrentUser();
        if (!customer) return;

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        const result = await StorageManager.changePassword(customer.customerId, oldPassword, newPassword);
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            this.closeChangePassword();
        } else {
            showNotification(result.message || 'Failed', 'error');
        }
    },

    checkPasswordStrength(password) {
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const strengthDiv = document.getElementById('passwordStrength');

        if (password.length > 0) strengthDiv.classList.add('active');
        else {
            strengthDiv.classList.remove('active');
            return;
        }

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { label: '', width: '0%' },
            { label: 'Weak', width: '25%' },
            { label: 'Fair', width: '50%' },
            { label: 'Good', width: '75%' },
            { label: 'Strong', width: '90%' },
            { label: 'Very Strong', width: '100%' }
        ];
        const level = levels[Math.min(score, 5)];
        strengthFill.style.width = level.width;
        strengthFill.style.background = score <= 1 ? '#ef4444' : score <= 3 ? '#f59e0b' : '#10b981';
        strengthText.textContent = level.label;
        strengthText.style.color = score <= 1 ? '#ef4444' : score <= 3 ? '#f59e0b' : '#10b981';
        strengthFill.className = 'strength-fill ' + (score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong');
    },

    async checkAuthStatus() {
        if (!StorageManager.isCustomerLoggedIn()) {
            this.updateUIForLoggedOutUser();
            return;
        }

        const customer = await StorageManager.getCurrentUser();
        if (!customer) {
            StorageManager.logoutCustomer();
            this.updateUIForLoggedOutUser();
            return;
        }

        this.currentUser = customer;
        this.updateUIForLoggedInUser(customer);
    }
};

window.CustomerAuth = CustomerAuth;
