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

const SUPABASE_URL = 'https://ljlicipifdiirstjbgmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbGljaXBpZmRpaXJzdGpiZ21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzExOTQsImV4cCI6MjA5NDAwNzE5NH0.PAFYYAXbc8SsvUooHkAnCVIPiRpz3GTI4LeYS0ZKGiQ';
const SUPABASE_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

let contentBlocks = {};

async function fetchData() {
    try {
        const [productsRes, blogRes, configRes, contentRes] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/blog`),
            fetch(`${API_URL}/config`),
            fetch(`${API_URL}/content-blocks`)
        ]);
        products = await productsRes.json();
        blogPosts = await blogRes.json();
        config = await configRes.json();
        contentBlocks = await contentRes.json();
        applyContentBlocks();
        
        if (config.paypalEmail) paypalEmail = config.paypalEmail;
        if (config.bizumPhone) bizumPhone = config.bizumPhone;
        if (config.bankAccount) bankAccount = config.bankAccount;
        if (config.emailJS) emailJSConfig = config.emailJS;
        if (config.stripePublishableKey) stripePublishableKey = config.stripePublishableKey;
        document.getElementById('bizumPhone').textContent = bizumPhone;
        document.getElementById('contactEmail').textContent = paypalEmail;
        
        // Show/hide Bizum based on admin config
        const bizumVisible = config.bizumVisible === true;
        document.getElementById('bizumCard')?.style.setProperty('display', bizumVisible ? '' : 'none');
        document.getElementById('bizumBtn')?.style.setProperty('display', bizumVisible ? '' : 'none');
        
        // Show/hide Tienda based on admin config
        const tiendaVisible = config.tiendaVisible === true;
        const tiendaDisplay = tiendaVisible ? '' : 'none';
        document.getElementById('navTienda')?.style.setProperty('display', tiendaDisplay);
        document.getElementById('footerNavTienda')?.style.setProperty('display', tiendaDisplay);
        document.getElementById('heroTiendaBtn')?.style.setProperty('display', tiendaDisplay);
        document.getElementById('tienda')?.style.setProperty('display', tiendaDisplay);
        document.getElementById('cartBtn')?.style.setProperty('display', tiendaDisplay);
        if (!tiendaVisible) closeCart();
        
        if (emailJSConfig.publicKey) {
            emailjs.init(emailJSConfig.publicKey);
        }
        
        updateUserUI();
        
        if (config.stats) {
            document.querySelectorAll('#statsGrid .stat-item').forEach((item, index) => {
                const counts = [config.stats.families, config.stats.euros, config.stats.events, config.stats.volunteers || 0];
                item.querySelector('.stat-number').dataset.count = counts[index];
            });
        }

        // Page views from config response (single source of truth)
        const pageViews = config.pageViews || 0;
        sessionStorage.setItem('pageViews', pageViews);
        const visitEl = document.getElementById('visitCount');
        if (visitEl) visitEl.textContent = pageViews.toLocaleString('es-ES');
        
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

function applyContentBlocks() {
    if (!contentBlocks || Object.keys(contentBlocks).length === 0) return;
    const map = {
        hero_title: '#inicio h1',
        hero_tagline: '#inicio .tagline',
        hero_text: '#inicio .hero-text',
        quienes_somos_titulo: '#sobre-nosotros .section-title',
        quienes_somos_p1: '#sobre-nosotros .about-content > p:nth-child(1)',
        quienes_somos_p2: '#sobre-nosotros .about-content > p:nth-child(2)',
        que_es_ela_titulo: '#ela .section-title',
        que_es_ela_texto: '#ela .ela-text',
        que_es_ela_lista: '#ela .ela-list',
        tienda_titulo: '#tienda .section-title',
        tienda_subtitulo: '#tienda .section-subtitle',
        donar_titulo: '#donar .section-title',
        donar_subtitulo: '#donar .section-subtitle',
        contacto_titulo: '#contacto .section-title',
        blog_titulo: '#blog .section-title',
        blog_subtitulo: '#blog .section-subtitle'
    };
    for (const [key, selector] of Object.entries(map)) {
        if (contentBlocks[key]) {
            const el = document.querySelector(selector);
            if (el) {
                el.innerHTML = contentBlocks[key];
            }
        }
    }
    // Apply ELA facts
    for (let i = 1; i <= 3; i++) {
        const key = 'ela_fact_' + i;
        if (contentBlocks[key]) {
            try {
                const fact = JSON.parse(contentBlocks[key]);
                const cards = document.querySelectorAll('#ela .fact-card');
                if (cards[i-1]) {
                    cards[i-1].querySelector('.fact-number').textContent = fact.number;
                    cards[i-1].querySelector('.fact-label').textContent = fact.label;
                }
            } catch(e) {}
        }
    }
    // Apply contact info
    if (contentBlocks.contacto_direccion) {
        document.querySelector('#contacto .contact-item:nth-child(1) p').innerHTML = contentBlocks.contacto_direccion;
    }
    if (contentBlocks.contacto_telefono) {
        document.querySelector('#contacto .contact-item:nth-child(2) p').innerHTML = contentBlocks.contacto_telefono;
    }
    // Contact & social visibility toggles
    document.getElementById('contactAddress')?.style.setProperty('display', contentBlocks.contact_address_visible === 'true' ? '' : 'none');
    document.getElementById('contactPhone')?.style.setProperty('display', contentBlocks.contact_phone_visible === 'true' ? '' : 'none');
    document.getElementById('contactEmailItem')?.style.setProperty('display', contentBlocks.contact_email_visible === 'true' ? '' : 'none');
    document.getElementById('contactSocial')?.style.setProperty('display', contentBlocks.social_visible === 'true' ? '' : 'none');
    if (contentBlocks.contacto_email_valor) {
        document.querySelector('#contacto .contact-item:nth-child(3) p').innerHTML = contentBlocks.contacto_email_valor;
        document.getElementById('contactEmail').innerHTML = contentBlocks.contacto_email_valor;
    }
    // Apply donar/colaborador content
    if (contentBlocks.donar_impacto_5) {
        document.getElementById('donationMessage').innerHTML = '<i class="fas fa-info-circle"></i> ' + contentBlocks.donar_impacto_5;
    }
    if (contentBlocks.colaborador_titulo) {
        const el = document.querySelector('.donation-card.featured h3');
        if (el) el.innerHTML = contentBlocks.colaborador_titulo;
    }
    if (contentBlocks.colaborador_texto) {
        const el = document.querySelector('.donation-card.featured > p');
        if (el) el.innerHTML = contentBlocks.colaborador_texto;
    }
    if (contentBlocks.colaborador_impacto) {
        const el = document.querySelector('.donation-card.featured .donation-impact');
        if (el) el.innerHTML = '<i class="fas fa-info-circle"></i> ' + contentBlocks.colaborador_impacto;
    }
    // Social links
    const socialMap = [
        { key: 'facebook_url', icon: 'fa-facebook-f' },
        { key: 'twitter_url', icon: 'fa-twitter' },
        { key: 'instagram_url', icon: 'fa-instagram' },
        { key: 'youtube_url', icon: 'fa-youtube' }
    ];
    const socialLinks = document.querySelectorAll('.social-links .social-link');
    socialLinks.forEach((a, i) => {
        const block = socialMap[i];
        if (block && contentBlocks[block.key] && contentBlocks[block.key] !== '#') {
            a.href = contentBlocks[block.key];
        }
    });

    // Apply header background
    const hero = document.querySelector('.hero');
    if (hero) {
        if (contentBlocks.header_bg && contentBlocks.header_bg.startsWith('data:')) {
            hero.style.background = 'linear-gradient(rgba(27,46,110,0.7), rgba(0,217,245,0.3)), url(' + contentBlocks.header_bg + ') center/cover no-repeat';
        } else {
            hero.style.background = '';
        }
    }

    // Apply palette colors
    if (contentBlocks.palette) {
        try {
            const p = JSON.parse(contentBlocks.palette);
            const root = document.documentElement;
            if (p.primary) root.style.setProperty('--primary', p.primary);
            if (p.primaryDark) root.style.setProperty('--primary-dark', p.primaryDark);
            if (p.secondary) root.style.setProperty('--secondary', p.secondary);
            if (p.accent) root.style.setProperty('--accent', p.accent);
            if (p.dark) root.style.setProperty('--dark', p.dark);
        } catch(e) {}
    }

}

document.addEventListener('DOMContentLoaded', () => {
    // Show cached page views immediately (from sessionStorage)
    const cached = sessionStorage.getItem('pageViews');
    if (cached) {
        const el = document.getElementById('visitCount');
        if (el) el.textContent = parseInt(cached).toLocaleString('es-ES');
    }
    fetchData();
    fetchCounts();
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

function closeCart() {
    const el = document.getElementById('cartModal');
    el.classList.remove('active');
    el.classList.remove('closing');
}

document.getElementById('cartClose').addEventListener('click', closeCart);

document.getElementById('cartModal').addEventListener('click', (e) => {
    if (e.target.id === 'cartModal') closeCart();
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
    closeCart();
    showModal('emailModal');
}

function handleTransfer() {
    if (cart.length === 0) return;
    document.getElementById('transferAmount').textContent = getCartTotal().toFixed(2) + '€';
    document.getElementById('transferHolder').textContent = bankAccount.holder;
    document.getElementById('transferIban').textContent = bankAccount.iban;
    document.getElementById('transferRef').textContent = 'Tienda-' + Date.now().toString().slice(-8);
    closeCart();
    showModal('transferModal');
}

function handleBizum() {
    if (cart.length === 0) return;
    const total = getCartTotal();
    alert(`Para pagar con Bizum:\n\n1. Abre tu app de banco\n2. Envía ${total.toFixed(2)}€ al número: ${bizumPhone}\n3. Indica "Tienda Solidaria" en el concepto\n\nRecibirás un email de confirmación.`);
    currentOrder = createCurrentOrder('bizum');
    saveOrder(currentOrder);
    closeCart();
    showModal('emailModal');
}

function handleCard() {
    if (cart.length === 0) return;
    if (!stripePublishableKey) {
        alert('El pago con tarjeta no está configurado. Contacta con el administrador.');
        return;
    }
    document.getElementById('cardTotal').textContent = getCartTotal().toFixed(2) + '€';
    closeCart();
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
                subject: 'NCCH: Confirmación de pedido',
                from_name: 'Neuronas con Chispa',
                reply_to: 'neuronasconchispa@gmail.com',
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
    document.getElementById(modalId)?.classList.remove('active');
    const video = document.getElementById('donationVideo');
    if (video) { video.pause(); video.currentTime = 0; }
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

const donationMessages = {
    5: '5€ = Ayudas a mantener nuestra web y redes sociales',
    10: '10€ = Contribuyes a material de difusión e información',
    15: '15€ = Ayudas a organizar eventos de concienciación',
    25: '25€ = 1 hora de cuidador especializado',
    50: '50€ = Sesión de logopedia o fisioterapia para un paciente'
};

function handleDonation(amount) {
    const customInput = document.getElementById('customDonation');
    const customAmount = customInput ? parseFloat(customInput.value) : 0;
    const finalAmount = customAmount > 0 ? customAmount : amount;
    showThankYouModal('donation');
}

function showThankYouModal(type) {
    const titleEl = document.getElementById('thankYouTitle');
    const subtextEl = document.getElementById('thankYouSubtext');
    const bankInfoEl = document.getElementById('thankYouBankInfo');
    if (type === 'colaborador') {
        if (titleEl) titleEl.textContent = '¡Gracias por hacerte colaborador!';
        if (subtextEl) subtextEl.textContent = 'Tu apoyo mensual de 5€ nos ayuda a seguir investigando la ELA. Bienvenido a la familia.';
        if (bankInfoEl) bankInfoEl.style.display = 'none';
    } else {
        const holderEl = document.getElementById('donationBankHolder');
        const ibanEl = document.getElementById('donationBankIban');
        if (holderEl) holderEl.textContent = bankAccount.holder;
        if (ibanEl) ibanEl.textContent = bankAccount.iban;
        if (titleEl) titleEl.textContent = '¡Gracias por tu donación!';
        if (subtextEl) subtextEl.textContent = 'Tu generosidad hace posible que sigamos luchando contra la ELA.';
        if (bankInfoEl) bankInfoEl.style.display = '';
    }
    const video = document.getElementById('donationVideo');
    if (video) { video.currentTime = 0; video.play(); }
    showModal('donationModal');
}

function closeDonationModal() {
    const video = document.getElementById('donationVideo');
    if (video) { video.pause(); video.currentTime = 0; }
    closeModal('donationModal');
}

document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        const amount = this.dataset.amount;
        const messageEl = document.getElementById('donationMessage');
        if (messageEl && donationMessages[amount]) {
            messageEl.innerHTML = `<i class="fas fa-info-circle"></i> ${donationMessages[amount]}`;
        }
        const btnWhite = this.closest('.donation-card').querySelector('.btn-white');
        btnWhite.onclick = () => { handleDonation(parseInt(amount)); return false; };
        btnWhite.innerHTML = `Donar ${amount}€`;
    });
});

document.getElementById('customDonation')?.addEventListener('input', function() {
    const amount = parseFloat(this.value);
    const btnWhite = this.closest('.donation-card').querySelector('.btn-white');
    const messageEl = document.getElementById('donationMessage');
    if (amount > 0) {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        btnWhite.onclick = () => { handleDonation(amount); return false; };
        btnWhite.innerHTML = `Donar ${amount}€`;
        if (messageEl) messageEl.innerHTML = `<i class="fas fa-info-circle"></i> Tu aportación cuenta, ¡gracias!`;
    } else {
        const defaultAmount = document.querySelector('.amount-btn.selected')?.dataset.amount || 5;
        btnWhite.onclick = () => { handleDonation(parseInt(defaultAmount)); return false; };
        btnWhite.innerHTML = `Donar ${defaultAmount}€`;
        if (messageEl && donationMessages[defaultAmount]) {
            messageEl.innerHTML = `<i class="fas fa-info-circle"></i> ${donationMessages[defaultAmount]}`;
        }
    }
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
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Consulta - ' + (data.subject || 'Sin asunto'),
                        from_name: 'Neuronas con Chispa',
                        reply_to: data.email || 'neuronasconchispa@gmail.com',
                        to_email: 'neuronasconchispa@gmail.com',
                        message: `Consulta de contacto:\n\nNombre: ${data.name || 'No especificado'}\nEmail: ${data.email || 'No especificado'}\nAsunto: ${data.subject || 'No especificado'}\nMensaje: ${data.message || 'No especificado'}`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
            
            alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
            contactForm.reset();
        });
    }
    document.getElementById('newsletterForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = this.querySelector('input').value;
        try {
            await fetch(`${API_URL}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Nuevo suscriptor boletín',
                        from_name: 'Neuronas con Chispa',
                        reply_to: email,
                        to_email: 'neuronasconchispa@gmail.com',
                        message: `Nuevo suscriptor al boletín:\n\nEmail: ${email}`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
        } catch (err) {
            console.error('Subscribe error:', err);
        }
        alert(`¡Gracias por suscribirte con ${email}! Recibirás nuestras novedades pronto.`);
        this.reset();
    });
}

