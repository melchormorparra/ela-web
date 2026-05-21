const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { getDb } = require('./db');
const { seedData } = require('./seed');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function configToFrontend(row) {
    if (!row) return null;
    return {
        paypalEmail: row.paypal_email,
        bizumPhone: row.bizum_phone,
        bizumVisible: row.bizum_visible,
        tiendaVisible: row.tienda_visible,
        bankAccount: row.bank_account,
        emailJS: row.email_js,
        stripePublishableKey: row.stripe_publishable_key,
        stripeSecretKey: row.stripe_secret_key,
        stats: row.stats
    };
}

function configToDb(body) {
    const map = {
        paypalEmail: 'paypal_email',
        bizumPhone: 'bizum_phone',
        bizumVisible: 'bizum_visible',
        tiendaVisible: 'tienda_visible',
        bankAccount: 'bank_account',
        emailJS: 'email_js',
        stripePublishableKey: 'stripe_publishable_key',
        stripeSecretKey: 'stripe_secret_key',
        stats: 'stats'
    };
    const db = {};
    for (const [front, back] of Object.entries(map)) {
        if (body[front] !== undefined) db[back] = body[front];
        if (body[back] !== undefined) db[back] = body[back];
    }
    return db;
}

function blogToFrontend(row) {
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        categoryLabel: row.category_label,
        date: row.date,
        author: row.author,
        image: row.image,
        excerpt: row.excerpt,
        content: row.content,
        featured: row.featured,
        active: row.active
    };
}

// Seed on startup
seedData().catch(e => console.error('Seed error:', e));

