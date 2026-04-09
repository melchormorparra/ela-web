let products = [];
let blogPosts = [];
let config = {};
let cart = JSON.parse(localStorage.getItem('elaCart')) || [];
let paypalEmail = 'info@neuronasconchispa.es';
let bizumPhone = '617 123 456';
let bankAccount = { holder: 'Neuronas con Chispa', iban: 'ES00 0000 0000 0000 0000 0000' };
let currentOrder = null;
let emailJSConfig = { serviceId: '', templateId: '', publicKey: '' };
let stripePublishableKey = '';
let currentUser = JSON.parse(localStorage.getItem('elaUser')) || null;

const API_URL = '/api';

async function fetchData() {
    try {
        const [productsRes, blogRes, configRes] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/blog`),
            fetch(`${API_URL}/config`)
        ]);
        products = await productsRes.json();
        blogPosts = await blogRes.json();
        config = await configRes.json();
        
        if (config.paypalEmail) paypalEmail = config.paypalEmail;
        if (config.bizumPhone) bizumPhone = config.bizumPhone;
        if (config.bankAccount) bankAccount = config.bankAccount;
        if (config.emailJS) emailJSConfig = config.emailJS;
        if (config.stripePublishableKey) stripePublishableKey = config.stripePublishableKey;
        document.getElementById('bizumPhone').textContent = bizumPhone;
        document.getElementById('contactEmail').textContent = paypalEmail;
        
        if (emailJSConfig.publicKey) {
            emailjs.init(emailJSConfig.publicKey);
        }
        
        updateUserUI();
        
        if (config.stats) {
            document.querySelectorAll('#statsGrid .stat-item').forEach((item, index) => {
                const counts = [config.stats.families, config.stats.euros, config.stats.events, config.stats.volunteers];
                item.querySelector('.stat-number').dataset.count = counts[index];
            });
        }
        
        renderProducts();
        renderBlog();
        initAnimations();
        updateCartUI();
    } catch (err) {
        console.error('Error fetching data:', err);
        document.getElementById('productsGrid').innerHTML = '<p style="text-align:center;">Error al cargar productos. Intenta más tarde.</p>';
        document.getElementById('blogGrid').innerHTML = '<p style="text-align:center;">Error al cargar blog. Intenta más tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    initNavigation();
    initForms();
    initBlogFilters();
});

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${parseFloat(product.price).toFixed(2)}€</p>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Añadir al carrito
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${product.name} añadido al carrito`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('elaCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartFooter.style.display = 'none';
        cartItems.innerHTML = '';
    } else {
        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">${parseFloat(item.price).toFixed(2)}€</p>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2) + '€';
    }
}

document.getElementById('cartBtn').addEventListener('click', () => {
    document.getElementById('cartModal').classList.add('active');
});

document.getElementById('cartClose').addEventListener('click', () => {
    document.getElementById('cartModal').classList.remove('active');
});

document.getElementById('cartModal').addEventListener('click', (e) => {
    if (e.target.id === 'cartModal') {
        document.getElementById('cartModal').classList.remove('active');
    }
});

document.getElementById('paypalBtn').addEventListener('click', handlePayPal);
document.getElementById('cardBtn').addEventListener('click', handleCard);
document.getElementById('transferBtn').addEventListener('click', handleTransfer);
document.getElementById('bizumBtn').addEventListener('click', handleBizum);

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
}

function createCurrentOrder(paymentMethod) {
    return {
        items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
        total: getCartTotal(),
        paymentMethod: paymentMethod,
        date: new Date().toISOString(),
        status: 'pending'
    };
}