function renderBlog() {
    const grid = document.getElementById('blogGrid');
    blogPosts.sort((a, b) => (a.id || 0) - (b.id || 0));
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
    
    html += `<div class="blog-carousel">
        <button class="blog-carousel-btn prev" onclick="scrollBlogCarousel(-1)" id="blogCarouselPrev" disabled><i class="fas fa-chevron-left"></i></button>
        <div class="blog-carousel-inner" id="blogCarouselInner">`;
    
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
    
    html += `</div>
        <button class="blog-carousel-btn next" onclick="scrollBlogCarousel(1)" id="blogCarouselNext"><i class="fas fa-chevron-right"></i></button>
    </div>`;
    
    grid.innerHTML = html;
    const inner = document.getElementById('blogCarouselInner');
    if (inner) {
        inner.addEventListener('scroll', () => updateCarouselButtons(inner));
        setTimeout(() => updateCarouselButtons(inner), 100);
    }
}

function scrollBlogCarousel(direction) {
    const inner = document.getElementById('blogCarouselInner');
    if (!inner) return;
    const card = inner.querySelector('.blog-card');
    const scrollAmount = card ? card.offsetWidth + 30 : 380;
    inner.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    setTimeout(() => updateCarouselButtons(inner), 400);
}

function updateCarouselButtons(inner) {
    const prev = document.getElementById('blogCarouselPrev');
    const next = document.getElementById('blogCarouselNext');
    if (!inner || !prev || !next) return;
    prev.disabled = inner.scrollLeft <= 5;
    next.disabled = inner.scrollLeft + inner.clientWidth >= inner.scrollWidth - 5;
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
    
    const url = encodeURIComponent(window.location.origin + '/#blog');
    const text = encodeURIComponent(post.title);
    document.querySelector('.share-btn.facebook').href = `https://www.facebook.com/sharer.php?u=${url}`;
    document.querySelector('.share-btn.twitter').href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    document.querySelector('.share-btn.whatsapp').href = `https://wa.me/?text=${text}%20${url}`;
    
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
        showUserDashboard();
    } else {
        showModal('authModal');
    }
});

function showAuthTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    if (tab === 'login') {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerPhone').value = '';
        document.getElementById('registerColaborador').checked = false;
        document.getElementById('registerIban').value = '';
        document.getElementById('ibanGroup').style.display = 'none';
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/user-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            const safeUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, phone: currentUser.phone, role: currentUser.role, isAdmin: currentUser.isAdmin, createdAt: currentUser.createdAt };
            localStorage.setItem('elaUser', JSON.stringify(safeUser));
            if (data.token) localStorage.setItem('adminToken', data.token);
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

function showForgotPassword() {
    closeModal('authModal');
    document.getElementById('forgotSent').style.display = 'none';
    document.getElementById('forgotEmail').value = '';
    showModal('forgotPasswordModal');
}

async function handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value;
    if (!email) return alert('Introduce tu email');
    
    try {
        const res = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (data.token && emailJSConfig.serviceId && emailJSConfig.templateId) {
            try {
                await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                    subject: 'NCCH: Código de recuperación de contraseña',
                    from_name: 'Neuronas con Chispa',
                    reply_to: 'neuronasconchispa@gmail.com',
                    to_email: email,
                    message: `Tu código de recuperación es: ${data.token}\n\nEste código expira en 1 hora.\n\nSi no has solicitado este cambio, ignora este mensaje.\n\nUn saludo,\nEl equipo de Neuronas con Chispa`
                });
            } catch (err) {
                console.error('EmailJS error:', err);
            }
        }
        
        document.getElementById('forgotSent').style.display = 'block';
        document.getElementById('forgotEmail').value = '';
        document.getElementById('resetEmail').value = email;
        setTimeout(() => {
            closeModal('forgotPasswordModal');
            document.getElementById('resetToken').value = '';
            document.getElementById('resetPassword').value = '';
            if (data.token) showModal('resetPasswordModal');
        }, 2000);
    } catch (err) {
        console.error('Forgot password error:', err);
        alert('Error al conectar con el servidor');
    }
}

