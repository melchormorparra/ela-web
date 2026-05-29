const { getDb } = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedData() {
    const supabase = getDb();

    // Check if products already seeded
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (productCount === 0) {
        console.log('Seeding products...');
        const products = [
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
        ];
        const { error: pe } = await supabase.from('products').upsert(products, { onConflict: 'id' });
        if (pe) console.error('Seed products error:', pe.message);
    }

    const { count: blogCount } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
    if (blogCount === 0) {
        console.log('Seeding blog posts...');
        const posts = [
            { id: 1, title: 'Nuevo ensayo clínico ofrece esperanza para pacientes con ELA', category: 'investigacion', category_label: 'Investigación', date: '8 Abril 2026', author: 'Dr. María García', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', excerpt: 'Un nuevo ensayo clínico fase 3 muestra resultados prometedores en la ralentización de la progresión de la enfermedad.', content: '<p>Un nuevo ensayo clínico de fase 3 ha mostrado resultados prometedores...</p>', featured: true, active: true },
            { id: 2, title: 'V Torneo de Pádel Benéfico: Récord de participación', category: 'eventos', category_label: 'Eventos', date: '5 Abril 2026', author: 'Ana Martínez', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', excerpt: 'Más de 200 jugadores se dieron cita en el torneo.', content: '<p>El V Torneo de Pádel Benéfico...</p>', featured: false, active: true },
            { id: 3, title: 'Guía para familiares: Cómo comunicarse con pacientes de ELA', category: 'familias', category_label: 'Familias', date: '2 Abril 2026', author: 'Lucía Sánchez', image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800', excerpt: 'Consejos prácticos de logopedas y psicólogos.', content: '<p>La comunicación es fundamental...</p>', featured: false, active: true },
            { id: 4, title: 'Concienciación: ¿Por qué necesitamos más investigación?', category: 'sensibilizacion', category_label: 'Sensibilización', date: '30 Marzo 2026', author: 'Carlos Rodríguez', image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', excerpt: 'Cada año se diagnostican 900 nuevos casos en España.', content: '<p>La ELA afecta a más de 4.000 personas...</p>', featured: false, active: true },
            { id: 5, title: 'Nuevas tecnologías para mejorar la calidad de vida', category: 'familias', category_label: 'Familias', date: '25 Marzo 2026', author: 'Pedro Jiménez', image: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800', excerpt: 'Sistemas de comunicación alternativa y control por ojos.', content: '<p>Los avances tecnológicos están revolucionando...</p>', featured: false, active: true },
            { id: 6, title: 'Investigadores españoles logran un hito histórico', category: 'investigacion', category_label: 'Investigación', date: '20 Marzo 2026', author: 'Dra. Carmen Ruiz', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', excerpt: 'Un equipo español identifica nuevos biomarcadores.', content: '<p>Investigadores del CSIC...</p>', featured: false, active: true },
            { id: 7, title: 'Charla \'Rendirse no es una opción\' a cargo de Adrián Fernández', category: 'eventos', category_label: 'Eventos', date: '10 de mayo de 2026', author: 'Neuronas con Chispa', image: '/images/blog_ayto_29_May.webp', excerpt: 'El próximo 29 de mayo, Adrián Fernández compartirá en Cártama su historia de superación frente a la ELA. Entrada libre.', content: '<p>La Tenencia de Alcaldía de Estación de Cártama albergará la charla \'Rendirse no es una opción\', a cargo del joven cartameño <strong>Adrián Fernández</strong>.</p><p>La charla tendrá lugar el <strong>próximo día 29 de mayo, a las 19.00 horas</strong>, y la entrada es libre hasta completar el aforo.</p>', featured: false, active: true },
            { id: 8, title: 'El Código Postal no puede decidir sobre nuestra vida: La desigualdad en la aplicación de la Ley ELA', category: 'investigacion', category_label: 'Investigación', date: '10 de mayo de 2026', author: 'Neuronas con Chispa', image: '/images/Anciano_silla.webp', excerpt: 'A un año y medio de la aprobación de la Ley ELA, el acceso a las ayudas sigue dependiendo del código postal.', content: '<p>Ha pasado un año y medio desde la <strong>Ley ELA</strong> fuera aprobada.</p><p>La aplicación de esta ley avanza a distintas velocidades.</p>', featured: false, active: true }
        ];
        const { error: be } = await supabase.from('blog_posts').upsert(posts, { onConflict: 'id' });
        if (be) console.error('Seed blog error:', be.message);
    }

    // Upsert admin table record (email/password for login)
    const { error: ae } = await supabase.from('admin').upsert([
        { id: 1, password: 'ela2026', email: 'neuronasconchispa@gmail.com' }
    ], { onConflict: 'id' });
    if (ae) console.error('Seed admin table error:', ae.message);

    // Upsert admin user in users table
    const { error: ue } = await supabase.from('users').upsert([
        { id: 0, name: 'Administrador', email: 'neuronasconchispa@gmail.com', password: hashPassword('ela2026'), phone: '', role: 'admin', iban: '', subscriptions: [], createdAt: new Date().toISOString() }
    ], { onConflict: 'id' });
    if (ue) console.error('Seed admin error:', ue.message);

    const { count: configCount } = await supabase.from('config').select('*', { count: 'exact', head: true });
    if (configCount === 0) {
        console.log('Seeding config...');
        const { error: ce } = await supabase.from('config').insert([
            {
                paypal_email: 'neuronasconchispa@gmail.com',
                bizum_phone: '617 123 456',
                bank_account: { holder: 'Neuronas con Chispa', iban: 'ES39 2100 4823 0322 0036 2949' },
                email_js: { serviceId: 'service_nch_2026', templateId: 'template_h5wg11r', publicKey: 'XIxGEq1S5TGgtNuQF' },
                stripe_publishable_key: '',
                stripe_secret_key: '',
                stats: { families: 150, euros: 45000, events: 12, volunteers: 500 },
                bizum_visible: false,
                tienda_visible: false
            }
        ]);
        if (ce) console.error('Seed config error:', ce.message);
    }

    // Seed page_views count in config.stats (retroactive from 2026-05-28)
    const { data: cfg } = await supabase.from('config').select('stats').limit(1).maybeSingle();
    if (cfg && cfg.stats && cfg.stats.page_views === undefined) {
        cfg.stats.page_views = 500;
        cfg.stats.start_date = '2026-05-28T12:00:00Z';
        await supabase.from('config').update({ stats: cfg.stats }).eq('id', 1);
        console.log('Seeded page_views = 500 in config.stats (retroactive from 2026-05-28)');
    }

    // Always upsert any missing content blocks (won't overwrite existing content)
    const allBlocks = [
        { block_key: 'hero_title', title: 'T\u00edtulo del Hero', content: 'Neuronas con Chispa' },
        { block_key: 'hero_tagline', title: 'Subt\u00edtulo del Hero', content: 'Asociaci\u00f3n para la investigaci\u00f3n de la ELA' },
        { block_key: 'hero_text', title: 'Texto del Hero', content: 'Juntos podemos hacer la diferencia. Cada donaci\u00f3n nos acerca a un futuro sin ELA.' },
        { block_key: 'quienes_somos_titulo', title: 'T\u00edtulo Qui\u00e9nes Somos', content: 'Qui\u00e9nes Somos' },
        { block_key: 'quienes_somos_p1', title: 'Qui\u00e9nes Somos p\u00e1rrafo 1', content: 'Neuronas con Chispa es una asociaci\u00f3n sin \u00e1nimo de lucro dedicada a mejorar la calidad de vida de las personas afectadas por la Esclerosis Lateral Amiotr\u00f3fica (ELA) y sus familias.' },
        { block_key: 'quienes_somos_p2', title: 'Qui\u00e9nes Somos p\u00e1rrafo 2', content: 'Nuestro objetivo principal es fomentar la investigaci\u00f3n cient\u00edfica para encontrar una cura definitiva, mientras acompa\u00f1amos y apoyamos a los afectados en su d\u00eda a d\u00eda.' },
        { block_key: 'que_es_ela_titulo', title: 'T\u00edtulo \u00bfQu\u00e9 es la ELA?', content: '\u00bfQu\u00e9 es la ELA?' },
        { block_key: 'que_es_ela_texto', title: 'Texto \u00bfQu\u00e9 es la ELA?', content: '<p>La <strong>Esclerosis Lateral Amiotr\u00f3fica (ELA)</strong> es una enfermedad neurodegenerativa que afecta a las neuronas motoras del cerebro y de la m\u00e9dula espinal.</p><p>Esto provoca que las neuronas dejen de funcionar correctamente y, con el tiempo, mueren. Como resultado, los m\u00fasculos se debilitan gradualmente, afectando a:</p>' },
        { block_key: 'que_es_ela_lista', title: 'Lista s\u00edntomas ELA', content: '<li><i class="fas fa-check"></i> La capacidad de caminar, hablar y moverte</li><li><i class="fas fa-check"></i> La respiraci\u00f3n y degluci\u00f3n</li><li><i class="fas fa-check"></i> La comunicaci\u00f3n verbal y gestual</li>' },
        { block_key: 'ela_fact_1', title: 'Hecho ELA 1', content: '{"number":"4.000+","label":"Personas con ELA en Espa\u00f1a"}' },
        { block_key: 'ela_fact_2', title: 'Hecho ELA 2', content: '{"number":"900","label":"Nuevos casos al a\u00f1o"}' },
        { block_key: 'ela_fact_3', title: 'Hecho ELA 3', content: '{"number":"35.000-60.000\u20ac","label":"Coste anual por paciente"}' },
        { block_key: 'tienda_titulo', title: 'T\u00edtulo Tienda', content: 'Tienda Solidaria' },
        { block_key: 'tienda_subtitulo', title: 'Subt\u00edtulo Tienda', content: 'Cada compra ayuda a financiar investigaci\u00f3n y apoyo a familias' },
        { block_key: 'donar_titulo', title: 'T\u00edtulo Donar', content: 'Haz tu Donaci\u00f3n' },
        { block_key: 'donar_subtitulo', title: 'Subt\u00edtulo Donar', content: 'Tu aportaci\u00f3n marca la diferencia' },
        { block_key: 'donar_impacto_5', title: 'Mensaje impacto 5\u20ac', content: '5\u20ac = Ayudas a mantener nuestra web y redes sociales' },
        { block_key: 'colaborador_titulo', title: 'T\u00edtulo Colaborador', content: 'Hazte Colaborador' },
        { block_key: 'colaborador_texto', title: 'Texto Colaborador', content: 'Convi\u00e9rtete en colaborador mensual y apoya la investigaci\u00f3n de la ELA.' },
        { block_key: 'colaborador_impacto', title: 'Impacto Colaborador', content: '5\u20ac/mes = Ayuda constante para la investigaci\u00f3n' },
        { block_key: 'contacto_titulo', title: 'T\u00edtulo Contacto', content: 'Contacto' },
        { block_key: 'contacto_direccion', title: 'Direcci\u00f3n', content: 'C/ Ejemplo, 123<br>29001 M\u00e1laga, Espa\u00f1a' },
        { block_key: 'contacto_telefono', title: 'Tel\u00e9fono', content: '+34 612 345 678' },
        { block_key: 'contacto_email_valor', title: 'Email contacto', content: 'info@neuronasconchispa.es' },
        { block_key: 'blog_titulo', title: 'T\u00edtulo Blog', content: 'Blog y Noticias' },
        { block_key: 'blog_subtitulo', title: 'Subt\u00edtulo Blog', content: '\u00daltimas novedades sobre la ELA y nuestra asociaci\u00f3n' },
        { block_key: 'facebook_url', title: 'URL de Facebook', content: '#' },
        { block_key: 'twitter_url', title: 'URL de Twitter / X', content: '#' },
        { block_key: 'instagram_url', title: 'URL de Instagram', content: '#' },
        { block_key: 'youtube_url', title: 'URL de YouTube', content: 'https://youtube.com/@neuronasconchispa?si=bbMaAvu5SLrZHJmm' },
        { block_key: 'palette', title: 'Paleta de colores', content: '{"primary":"#1104fc","primaryDark":"#0802c4","secondary":"#0401a8","accent":"#00008c","dark":"#333333"}' }
    ];
    for (const block of allBlocks) {
        const { data: existing } = await supabase.from('content_blocks').select('block_key').eq('block_key', block.block_key).maybeSingle();
        if (!existing) {
            const { error: ble } = await supabase.from('content_blocks').upsert(block, { onConflict: 'block_key' });
            if (ble) console.error('Seed content block error:', block.block_key, ble.message);
        }
    }

    console.log('Seed check complete.');
}

module.exports = { seedData };