async function handlePayPal() {
    if (cart.length === 0) return;
    const total = getCartTotal();
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${paypalEmail}&item_name=Compra+Tienda+Solidaria&amount=${total.toFixed(2)}&currency_code=EUR`;
    currentOrder = createCurrentOrder('paypal');
    await saveOrder(currentOrder);
    window.open(paypalUrl, '_blank');
    document.getElementById('cartModal').classList.remove('active');
    showModal('emailModal');
}

function handleCard() {
    if (cart.length === 0) return;
    document.getElementById('cardTotal').textContent = getCartTotal().toFixed(2) + '€';
    document.getElementById('cartModal').classList.remove('active');
    showModal('cardModal');
}

function handleTransfer() {
    if (cart.length === 0) return;
    document.getElementById('transferAmount').textContent = getCartTotal().toFixed(2) + '€';
    document.getElementById('transferHolder').textContent = bankAccount.holder;
    document.getElementById('transferIban').textContent = bankAccount.iban;
    document.getElementById('transferRef').textContent = 'Tienda-' + Date.now().toString().slice(-8);
    document.getElementById('cartModal').classList.remove('active');
    showModal('transferModal');
}

function handleBizum() {
    if (cart.length === 0) return;
    const total = getCartTotal();
    alert(`Para pagar con Bizum:\n\n1. Abre tu app de banco\n2. Envía ${total.toFixed(2)}€ al número: ${bizumPhone}\n3. Indica "Tienda Solidaria" en el concepto\n\nRecibirás un email de confirmación.`);
    currentOrder = createCurrentOrder('bizum');
    saveOrder(currentOrder);
    document.getElementById('cartModal').classList.remove('active');
    showModal('emailModal');
}

function handleCard() {
    if (cart.length === 0) return;
    if (!stripePublishableKey) {
        alert('El pago con tarjeta no está configurado. Contacta con el administrador.');
        return;
    }
    document.getElementById('cardTotal').textContent = getCartTotal().toFixed(2) + '€';
    document.getElementById('cartModal').classList.remove('active');
    showModal('cardModal');
    initStripe();
}

let stripe = null;
let elements = null;
let cardElement = null;

function initStripe() {
    if (!stripePublishableKey) return;
    
    if (!stripe) {
        stripe = Stripe(stripePublishableKey);
        elements = stripe.elements();
    }
    
    const cardMount = document.getElementById('cardElement');
    if (cardMount && !cardMount.hasChildNodes()) {
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    '::placeholder': { color: '#aab7c4' }
                }
            }
        });
        cardElement.mount('#cardElement');
    }
}

document.getElementById('cardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!stripe || !cardElement) {
        alert('Error inicializando Stripe. Recarga la página.');
        return;
    }
    
    const btn = document.getElementById('payCardBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;
    
    try {
        const { clientSecret } = await fetch(`${API_URL}/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(getCartTotal() * 100) })
        }).then(r => r.json());
        
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: document.getElementById('cardName').value
                }
            }
        });
        
        if (error) {
            alert('Error: ' + error.message);
            btn.innerHTML = '<i class="fas fa-lock"></i> Pagar ahora';
            btn.disabled = false;
        } else if (paymentIntent.status === 'succeeded') {
            currentOrder = createCurrentOrder('card');
            currentOrder.paymentIntentId = paymentIntent.id;
            saveOrder(currentOrder);
            document.getElementById('cardForm').reset();
            btn.innerHTML = '<i class="fas fa-lock"></i> Pagar ahora';
            btn.disabled = false;
            closeModal('cardModal');
            showModal('emailModal');
        }
    } catch (err) {
        console.error('Payment error:', err);
        alert('Error procesando el pago. Intenta de nuevo.');
        btn.innerHTML = '<i class="fas fa-lock"></i> Pagar ahora';
        btn.disabled = false;
    }
});

function confirmTransfer() {
    currentOrder = createCurrentOrder('transfer');
    currentOrder.reference = document.getElementById('transferRef').textContent;
    saveOrder(currentOrder);
    closeModal('transferModal');
    showModal('emailModal');
}

async function confirmOrder() {
    const email = currentUser?.email || document.getElementById('customerEmail')?.value;
    if (!email) {
        alert('Por favor, introduce tu email');
        return;
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        alert('Por favor, introduce un email válido');
        return;
    }
    
    currentOrder.customerEmail = email;
    currentOrder.customerName = currentUser?.name || '';
    currentOrder.userId = currentUser?.id || null;
    currentOrder.status = 'confirmed';
    await saveOrder(currentOrder);
    
    if (currentUser) {
        await updateUserOrders(currentUser.id, currentOrder);
    }
    
    if (emailJSConfig.serviceId && emailJSConfig.templateId) {
        try {
            await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                to_email: email,
                to_name: currentUser?.name || currentOrder.items[0]?.name || 'Cliente',
                order_total: currentOrder.total.toFixed(2) + '€',
                order_items: currentOrder.items.map(i => `${i.name} x${i.quantity}`).join(', '),
                payment_method: currentOrder.paymentMethod
            });
        } catch (err) {
            console.error('EmailJS error:', err);
        }
    }
    
    document.getElementById('customerEmail').value = '';
    closeModal('emailModal');
    showModal('successModal');
    cart = [];
    saveCart();
    updateCartUI();
}

async function saveOrder(order) {
    try {
        await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
    } catch (err) {
        console.error('Error saving order:', err);
    }
}