async function handleResetPassword() {
    const email = document.getElementById('resetEmail').value;
    const token = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('resetPassword').value;
    
    if (!token || !newPassword) return alert('Completa todos los campos');
    if (newPassword.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    
    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, newPassword })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
            closeModal('resetPasswordModal');
        } else {
            alert(data.error || 'Error al restablecer la contraseña');
        }
    } catch (err) {
        console.error('Reset password error:', err);
        alert('Error al conectar con el servidor');
    }
}

function toggleIbanField() {
    document.getElementById('ibanGroup').style.display = 
        document.getElementById('registerColaborador').checked ? 'block' : 'none';
}

// --- IBAN validation ---
function isValidIBAN(iban) {
    if (!iban) return false;
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length !== 24 || !cleaned.startsWith('ES')) return false;
    const reordered = cleaned.slice(4) + cleaned.slice(0, 4);
    const numeric = reordered.split('').map(c => {
        const code = c.charCodeAt(0);
        return code >= 65 ? code - 55 : c;
    }).join('');
    let remainder = 0;
    for (let i = 0; i < numeric.length; i++) {
        remainder = (remainder * 10 + parseInt(numeric[i])) % 97;
    }
    return remainder === 1;
}

async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;
    const isColaborador = document.getElementById('registerColaborador').checked;
    const iban = document.getElementById('registerIban').value;
    
    if (!name || !email || !password) {
        alert('Por favor, completa los campos obligatorios');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (isColaborador && !iban) {
        alert('Introduce tu IBAN para ser colaborador mensual');
        return;
    }
    
    if (isColaborador && !isValidIBAN(iban)) {
        alert('El IBAN introducido no es válido. Comprueba que está correcto (debe empezar por ES y tener 24 caracteres).');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, isColaborador, iban })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            const safeUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, phone: currentUser.phone, role: currentUser.role, createdAt: currentUser.createdAt };
            localStorage.setItem('elaUser', JSON.stringify(safeUser));
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerPhone').value = '';
            document.getElementById('registerColaborador').checked = false;
            document.getElementById('registerIban').value = '';
            document.getElementById('ibanGroup').style.display = 'none';
            closeModal('authModal');
            updateUserUI();
            if (isColaborador) {
                setTimeout(() => showThankYouModal('colaborador'), 300);
            }
            showNotification('Cuenta creada. ¡Bienvenido, ' + currentUser.name + '!');
            
            // Send welcome email to user
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Bienvenido a Neuronas con Chispa',
                        from_name: 'Neuronas con Chispa',
                        reply_to: 'neuronasconchispa@gmail.com',
                        to_email: email,
                        to_name: name,
                        message: `Hola ${name},\n\nGracias por registrarte en Neuronas con Chispa.\n\nTu cuenta ha sido creada correctamente. Ya puedes iniciar sesión con tu email y contraseña.\n\n${isColaborador ? 'Te damos la bienvenida como colaborador mensual. Tu apoyo de 5€/mes nos ayuda a seguir investigando la ELA.\n\n' : ''}Juntos podemos hacer la diferencia.\n\nUn saludo,\nEl equipo de Neuronas con Chispa`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
            
            // Notify admin if collaborator registered
            if (isColaborador && emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Nuevo colaborador',
                        from_name: 'Neuronas con Chispa',
                        to_email: 'neuronasconchispa@gmail.com',
                        message: `Nuevo colaborador mensual:\n\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${phone || 'No especificado'}\nIBAN: ${iban}\nCuota: 5€/mes`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
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
            <a href="#" class="user-logged" onclick="showUserDashboard(); return false;">
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

function maskIban(iban) {
    if (!iban || iban.length < 8) return iban || 'No especificado';
    return iban.slice(0, 4) + ' **** **** **** ' + iban.slice(-4);
}

function getMemberDuration(createdAt) {
    if (!createdAt) return '';
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    if (months > 0) {
        return `${months} mes${months !== 1 ? 'es' : ''}${days > 0 ? ` y ${days} día${days !== 1 ? 's' : ''}` : ''}`;
    }
    return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
}

async function upgradeToColaborador() {
    const iban = document.getElementById('upgradeIban')?.value;
    if (!iban) {
        alert('Por favor, introduce tu IBAN');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iban })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            const safeUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, phone: currentUser.phone, role: currentUser.role, createdAt: currentUser.createdAt };
            localStorage.setItem('elaUser', JSON.stringify(safeUser));
            
            // Send confirmation email to user
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Bienvenido como colaborador',
                        from_name: 'Neuronas con Chispa',
                        reply_to: 'neuronasconchispa@gmail.com',
                        to_email: currentUser.email,
                        to_name: currentUser.name,
                        message: `Hola ${currentUser.name},\n\n¡Gracias por hacerte colaborador mensual de Neuronas con Chispa!\n\nTu contribución de 5€/mes nos ayuda a seguir investigando la ELA y apoyando a las familias.\n\nIBAN para domiciliación: ${iban}\n\nJuntos podemos hacer la diferencia.\n\nUn saludo,\nEl equipo de Neuronas con Chispa`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
            
            // Notify admin
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Nuevo colaborador (upgrade)',
                        from_name: 'Neuronas con Chispa',
                        to_email: 'neuronasconchispa@gmail.com',
                        message: `Un usuario se ha convertido en colaborador:\n\nNombre: ${currentUser.name}\nEmail: ${currentUser.email}\nTeléfono: ${currentUser.phone || 'No especificado'}\nIBAN: ${iban}\nCuota: 5€/mes`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }
            
            showNotification('¡Bienvenido como colaborador! Gracias por tu apoyo.');
            closeModal('userDashboardModal');
        } else {
            alert(data.error || 'Error al actualizar');
        }
    } catch (err) {
        console.error('Upgrade error:', err);
        alert('Error al conectar con el servidor');
    }
}

