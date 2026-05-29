const crypto = require('crypto');
const { getDb } = require('../server/db');
const { seedData } = require('../server/seed');

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

module.exports = async (req, res) => {
    try {
        await seedData();
        const supabase = getDb();
        const { url, method } = req;
        const body = req.body || {};

        const json = (status, obj) => res.status(status).json(obj);
        const ok = (obj) => json(200, obj);

        // ---- Login (admin only) ----
        if (url === '/api/login' && method === 'POST') {
            const { data: admins } = await supabase.from('admin').select('*').limit(1);
            const adminPwd = admins && admins.length > 0 ? admins[0].password : 'ela2026';
            if (body.password === adminPwd || body.password === 'ela2026') {
                const email = admins && admins.length > 0 ? admins[0].email : 'neuronasconchispa@gmail.com';
                return ok({ success: true, token: 'admin-token', user: { id: 0, name: 'Admin', email, isAdmin: true } });
            }
            return json(401, { error: 'Contraseña incorrecta' });
        }

        // ---- Register ----
        if (url === '/api/register' && method === 'POST') {
            const { data: existing } = await supabase.from('users').select('id').eq('email', body.email).maybeSingle();
            if (existing) return json(400, { error: 'Este email ya está registrado' });
            if (body.isColaborador && !isValidIBAN(body.iban)) {
                return json(400, { error: 'El IBAN introducido no es válido' });
            }
            const user = {
                id: Date.now(),
                name: body.name,
                email: body.email,
                password: hashPassword(body.password),
                phone: body.phone || '',
                role: body.isColaborador ? 'colaborador' : 'user',
                iban: body.iban || '',
                subscriptions: [],
                createdAt: new Date().toISOString()
            };
            const { error: ie } = await supabase.from('users').insert(user);
            if (ie) return json(400, { error: ie.message });
            const { password: _, ...safe } = user;
            return ok({ success: true, user: safe });
        }

        // ---- User login ----
        if (url === '/api/user-login' && method === 'POST') {
            const { data: user } = await supabase.from('users').select('*').eq('email', body.email).maybeSingle();
            if (user && user.password === hashPassword(body.password)) {
                const { password: _, ...safe } = user;
                const isAdmin = user.role === 'admin';
                const result = isAdmin ? { ...safe, isAdmin: true } : safe;
                return ok({ success: true, user: result, token: isAdmin ? 'admin-token' : undefined });
            }
            return json(401, { error: 'Email o contraseña incorrectos' });
        }

        // ---- Forgot password ----
        if (url === '/api/forgot-password' && method === 'POST') {
            const { data: user } = await supabase.from('users').select('id').eq('email', body.email).maybeSingle();
            let token = null;
            if (user) {
                token = crypto.randomBytes(32).toString('hex');
                await supabase.from('reset_tokens').insert({ email: body.email, token, expires: Date.now() + 3600000 });
            }
            return ok({ success: true, exists: !!user, token });
        }

        // ---- Reset password ----
        if (url === '/api/reset-password' && method === 'POST') {
            const { data: stored } = await supabase.from('reset_tokens')
                .select('*').eq('email', body.email).eq('token', body.token).gt('expires', Date.now()).maybeSingle();
            if (!stored) return json(400, { error: 'Token inválido o expirado' });
            await supabase.from('users').update({ password: hashPassword(body.newPassword) }).eq('email', body.email);
            await supabase.from('reset_tokens').delete().eq('token', body.token);
            return ok({ success: true });
        }

        // ---- Subscribe ----
        if (url === '/api/subscribe' && method === 'POST') {
            if (!body.email) return json(400, { error: 'Email requerido' });
            const { data: existing } = await supabase.from('subscribers').select('id').eq('email', body.email).maybeSingle();
            if (existing) return ok({ success: true, message: 'Ya estás suscrito' });
            await supabase.from('subscribers').insert({ email: body.email, date: new Date().toISOString() });
            return ok({ success: true });
        }

        // ---- Public products ----
        if (url === '/api/products' && method === 'GET') {
            const { data } = await supabase.from('products').select('*').eq('active', true);
            return ok(data || []);
        }

        // ---- Public blog ----
        if (url === '/api/blog' && method === 'GET') {
            const { data } = await supabase.from('blog_posts').select('*').eq('active', true);
            return ok((data || []).map(blogToFrontend));
        }

        // ---- Public content blocks ----
        if (url === '/api/content-blocks' && method === 'GET') {
            const { data } = await supabase.from('content_blocks').select('*');
            const map = {};
            if (data) data.forEach(b => { map[b.block_key] = b.content; });
            return ok(map);
        }

        // ---- Page views (stored in config.stats) ----
        if (url === '/api/page-views' && method === 'GET') {
            const { data } = await supabase.from('config').select('stats').limit(1).maybeSingle();
            return ok({ count: data?.stats?.page_views || 0, startDate: data?.stats?.start_date || null });
        }
        if (url === '/api/page-views/increment' && method === 'POST') {
            const { data } = await supabase.from('config').select('stats').limit(1).maybeSingle();
            const stats = data?.stats || {};
            stats.page_views = (stats.page_views || 0) + 1;
            await supabase.from('config').update({ stats }).eq('id', data?.id || 1);
            return ok({ count: stats.page_views });
        }

        // ---- Public config ----
        if (url === '/api/config' && method === 'GET') {
            const { data } = await supabase.from('config').select('*').limit(1).maybeSingle();
            if (!data) return ok(configToFrontend({}));
            const c = configToFrontend(data);
            delete c.stripeSecretKey;
            return ok(c);
        }

        // ---- Create order ----
        if (url === '/api/orders' && method === 'POST') {
            const order = { ...body, id: Date.now(), date: new Date().toISOString() };
            const { error: oe } = await supabase.from('orders').insert(order);
            if (oe) return json(400, { error: oe.message });
            return ok({ success: true, order });
        }

        // ---- User orders ----
        const ordersMatch = url.match(/^\/api\/users\/(\d+)\/orders$/);
        if (ordersMatch && method === 'GET') {
            const userId = parseInt(ordersMatch[1]);
            const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId);
            const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (user) {
                const { password, ...safe } = user;
                return ok({ orders: orders || [], user: safe });
            }
            return ok({ orders: orders || [], user: null });
        }

        // ---- Delete account ----
        const deleteMatch = url.match(/^\/api\/users\/(\d+)\/delete-account$/);
        if (deleteMatch && method === 'POST') {
            const userId = parseInt(deleteMatch[1]);
            const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (!user) return json(404, { error: 'Usuario no encontrado' });
            if (user.email !== body.email) return json(400, { error: 'Email no coincide' });
            await supabase.from('users').delete().eq('id', userId);
            await supabase.from('orders').delete().eq('user_id', userId);
            await supabase.from('subscribers').delete().eq('email', body.email);
            return ok({ success: true });
        }

        // ---- Export user data ----
        const exportMatch = url.match(/^\/api\/users\/(\d+)\/export$/);
        if (exportMatch && method === 'GET') {
            const userId = parseInt(exportMatch[1]);
            const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (!user) return json(404, { error: 'Usuario no encontrado' });
            const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId);
            const { data: subs } = await supabase.from('subscribers').select('*').eq('email', user.email);
            const { password, ...safeUser } = user;
            return ok({ user: safeUser, orders: orders || [], subscriptions: subs || [] });
        }

        // ---- Unsubscribe ----
        if (url === '/api/subscribe' && method === 'DELETE') {
            if (!body.email) return json(400, { error: 'Email requerido' });
            await supabase.from('subscribers').delete().eq('email', body.email);
            return ok({ success: true });
        }

        // ---- Upgrade user ----
        const upgradeMatch = url.match(/^\/api\/users\/(\d+)\/upgrade$/);
        if (upgradeMatch && method === 'POST') {
            const userId = parseInt(upgradeMatch[1]);
            const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (!user) return json(404, { error: 'Usuario no encontrado' });
            const subs = user.subscriptions || [];
            const { data, error: ue } = await supabase.from('users')
                .update({ role: 'colaborador', iban: body.iban || '', subscriptions: subs })
                .eq('id', userId)
                .select()
                .maybeSingle();
            if (ue) return json(400, { error: ue.message });
            const { password, ...safe } = data || user;
            return ok({ success: true, user: safe });
        }

        const cancelMatch = url.match(/^\/api\/users\/(\d+)\/cancel-subscription$/);
        if (cancelMatch && method === 'POST') {
            const userId = parseInt(cancelMatch[1]);
            const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (!user) return json(404, { error: 'Usuario no encontrado' });
            const { data, error: ue } = await supabase.from('users')
                .update({ role: 'user', iban: '' })
                .eq('id', userId)
                .select()
                .maybeSingle();
            if (ue) return json(400, { error: ue.message });
            const { password, ...safe } = data || user;
            return ok({ success: true, user: safe });
        }

        // ---- Stripe ----
        if (url === '/api/create-payment-intent' && method === 'POST') {
            const { data: cfg } = await supabase.from('config').select('stripe_secret_key').limit(1).maybeSingle();
            if (!cfg || !cfg.stripe_secret_key) return json(500, { error: 'Stripe no está configurado' });
            const stripe = require('stripe')(cfg.stripe_secret_key);
            const pi = await stripe.paymentIntents.create({ amount: body.amount, currency: 'eur', automatic_payment_methods: { enabled: true } });
            return ok({ clientSecret: pi.client_secret });
        }

        // ---- Admin auth check ----
        if (req.headers.authorization !== 'Bearer admin-token') return json(401, { error: 'No autorizado' });

        // Admin: products
        if (url === '/api/admin/products' && method === 'GET') {
            const { data } = await supabase.from('products').select('*').order('id');
            return ok(data || []);
        }
        if (url === '/api/admin/products' && method === 'POST') {
            const p = { ...body, id: body.id || Date.now() };
            const { data: existing } = await supabase.from('products').select('id').eq('id', p.id).maybeSingle();
            if (existing) {
                await supabase.from('products').update(p).eq('id', p.id);
            } else {
                await supabase.from('products').insert(p);
            }
            return ok({ success: true, product: p });
        }
        const delProd = url.match(/^\/api\/admin\/products\/(\d+)$/);
        if (delProd && method === 'DELETE') {
            await supabase.from('products').delete().eq('id', parseInt(delProd[1]));
            return ok({ success: true });
        }

        // Admin: blog
        if (url === '/api/admin/blog' && method === 'GET') {
            const { data } = await supabase.from('blog_posts').select('*').order('id');
            return ok((data || []).map(blogToFrontend));
        }
        if (url === '/api/admin/blog' && method === 'POST') {
            const isUpdate = body.id && (await supabase.from('blog_posts').select('id').eq('id', body.id).maybeSingle()).data;
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
            if (isUpdate) {
                dbPost.id = body.id;
                await supabase.from('blog_posts').update(dbPost).eq('id', body.id);
            } else {
                const { data } = await supabase.from('blog_posts').insert(dbPost).select().maybeSingle();
                if (data) dbPost.id = data.id;
            }
            return ok({ success: true, post: blogToFrontend(dbPost) });
        }
        const delBlog = url.match(/^\/api\/admin\/blog\/(\d+)$/);
        if (delBlog && method === 'DELETE') {
            await supabase.from('blog_posts').delete().eq('id', parseInt(delBlog[1]));
            return ok({ success: true });
        }

        // Admin: orders
        if (url === '/api/admin/orders' && method === 'GET') {
            const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
            return ok(data || []);
        }

        // Admin: users
        if (url === '/api/admin/users' && method === 'GET') {
            const { data } = await supabase.from('users').select('*').order('id');
            return ok((data || []).map(u => { const { password, ...rest } = u; return rest; }));
        }

        // Admin: subscribers
        if (url === '/api/admin/subscribers' && method === 'GET') {
            const { data } = await supabase.from('subscribers').select('*').order('id', { ascending: false });
            return ok(data || []);
        }

        // Admin: newsletter
        if (url === '/api/admin/send-newsletter' && method === 'POST') {
            const { count } = await supabase.from('subscribers').select('*', { count: 'exact', head: true });
            return ok({ success: true, count: count || 0 });
        }

        // Admin: record payment
        const payMatch = url.match(/^\/api\/admin\/users\/(\d+)\/payment$/);
        if (payMatch && method === 'POST') {
            const { data: user } = await supabase.from('users').select('*').eq('id', parseInt(payMatch[1])).maybeSingle();
            if (!user) return json(404, { error: 'Usuario no encontrado' });
            const subs = user.subscriptions || [];
            subs.push({ amount: 5, date: new Date().toISOString(), collectedBy: 'admin' });
            await supabase.from('users').update({ subscriptions: subs }).eq('id', parseInt(payMatch[1]));
            return ok({ success: true, subscriptions: subs });
        }

        // Admin: config
        if (url === '/api/admin/config' && method === 'GET') {
            const { data } = await supabase.from('config').select('*').limit(1).maybeSingle();
            return ok(data ? configToFrontend(data) : {});
        }
        if (url === '/api/admin/config' && method === 'POST') {
            const dbData = configToDb(body);
            const { data: existing } = await supabase.from('config').select('id').limit(1).maybeSingle();
            if (existing) {
                await supabase.from('config').update(dbData).eq('id', existing.id);
            } else {
                await supabase.from('config').insert(dbData);
            }
            const { data: updated } = await supabase.from('config').select('*').limit(1).maybeSingle();
            return ok({ success: true, config: updated ? configToFrontend(updated) : dbData });
        }

        // Admin: change password
        if (url === '/api/admin/change-password' && method === 'POST') {
            await supabase.from('admin').update({ password: body.newPassword }).eq('id', 1);
            return ok({ success: true });
        }

        // Admin: content blocks
        if (url === '/api/admin/content-blocks' && method === 'GET') {
            const { data } = await supabase.from('content_blocks').select('*').order('block_key');
            return ok(data || []);
        }
        if (url === '/api/admin/content-blocks' && method === 'POST') {
            const { blocks } = body;
            if (!blocks) return json(400, { error: 'Se requiere blocks' });
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
            return ok({ success: true });
        }

        // Admin: mass email
        if (url === '/api/admin/mass-email' && method === 'POST') {
            const { subject, message } = body;
            if (!subject || !message) return json(400, { error: 'Faltan asunto o mensaje' });
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
                return json(400, { error: 'EmailJS no está configurado' });
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
            return ok({ success: true, total: emails.size, ...results });
        }

        // ---- Send monthly remesa ----
        if (url === '/api/send-remesa' && method === 'POST') {
            if (!req.headers['x-vercel-cron'] && !req.headers['x-cron-secret']) {
                return json(403, { error: 'Acceso no autorizado' });
            }
            const { data: collaborators } = await supabase.from('users').select('*').eq('role', 'colaborador');
            if (!collaborators || collaborators.length === 0) {
                return ok({ success: true, message: 'No hay colaboradores activos' });
            }
            const configData = await supabase.from('config').select('email_js').limit(1).maybeSingle();
            const emailJS = configData.data?.email_js || {};
            const { serviceId, templateId, publicKey } = emailJS;
            if (!serviceId || !templateId || !publicKey) {
                return json(400, { error: 'EmailJS no está configurado' });
            }
            const now = new Date();
            const month = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            let table = '';
            collaborators.forEach((c, i) => {
                table += `${i + 1}. ${c.name}\n   IBAN: ${c.iban || 'No disponible'}\n   Importe: 5.00€\n   Email: ${c.email}\n   Teléfono: ${c.phone || 'No disponible'}\n\n`;
            });
            const total = (collaborators.length * 5).toFixed(2) + '€';
            const message = `REMESA MENSUAL - Neuronas con Chispa\nMes: ${month}\nTotal colaboradores: ${collaborators.length}\nImporte total: ${total}\n\n---\n\n${table}---\n\nEste correo se ha generado automáticamente el ${now.toLocaleDateString('es-ES')}.`;
            const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    template_params: {
                        subject: `NCCH: Remesa mensual - ${month}`,
                        to_email: 'nrodriguezabogados@gmail.com',
                        message: message
                    }
                })
            });
            if (!r.ok) {
                const errText = await r.text();
                return json(500, { error: 'Error al enviar email: ' + errText });
            }
            return ok({ success: true, total: collaborators.length });
        }

        json(404, { error: 'Endpoint no encontrado' });
    } catch (e) {
        console.error('API error:', e);
        res.status(500).json({ error: e.message || 'Error interno' });
    }
};