async function updateUserOrders(userId, order) {
    try {
        await fetch(`${API_URL}/users/${userId}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
    } catch (err) {
        console.error('Error updating user orders:', err);
    }
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    notification.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#28a745;color:white;padding:15px 25px;border-radius:8px;display:flex;align-items:center;gap:10px;z-index:4000;animation:slideUp 0.3s ease;';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

const style = document.createElement('style');
style.textContent = '@keyframes slideUp{from{transform:translateX(-50%) translateY(100%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@keyframes slideDown{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(100%);opacity:0}}';
document.head.appendChild(style);

function handleDonation(amount) {
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${paypalEmail}&item_name=Donacion+ELA&amount=${amount}&currency_code=EUR`;
    window.open(paypalUrl, '_blank');
}

document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        const amount = this.dataset.amount;
        const link = this.closest('.donation-card').querySelector('.btn-white');
        link.href = '#';
        link.onclick = () => { handleDonation(amount); return false; };
    });
});

function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navMenu.classList.remove('active'));
    });
}

function initAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target.querySelector('.stat-number'));
                }
            }
        });
    }, observerOptions);
    document.querySelectorAll('.section, .stat-item, .product-card, .fact-card, .feature, .blog-card, .featured-post').forEach(el => {
        el.classList.add('animate-ready');
        observer.observe(el);
    });
    const animStyle = document.createElement('style');
    animStyle.textContent = '.animate-ready{opacity:0;transform:translateY(30px);transition:opacity 0.6s ease,transform 0.6s ease}.animate-in{opacity:1;transform:translateY(0)}';
    document.head.appendChild(animStyle);
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

function initForms() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            console.log('Formulario enviado:', data);
            alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
            contactForm.reset();
        });
    }
    document.getElementById('newsletterForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input').value;
        alert(`¡Gracias por suscribirte con ${email}! Recibirás nuestras novedades pronto.`);
        this.reset();
    });
}