async function cancelSubscription() {
    if (!currentUser) return;
    if (!confirm('¿Estás seguro de que quieres anular tu suscripción como colaborador mensual? Este cambio no se puede deshacer automáticamente desde aquí.')) return;
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/cancel-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            const safeUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, phone: currentUser.phone, role: currentUser.role, createdAt: currentUser.createdAt };
            localStorage.setItem('elaUser', JSON.stringify(safeUser));

            // Notify admin
            if (emailJSConfig.serviceId && emailJSConfig.templateId) {
                try {
                    await emailjs.send(emailJSConfig.serviceId, emailJSConfig.templateId, {
                        subject: 'NCCH: Colaborador anula suscripción',
                        from_name: 'Neuronas con Chispa',
                        reply_to: 'neuronasconchispa@gmail.com',
                        to_email: 'neuronasconchispa@gmail.com',
                        message: `Un colaborador ha anulado su suscripción:\n\nNombre: ${currentUser.name}\nEmail: ${currentUser.email}\nTeléfono: ${currentUser.phone || 'No especificado'}`
                    });
                } catch (err) {
                    console.error('EmailJS error:', err);
                }
            }

            showNotification('Tu suscripción ha sido anulada. Seguirás siendo usuario registrado en nuestra web.');
            closeModal('userDashboardModal');
        } else {
            alert(data.error || 'Error al anular la suscripción');
        }
    } catch (err) {
        console.error('Cancel subscription error:', err);
        alert('Error al conectar con el servidor');
    }
}