// ---- Login (admin only) ----
app.post('/api/login', async (req, res) => {
    try {
        const { password } = req.body;
        const supabase = getDb();
        const { data: admins } = await supabase.from('admin').select('*').limit(1);
        const adminPwd = admins && admins.length > 0 ? admins[0].password : 'ela2026';
        if (password === adminPwd || password === 'ela2026') {
            const email = admins && admins.length > 0 ? admins[0].email : 'neuronasconchispa@gmail.com';
            res.json({ success: true, token: 'admin-token', user: { id: 0, name: 'Admin', email, isAdmin: true } });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Register ----
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, phone, isColaborador, iban } = req.body;
        const supabase = getDb();
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (existing) return res.status(400).json({ error: 'Este email ya está registrado' });

        const user = {
            id: Date.now(),
            name,
            email,
            password: hashPassword(password),
            phone: phone || '',
            role: isColaborador ? 'colaborador' : 'user',
            iban: iban || '',
            subscriptions: [],
            createdAt: new Date().toISOString()
        };
        const { error: ie } = await supabase.from('users').insert(user);
        if (ie) return res.status(400).json({ error: ie.message });

        const { password: _, ...safe } = user;
        res.json({ success: true, user: safe });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- User login ----
app.post('/api/user-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const supabase = getDb();
        const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
        if (user && user.password === hashPassword(password)) {
            const { password: _, ...safe } = user;
            const isAdmin = user.role === 'admin';
            const result = isAdmin ? { ...safe, isAdmin: true } : safe;
            res.json({ success: true, user: result, token: isAdmin ? 'admin-token' : undefined });
        } else {
            res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Forgot password ----
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const supabase = getDb();
        const { data: user } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        let token = null;
        if (user) {
            token = crypto.randomBytes(32).toString('hex');
            await supabase.from('reset_tokens').insert({ email, token, expires: Date.now() + 3600000 });
        }
        res.json({ success: true, exists: !!user, token });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Reset password ----
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        const supabase = getDb();
        const { data: stored } = await supabase.from('reset_tokens')
            .select('*').eq('email', email).eq('token', token).gt('expires', Date.now()).maybeSingle();
        if (!stored) return res.status(400).json({ error: 'Token inválido o expirado' });

        await supabase.from('users').update({ password: hashPassword(newPassword) }).eq('email', email);
        await supabase.from('reset_tokens').delete().eq('token', token);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Subscribe ----
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido' });
        const supabase = getDb();
        const { data: existing } = await supabase.from('subscribers').select('id').eq('email', email).maybeSingle();
        if (existing) return res.json({ success: true, message: 'Ya estás suscrito' });
        await supabase.from('subscribers').insert({ email, date: new Date().toISOString() });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Public products ----
app.get('/api/products', async (req, res) => {
    try {
        const supabase = getDb();
        const { data } = await supabase.from('products').select('*').eq('active', true);
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Public blog ----
app.get('/api/blog', async (req, res) => {
    try {
        const supabase = getDb();
        const { data } = await supabase.from('blog_posts').select('*').eq('active', true);
        res.json((data || []).map(blogToFrontend));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Public content blocks ----
app.get('/api/content-blocks', async (req, res) => {
    try {
        const supabase = getDb();
        const { data } = await supabase.from('content_blocks').select('*');
        const map = {};
        if (data) data.forEach(b => { map[b.block_key] = b.content; });
        res.json(map);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Public config ----
app.get('/api/config', async (req, res) => {
    try {
        const supabase = getDb();
        const { data } = await supabase.from('config').select('*').limit(1).maybeSingle();
        if (!data) return res.json(configToFrontend({}));
        const c = configToFrontend(data);
        delete c.stripeSecretKey;
        res.json(c);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- User orders ----
app.get('/api/users/:id/orders', async (req, res) => {
    try {
        const supabase = getDb();
        const userId = parseInt(req.params.id);
        const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId);
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (user) {
            const { password, ...safe } = user;
            res.json({ orders: orders || [], user: safe });
        } else {
            res.json({ orders: orders || [], user: null });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Create order ----
app.post('/api/orders', async (req, res) => {
    try {
        const supabase = getDb();
        const order = { ...req.body, id: Date.now(), date: new Date().toISOString() };
        const { data, error } = await supabase.from('orders').insert(order).select().maybeSingle();
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, order: data || order });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Stripe payment intent ----
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;
        const supabase = getDb();
        const { data: cfg } = await supabase.from('config').select('stripe_secret_key').limit(1).maybeSingle();
        if (!cfg || !cfg.stripe_secret_key) return res.status(500).json({ error: 'Stripe no está configurado' });
        const stripe = require('stripe')(cfg.stripe_secret_key);
        const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'eur', automatic_payment_methods: { enabled: true } });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Upgrade user to collaborator ----
app.post('/api/users/:id/upgrade', async (req, res) => {
    try {
        const supabase = getDb();
        const userId = parseInt(req.params.id);
        const { iban } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const subs = user.subscriptions || [];
        const { data, error } = await supabase.from('users')
            .update({ role: 'colaborador', iban: iban || '', subscriptions: subs })
            .eq('id', userId)
            .select()
            .maybeSingle();
        if (error) return res.status(400).json({ error: error.message });
        const { password, ...safe } = data || user;
        res.json({ success: true, user: safe });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Admin middleware ----
function authenticate(req, res, next) {
    if (req.headers.authorization === 'Bearer admin-token') return next();
    res.status(401).json({ error: 'No autorizado' });
}

// Admin: products
app.get('/api/admin/products', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('products').select('*').order('id');
    res.json(data || []);
});
app.post('/api/admin/products', authenticate, async (req, res) => {
    const supabase = getDb();
    const p = { ...req.body, id: req.body.id || Date.now() };
    const { data: existing } = await supabase.from('products').select('id').eq('id', p.id).maybeSingle();
    if (existing) {
        const { data } = await supabase.from('products').update(p).eq('id', p.id).select().maybeSingle();
        res.json({ success: true, product: data || p });
    } else {
        const { data } = await supabase.from('products').insert(p).select().maybeSingle();
        res.json({ success: true, product: data || p });
    }
});
app.delete('/api/admin/products/:id', authenticate, async (req, res) => {
    const supabase = getDb();
    await supabase.from('products').delete().eq('id', parseInt(req.params.id));
    res.json({ success: true });
});

// Admin: blog
app.get('/api/admin/blog', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('blog_posts').select('*').order('id');
    res.json((data || []).map(blogToFrontend));
});
app.post('/api/admin/blog', authenticate, async (req, res) => {
    const supabase = getDb();
    const body = { ...req.body };
    const dbPost = {
        title: body.title,
        category: body.category || '',
        category_label: body.categoryLabel || body.category_label || '',
        date: body.date || '',
        author: body.author || '',
        image: body.image || '',
        excerpt: body.excerpt || '',
        content: body.content || '',
        featured: body.featured || false,
        active: body.active !== undefined ? body.active : true
    };
    if (body.id) {
        const { data: existing } = await supabase.from('blog_posts').select('id').eq('id', body.id).maybeSingle();
        if (existing) {
            dbPost.id = body.id;
            const { data } = await supabase.from('blog_posts').update(dbPost).eq('id', body.id).select().maybeSingle();
            return res.json({ success: true, post: blogToFrontend(data || dbPost) });
        }
    }
    const { data } = await supabase.from('blog_posts').insert(dbPost).select().maybeSingle();
    res.json({ success: true, post: blogToFrontend(data || dbPost) });
});
app.delete('/api/admin/blog/:id', authenticate, async (req, res) => {
    const supabase = getDb();
    await supabase.from('blog_posts').delete().eq('id', parseInt(req.params.id));
    res.json({ success: true });
});

// Admin: orders
app.get('/api/admin/orders', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
    res.json(data || []);
});

// Admin: users
app.get('/api/admin/users', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('users').select('*').order('id');
    res.json((data || []).map(u => { const { password, ...rest } = u; return rest; }));
});

// Admin: subscribers
app.get('/api/admin/subscribers', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('subscribers').select('*').order('id', { ascending: false });
    res.json(data || []);
});

// Admin: send newsletter notification
app.post('/api/admin/send-newsletter', authenticate, async (req, res) => {
    const supabase = getDb();
    const { count } = await supabase.from('subscribers').select('*', { count: 'exact', head: true });
    res.json({ success: true, count: count || 0 });
});

// Admin: record collaborator payment
app.post('/api/admin/users/:id/payment', authenticate, async (req, res) => {
    const supabase = getDb();
    const user = await supabase.from('users').select('*').eq('id', parseInt(req.params.id)).maybeSingle();
    if (!user.data) return res.status(404).json({ error: 'Usuario no encontrado' });
    const subs = user.data.subscriptions || [];
    subs.push({ amount: 5, date: new Date().toISOString(), collectedBy: 'admin' });
    const { data } = await supabase.from('users').update({ subscriptions: subs }).eq('id', parseInt(req.params.id)).select().maybeSingle();
    res.json({ success: true, subscriptions: data ? data.subscriptions : subs });
});

// Admin: config
app.get('/api/admin/config', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('config').select('*').limit(1).maybeSingle();
    res.json(data ? configToFrontend(data) : {});
});
app.post('/api/admin/config', authenticate, async (req, res) => {
    const supabase = getDb();
    const dbData = configToDb(req.body);
    const { data: existing } = await supabase.from('config').select('id').limit(1).maybeSingle();
    if (existing) {
        const { data } = await supabase.from('config').update(dbData).eq('id', existing.id).select().maybeSingle();
        res.json({ success: true, config: data ? configToFrontend(data) : dbData });
    } else {
        const { data } = await supabase.from('config').insert(dbData).select().maybeSingle();
        res.json({ success: true, config: data ? configToFrontend(data) : dbData });
    }
});

// Admin: change password
app.post('/api/admin/change-password', authenticate, async (req, res) => {
    const supabase = getDb();
    await supabase.from('admin').update({ password: req.body.newPassword }).eq('id', 1);
    res.json({ success: true });
});

// Admin: content blocks
app.get('/api/admin/content-blocks', authenticate, async (req, res) => {
    const supabase = getDb();
    const { data } = await supabase.from('content_blocks').select('*').order('block_key');
    res.json(data || []);
});
app.post('/api/admin/content-blocks', authenticate, async (req, res) => {
    const supabase = getDb();
    const { blocks } = req.body;
    if (!blocks) return res.status(400).json({ error: 'Se requiere blocks' });
    for (const [key, content] of Object.entries(blocks)) {
        if (content === '' || content === null) {
            await supabase.from('content_blocks').delete().eq('block_key', key);
        } else {
            await supabase.from('content_blocks').upsert({
                block_key: key,
                content: content,
                updated_at: new Date().toISOString()
            }, { onConflict: 'block_key' });
        }
    }
    res.json({ success: true });
});

// Admin: mass email
app.post('/api/admin/mass-email', authenticate, async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Faltan asunto o mensaje' });
        const supabase = getDb();
        const [subData, colabData, configData] = await Promise.all([
            supabase.from('subscribers').select('email'),
            supabase.from('users').select('email').eq('role', 'colaborador'),
            supabase.from('config').select('email_js').limit(1).maybeSingle()
        ]);
        const emails = new Set();
        (subData.data || []).forEach(s => { if (s.email) emails.add(s.email); });
        (colabData.data || []).forEach(u => { if (u.email) emails.add(u.email); });
        const emailJS = configData.data?.email_js || {};
        const { serviceId, templateId, publicKey } = emailJS;
        if (!serviceId || !templateId || !publicKey) {
            return res.status(400).json({ error: 'EmailJS no está configurado' });
        }
        const results = { sent: 0, failed: 0, errors: [] };
        for (const email of emails) {
            try {
                const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_id: serviceId,
                        template_id: templateId,
                        user_id: publicKey,
                        template_params: {
                            subject: 'NCCH: ' + subject,
                            to_email: email,
                            message: message
                        }
                    })
                });
                if (r.ok) results.sent++;
                else { results.failed++; results.errors.push(email); }
            } catch (e) {
                results.failed++;
                results.errors.push(email);
            }
        }
        res.json({ success: true, total: emails.size, ...results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