function renderBlog() {
    const grid = document.getElementById('blogGrid');
    let featuredPost = blogPosts.find(post => post.featured);
    let regularPosts = blogPosts.filter(post => !post.featured);
    let html = '';
    
    if (featuredPost) {
        html += `
            <div class="featured-post">
                <div class="featured-post-image"><img src="${featuredPost.image}" alt="${featuredPost.title}"></div>
                <div class="featured-post-content">
                    <span class="featured-badge">Destacado</span>
                    <span class="blog-card-category">${featuredPost.categoryLabel}</span>
                    <h3 class="featured-post-title">${featuredPost.title}</h3>
                    <p class="featured-post-excerpt">${featuredPost.excerpt}</p>
                    <div style="border:none;padding-top:10px;"><span class="blog-card-date"><i class="fas fa-calendar"></i> ${featuredPost.date}</span></div>
                    <button class="btn btn-primary" onclick="openBlogPost(${featuredPost.id})" style="margin-top:15px;">Leer más <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>`;
    }
    
    html += regularPosts.map(post => `
        <div class="blog-card" onclick="openBlogPost(${post.id})">
            <div class="blog-card-image">
                <img src="${post.image}" alt="${post.title}">
                <span class="blog-card-category">${post.categoryLabel}</span>
            </div>
            <div class="blog-card-content">
                <p class="blog-card-date"><i class="fas fa-calendar"></i> ${post.date}</p>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <div class="blog-card-footer">
                    <div class="blog-card-author"><i class="fas fa-user"></i><span>${post.author}</span></div>
                    <span class="blog-card-read">Leer más <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = html;
}

function openBlogPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    document.getElementById('blogModalCategory').textContent = post.categoryLabel;
    document.getElementById('blogModalTitle').textContent = post.title;
    document.getElementById('blogModalDate').textContent = post.date;
    document.getElementById('blogModalAuthor').textContent = post.author;
    document.getElementById('blogModalImage').innerHTML = `<img src="${post.image}" alt="${post.title}">`;
    document.getElementById('blogModalBody').innerHTML = post.content;
    showModal('blogModal');
}

function initBlogFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            renderFilteredBlog(filter);
        });
    });
}

function renderFilteredBlog(filter) {
    const grid = document.getElementById('blogGrid');
    let filteredPosts = filter === 'all' ? blogPosts : blogPosts.filter(p => p.category === filter);
    
    if (filteredPosts.length === 0) {
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--gray);">No hay artículos en esta categoría.</p>';
        return;
    }
    
    let featuredPost = filteredPosts.find(post => post.featured);
    let regularPosts = filteredPosts.filter(post => !post.featured);
    let html = '';
    
    if (featuredPost && filter === 'all') {
        html += `<div class="featured-post"><div class="featured-post-image"><img src="${featuredPost.image}" alt="${featuredPost.title}"></div><div class="featured-post-content"><span class="featured-badge">Destacado</span><span class="blog-card-category">${featuredPost.categoryLabel}</span><h3 class="featured-post-title">${featuredPost.title}</h3><p class="featured-post-excerpt">${featuredPost.excerpt}</p><div style="border:none;padding-top:10px;"><span class="blog-card-date"><i class="fas fa-calendar"></i> ${featuredPost.date}</span></div><button class="btn btn-primary" onclick="openBlogPost(${featuredPost.id})" style="margin-top:15px;">Leer más <i class="fas fa-arrow-right"></i></button></div></div>`;
    }
    
    html += regularPosts.map(post => `<div class="blog-card" onclick="openBlogPost(${post.id})"><div class="blog-card-image"><img src="${post.image}" alt="${post.title}"><span class="blog-card-category">${post.categoryLabel}</span></div><div class="blog-card-content"><p class="blog-card-date"><i class="fas fa-calendar"></i> ${post.date}</p><h3 class="blog-card-title">${post.title}</h3><p class="blog-card-excerpt">${post.excerpt}</p><div class="blog-card-footer"><div class="blog-card-author"><i class="fas fa-user"></i><span>${post.author}</span></div><span class="blog-card-read">Leer más <i class="fas fa-arrow-right"></i></span></div></div></div>`).join('');
    
    grid.innerHTML = html;
}

window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
});

document.getElementById('loginBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        showUserOrders();
    } else {
        showModal('authModal');
    }
});

function showAuthTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('elaUser', JSON.stringify(currentUser));
            closeModal('authModal');
            updateUserUI();
            showNotification('Bienvenido, ' + currentUser.name);
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Error al conectar con el servidor');
    }
}

async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;
    
    if (!name || !email || !password) {
        alert('Por favor, completa los campos obligatorios');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('elaUser', JSON.stringify(currentUser));
            closeModal('authModal');
            updateUserUI();
            showNotification('Cuenta creada. ¡Bienvenido, ' + currentUser.name + '!');
        } else {
            alert(data.error || 'Error al crear la cuenta');
        }
    } catch (err) {
        console.error('Register error:', err);
        alert('Error al conectar con el servidor');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('elaUser');
    updateUserUI();
    showNotification('Sesión cerrada');
}

function updateUserUI() {
    const userMenu = document.getElementById('userMenu');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        userMenu.innerHTML = `
            <a href="#" class="user-logged" onclick="showUserOrders(); return false;">
                <i class="fas fa-user"></i> ${currentUser.name}
            </a>
            <a href="#" onclick="handleLogout(); return false;" style="font-size:0.8rem; color:var(--gray);">
                <i class="fas fa-sign-out-alt"></i> Cerrar sesión
            </a>
        `;
        adminLink.style.display = currentUser.isAdmin ? 'flex' : 'none';
    } else {
        userMenu.innerHTML = `
            <a href="#" id="loginBtn"><i class="fas fa-user"></i> Iniciar sesión</a>
        `;
        adminLink.style.display = 'none';
        document.getElementById('loginBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('authModal');
        });
    }
}

async function showUserOrders() {
    if (!currentUser) return;
    
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/orders`);
        const orders = await res.json();
        
        const list = document.getElementById('userOrdersList');
        
        if (orders.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--gray); padding:40px;">Aún no tienes pedidos.</p>';
        } else {
            list.innerHTML = orders.map(o => `
                <div class="user-orders-item">
                    <div class="order-header">
                        <span>Pedido #${o.id} - ${new Date(o.date).toLocaleDateString('es-ES')}</span>
                        <span>${parseFloat(o.total).toFixed(2)}€</span>
                    </div>
                    <div class="order-items">
                        ${o.items.map(i => `${i.name} x${i.quantity}`).join('<br>')}
                    </div>
                    <div style="margin-top:10px;">
                        <span class="order-status ${o.status}">${o.status === 'confirmed' ? 'Completado' : 'Pendiente'}</span>
                        <span style="margin-left:10px; font-size:0.85rem; color:var(--gray);">
                            <i class="fas fa-credit-card"></i> ${o.paymentMethod}
                        </span>
                    </div>
                </div>
            `).join('');
        }
        
        showModal('userOrdersModal');
    } catch (err) {
        console.error('Error loading orders:', err);
        alert('Error cargando tus pedidos');
    }
}