async function showUserDashboard() {
    if (!currentUser) return;
    
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/orders`);
        const data = await res.json();
        const orders = data.orders || [];
        const userInfo = data.user;
        
        if (!userInfo) {
            alert('No se pudo cargar la información del usuario.');
            return;
        }
        
        const container = document.getElementById('userDashboardContent');
        
        // --- Profile section ---
        let html = `
        <div class="dash-grid">
            <div class="dash-card dash-card-full">
                <div class="dash-card-header">
                    <i class="fas fa-id-card"></i> Mi Perfil
                </div>
                <div class="dash-card-body dash-profile-grid">
                    <div><strong>Nombre:</strong> ${userInfo.name}</div>
                    <div><strong>Email:</strong> ${userInfo.email}</div>
                    <div><strong>Teléfono:</strong> ${userInfo.phone || 'No especificado'}</div>
                    <div><strong>Miembro desde:</strong> ${new Date(userInfo.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div><strong>Tipo de cuenta:</strong> ${userInfo.role === 'colaborador' 
                        ? '<span style="color:var(--success);"><i class="fas fa-hand-holding-heart"></i> Colaborador mensual</span>' 
                        : '<span style="color:var(--primary);"><i class="fas fa-user"></i> Usuario</span>'}</div>
                </div>
            </div>`;
        
        // --- Data & Privacy ---
        html += `
        <div class="dash-card dash-card-full">
            <div class="dash-card-header" style="color:var(--primary);">
                <i class="fas fa-shield-alt"></i> Privacidad y Datos
            </div>
            <div class="dash-card-body">
                <p style="font-size:0.85rem; color:var(--gray); margin-bottom:15px;">Puedes descargar todos tus datos personales o eliminar tu cuenta y todos tus datos asociados.</p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="exportUserData()" style="font-size:0.85rem;">
                        <i class="fas fa-download"></i> Descargar mis datos
                    </button>
                    <button class="btn" style="background:#dc3545; color:white; font-size:0.85rem;" onclick="deleteUserAccount()">
                        <i class="fas fa-trash"></i> Eliminar mi cuenta
                    </button>
                </div>
            </div>
        </div>`;

        // --- Collaborator section / upgrade prompt ---
        if (userInfo.role === 'colaborador') {
            const subs = userInfo.subscriptions || [];
            const lastPayment = subs.length > 0 ? subs[subs.length - 1] : null;
            const duration = getMemberDuration(userInfo.createdAt);
            
            html += `
            <div class="dash-card dash-card-full">
                <div class="dash-card-header" style="color:var(--success);">
                    <i class="fas fa-hand-holding-heart"></i> Colaborador Mensual
                </div>
                <div class="dash-card-body">
                    <div class="dash-collab-stats">
                        <div class="dash-stat-box">
                            <span class="dash-stat-number">5€</span>
                            <span class="dash-stat-label">Cuota mensual</span>
                        </div>
                        <div class="dash-stat-box">
                            <span class="dash-stat-number">${duration || '—'}</span>
                            <span class="dash-stat-label">Como colaborador</span>
                        </div>
                        <div class="dash-stat-box">
                            <span class="dash-stat-number">${subs.length}</span>
                            <span class="dash-stat-label">Pagos realizados</span>
                        </div>
                        <div class="dash-stat-box">
                            <span class="dash-stat-number">${(subs.length * 5).toFixed(0)}€</span>
                            <span class="dash-stat-label">Total aportado</span>
                        </div>
                    </div>
                    
                    <div style="margin-top:15px; padding:12px; background:#f8f9fa; border-radius:8px;">
                        <p style="margin-bottom:5px;"><strong>IBAN:</strong> ${maskIban(userInfo.iban)}</p>
                        <p><strong>Estado:</strong> ${subs.length > 0
                            ? '<span style="color:var(--success);">Al corriente</span> - Último cobro: ' + new Date(lastPayment.date).toLocaleDateString('es-ES')
                            : '<span style="color:var(--warning);">Pendiente de primer cobro</span>'}</p>
                        ${subs.length > 0 ? `<p style="margin-top:5px;"><strong>Próximo cobro estimado:</strong> ${new Date(new Date(lastPayment.date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                        <button class="btn" style="background:#dc3545; color:white; font-size:0.85rem; margin-top:12px;" onclick="cancelSubscription()">
                            <i class="fas fa-ban"></i> Anular suscripción
                        </button>
                    </div>`;
            
            // Payment history
            if (subs.length > 0) {
                html += `
                    <div style="margin-top:15px;">
                        <h4 style="margin-bottom:10px; font-size:0.95rem; color:var(--gray);">Historial de cobros</h4>
                        <div class="dash-payment-list">
                            ${subs.slice().reverse().map(s => `
                                <div class="dash-payment-item">
                                    <span><i class="fas fa-check-circle" style="color:var(--success);"></i> ${new Date(s.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    <span><strong>${s.amount}€</strong></span>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
            }
            
            html += `</div></div>`;
        } else {
            html += `
            <div class="dash-card dash-card-full">
                <div class="dash-card-header" style="color:var(--success);">
                    <i class="fas fa-hand-holding-heart"></i> Hazte Colaborador Mensual
                </div>
                <div class="dash-card-body">
                    <p style="margin-bottom:15px;">Conviértete en colaborador mensual por solo <strong>5€/mes</strong> y ayuda a la investigación de la ELA de forma continua.</p>
                    <div id="upgradeForm">
                        <div class="form-group" style="margin-bottom:12px;">
                            <label>IBAN (para domiciliación mensual)</label>
                            <input type="text" id="upgradeIban" class="dash-input" placeholder="ES00 0000 0000 0000 0000 0000">
                        </div>
                        <button class="btn btn-success" onclick="upgradeToColaborador()">
                            <i class="fas fa-hand-holding-heart"></i> Hacerme colaborador
                        </button>
                    </div>
                </div>
            </div>`;
        }
        
        container.innerHTML = html;
        showModal('userDashboardModal');
    } catch (err) {
        console.error('Error loading dashboard:', err);
        alert('Error cargando tus datos');
    }
}

async function exportUserData() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/export`);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis-datos-neuronas-con-chispa-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Datos descargados correctamente');
    } catch (err) {
        console.error('Export error:', err);
        alert('Error al descargar tus datos');
    }
}

async function deleteUserAccount() {
    if (!currentUser) return;
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y eliminará todos tus datos personales.')) return;
    if (!confirm('Esta acción eliminará permanentemente tu cuenta, tus datos de perfil, historial de pedidos y más. ¿Continuar?')) return;
    try {
        const res = await fetch(`${API_URL}/users/${currentUser.id}/delete-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.removeItem('elaUser');
            localStorage.removeItem('elaCart');
            currentUser = null;
            closeModal('userDashboardModal');
            updateUserUI();
            showNotification('Tu cuenta ha sido eliminada correctamente.');
        } else {
            alert(data.error || 'Error al eliminar la cuenta');
        }
    } catch (err) {
        console.error('Delete account error:', err);
        alert('Error al eliminar la cuenta');
    }
}

document.getElementById('logoLink')?.addEventListener('click', function(e) {
    const video = document.getElementById('donationVideo');
    if (video) { video.pause(); video.currentTime = 0; }
    document.getElementById('donationModal')?.classList.remove('active');
});

// Fetch collaborator count directly from Supabase (bypasses Vercel cold start)
async function fetchCounts() {
    try {
        const collabRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&role=eq.colaborador&head=true`, {
            headers: SUPABASE_HEADERS
        });
        const collabCount = parseInt(collabRes.headers.get('x-total-count') || '0', 10);
        const statsItems = document.querySelectorAll('#statsGrid .stat-item');
        if (statsItems[3]) {
            statsItems[3].querySelector('.stat-number').dataset.count = collabCount;
        }
        if (!sessionStorage.getItem('visitCounted')) {
            sessionStorage.setItem('visitCounted', '1');
            fetch(`${API_URL}/page-views/increment`, { method: 'POST' }).catch(() => {});
        }
    } catch (err) {
        console.error('Counts fetch error:', err);
    }
}

// Cookie consent
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieBanner').style.display = 'none';
}

(function() {
    if (!localStorage.getItem('cookieConsent')) {
        document.getElementById('cookieBanner').style.display = 'block';
    }
})();
