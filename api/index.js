const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_K3m0PFLCXiZf@ep-raspy-term-alwtyyym.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

client.connect().catch(console.error);

const initialData = {
  admin: { password: 'ela2026', email: 'admin@neuronasconchispa.es' },
  products: [
    { id: 1, name: 'V Torneo de Pádel Benéfico', category: 'Eventos', price: 10, image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', badge: 'Evento', active: true },
    { id: 2, name: 'Calendario Solidario 2026', category: 'Calendarios', price: 10, image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400', badge: 'Nuevo', active: true },
    { id: 3, name: 'Monedero Solidario', category: 'Accesorios', price: 5, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', badge: null, active: true },
    { id: 4, name: 'Pulsera ELA', category: 'Accesorios', price: 3, image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', badge: null, active: true },
    { id: 5, name: 'Botella Térmica', category: 'Accesorios', price: 15, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', badge: 'Popular', active: true },
    { id: 6, name: 'Lápiz Motoneurona', category: 'Oficina', price: 3, image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', badge: null, active: true },
    { id: 7, name: 'Labial Solidario', category: 'Cosmética', price: 3, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', badge: null, active: true },
    { id: 8, name: 'Bolsa Mochila', category: 'Bolsas', price: 10, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', badge: null, active: true },
    { id: 9, name: 'Tote Bag', category: 'Bolsas', price: 10, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400', badge: null, active: true },
    { id: 10, name: 'Neceser', category: 'Accesorios', price: 8, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', badge: null, active: true },
    { id: 11, name: 'Camiseta Los 3 MosquetELAeros', category: 'Ropa', price: 16, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', badge: 'Bestseller', active: true },
    { id: 12, name: 'Colabora', category: 'Donación', price: 10, image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400', badge: null, active: true }
  ],
  blogPosts: [
    { id: 1, title: 'Nuevo ensayo clínico ofrece esperanza para pacientes con ELA', category: 'investigacion', categoryLabel: 'Investigación', date: '8 Abril 2026', author: 'Dr. María García', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', excerpt: 'Un nuevo ensayo clínico fase 3 muestra resultados prometedores en la ralentización de la progresión de la enfermedad.', content: '<p>Un nuevo ensayo clínico de fase 3 ha mostrado resultados prometedores...</p>', featured: true, active: true },
    { id: 2, title: 'V Torneo de Pádel Benéfico: Récord de participación', category: 'eventos', categoryLabel: 'Eventos', date: '5 Abril 2026', author: 'Ana Martínez', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', excerpt: 'Más de 200 jugadores se dieron cita en el torneo.', content: '<p>El V Torneo de Pádel Benéfico...</p>', featured: false, active: true },
    { id: 3, title: 'Guía para familiares: Cómo comunicarse con pacientes de ELA', category: 'familias', categoryLabel: 'Familias', date: '2 Abril 2026', author: 'Lucía Sánchez', image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800', excerpt: 'Consejos prácticos de logopedas y psicólogos.', content: '<p>La comunicación es fundamental...</p>', featured: false, active: true },
    { id: 4, title: 'Concienciación: ¿Por qué necesitamos más investigación?', category: 'sensibilizacion', categoryLabel: 'Sensibilización', date: '30 Marzo 2026', author: 'Carlos Rodríguez', image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', excerpt: 'Cada año se diagnostican 900 nuevos casos en España.', content: '<p>La ELA afecta a más de 4.000 personas...</p>', featured: false, active: true },
    { id: 5, title: 'Nuevas tecnologías para mejorar la calidad de vida', category: 'familias', categoryLabel: 'Familias', date: '25 Marzo 2026', author: 'Pedro Jiménez', image: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800', excerpt: 'Sistemas de comunicación alternativa y control por ojos.', content: '<p>Los avances tecnológicos están revolucionando...</p>', featured: false, active: true },
    { id: 6, title: 'Investigadores españoles logran un hito histórico', category: 'investigacion', categoryLabel: 'Investigación', date: '20 Marzo 2026', author: 'Dra. Carmen Ruiz', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', excerpt: 'Un equipo español identifica nuevos biomarcadores.', content: '<p>Investigadores del CSIC...</p>', featured: false, active: true }
  ],
  orders: [],
  users: [],
  config: {
    paypalEmail: 'info@neuronasconchispa.es',
    bizumPhone: '617 123 456',
    bankAccount: { holder: 'Neuronas con Chispa', iban: 'ES00 0000 0000 0000 0000 0000' },
    emailJS: { serviceId: '', templateId: '', publicKey: '' },
    stripePublishableKey: '',
    stripeSecretKey: '',
    stats: { families: 150, euros: 45000, events: 12, volunteers: 500 }
  }
};

async function readData() {
  const result = await client.query('SELECT data FROM app_data WHERE key = $1', ['app']);
  if (result.rows.length === 0) {
    await client.query('INSERT INTO app_data (key, data) VALUES ($1, $2)', ['app', JSON.stringify(initialData)]);
    return initialData;
  }
  return result.rows[0].data;
}

async function saveData(data) {
  await client.query('UPDATE app_data SET data = $1 WHERE key = $2', [JSON.stringify(data), 'app']);
}

function hashPassword(password) {
  return require('crypto').createHash('sha256').update(password).digest('hex');
}

function authenticate(req) {
  const token = req.headers.authorization;
  return token === 'Bearer admin-token';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    let url = req.url || '';
    if (url.includes('?')) url = url.split('?')[0];
    
    const data = await readData();
    
    if (url === '/api/products' && req.method === 'GET') {
      return res.status(200).json(data.products.filter(p => p.active));
    }
    
    if (url === '/api/blog' && req.method === 'GET') {
      return res.status(200).json(data.blogPosts.filter(p => p.active));
    }
    
    if (url === '/api/config' && req.method === 'GET') {
      const config = { ...data.config };
      delete config.stripeSecretKey;
      return res.status(200).json(config);
    }
    
    if (url === '/api/login' && req.method === 'POST') {
      console.log('Login attempt:', req.body);
      const { password } = req.body || {};
      if (password === data.admin.password) {
        return res.status(200).json({ success: true, token: 'admin-token', user: { id: 0, name: 'Admin', email: data.admin.email, isAdmin: true } });
      }
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    if (url === '/api/register' && req.method === 'POST') {
      const { name, email, password, phone } = req.body || {};
      if (data.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
      const user = { id: Date.now(), name, email, password: hashPassword(password), phone: phone || '', createdAt: new Date().toISOString() };
      data.users.push(user);
      await saveData(data);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, user: userWithoutPassword });
    }
    
    if (url === '/api/user-login' && req.method === 'POST') {
      const { email, password } = req.body || {};
      const user = data.users.find(u => u.email === email && u.password === hashPassword(password));
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ success: true, user: userWithoutPassword });
      }
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    if (url === '/api/orders' && req.method === 'POST') {
      const order = { ...req.body, id: Date.now(), date: new Date().toISOString() };
      data.orders.push(order);
      await saveData(data);
      return res.status(200).json({ success: true, order });
    }
    
    if (url.startsWith('/api/users/') && url.includes('/orders') && req.method === 'GET') {
      const userId = parseInt(url.split('/')[3]);
      const userOrders = data.orders.filter(o => o.userId === userId);
      return res.status(200).json(userOrders);
    }
    
    if (url === '/api/admin/products' && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      return res.status(200).json(data.products);
    }
    
    if (url === '/api/admin/products' && req.method === 'POST') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const product = { ...req.body, id: req.body.id || Date.now() };
      const index = data.products.findIndex(p => p.id === product.id);
      if (index >= 0) data.products[index] = product;
      else data.products.push(product);
      await saveData(data);
      return res.status(200).json({ success: true, product });
    }
    
    if (url.startsWith('/api/admin/delete-product') && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const id = req.query.id;
      data.products = data.products.filter(p => p.id != id);
      await saveData(data);
      return res.status(200).json({ success: true });
    }
    
    if (url === '/api/admin/blog' && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      return res.status(200).json(data.blogPosts);
    }
    
    if (url === '/api/admin/blog' && req.method === 'POST') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const post = { ...req.body, id: req.body.id || Date.now() };
      const index = data.blogPosts.findIndex(p => p.id === post.id);
      if (index >= 0) data.blogPosts[index] = post;
      else data.blogPosts.push(post);
      await saveData(data);
      return res.status(200).json({ success: true, post });
    }
    
    if (url.startsWith('/api/admin/delete-blog') && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const id = req.query.id;
      data.blogPosts = data.blogPosts.filter(p => p.id != id);
      await saveData(data);
      return res.status(200).json({ success: true });
    }
    
    if (url === '/api/admin/orders' && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      return res.status(200).json(data.orders);
    }
    
    if (url === '/api/admin/users' && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const usersWithoutPasswords = data.users.map(u => { const { password, ...user } = u; return user; });
      return res.status(200).json(usersWithoutPasswords);
    }
    
    if (url.startsWith('/api/admin/delete-user') && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      const id = req.query.id;
      data.users = data.users.filter(u => u.id != id);
      await saveData(data);
      return res.status(200).json({ success: true });
    }
    
    if (url === '/api/admin/config' && req.method === 'GET') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      return res.status(200).json(data.config);
    }
    
    if (url === '/api/admin/config' && req.method === 'POST') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      data.config = { ...data.config, ...req.body };
      await saveData(data);
      return res.status(200).json({ success: true, config: data.config });
    }
    
    if (url === '/api/admin/change-password' && req.method === 'POST') {
      if (!authenticate(req)) return res.status(401).json({ error: 'No autorizado' });
      data.admin.password = req.body.newPassword;
      await saveData(data);
      return res.status(200).json({ success: true });
    }
    
    if (url === '/api/create-payment-intent' && req.method === 'POST') {
      const { amount } = req.body || {};
      if (!data.config.stripeSecretKey) {
        return res.status(500).json({ error: 'Stripe no está configurado' });
      }
      try {
        const stripe = require('stripe')(data.config.stripeSecretKey);
        const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'eur', automatic_payment_methods: { enabled: true } });
        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
    
    res.status(404).json({ error: 'Endpoint no encontrado' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};