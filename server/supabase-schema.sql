-- ============================================================
-- Neuronas con Chispa - Supabase Schema
-- Run this SQL in the Supabase SQL Editor after creating your project
-- ============================================================

-- Admin table
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL DEFAULT 'ela2026',
  email TEXT NOT NULL DEFAULT 'admin@neuronasconchispa.es'
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  iban TEXT DEFAULT '',
  subscriptions JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC,
  image TEXT,
  badge TEXT,
  active BOOLEAN DEFAULT true
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  category_label TEXT DEFAULT '',
  date TEXT DEFAULT '',
  author TEXT DEFAULT '',
  image TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TIMESTAMP DEFAULT NOW(),
  customer_email TEXT DEFAULT '',
  customer_name TEXT DEFAULT '',
  user_id BIGINT DEFAULT NULL,
  reference TEXT DEFAULT '',
  payment_intent_id TEXT DEFAULT ''
);

-- Config (single row)
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  paypal_email TEXT DEFAULT 'info@neuronasconchispa.es',
  bizum_phone TEXT DEFAULT '617 123 456',
  bank_account JSONB DEFAULT '{"holder":"Neuronas con Chispa","iban":"ES00 0000 0000 0000 0000 0000"}'::jsonb,
  email_js JSONB DEFAULT '{"serviceId":"","templateId":"","publicKey":""}'::jsonb,
  stripe_publishable_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  stats JSONB DEFAULT '{"families":150,"euros":45000,"events":12,"volunteers":500}'::jsonb,
  bizum_visible BOOLEAN DEFAULT false,
  tienda_visible BOOLEAN DEFAULT false
);

-- Subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  date TIMESTAMP DEFAULT NOW()
);

-- Reset tokens
CREATE TABLE IF NOT EXISTS reset_tokens (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires BIGINT NOT NULL
);

-- ============================================================
-- SEED DATA (run once)
-- ============================================================

-- Admin
INSERT INTO admin (password, email) VALUES ('ela2026', 'admin@neuronasconchispa.es')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, category, price, image, badge, active) VALUES
(1, 'V Torneo de P√°del Ben√©fico', 'Eventos', 10, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 'Evento', true),
(2, 'Calendario Solidario 2026', 'Calendarios', 10, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400', 'Nuevo', true),
(3, 'Monedero Solidario', 'Accesorios', 5, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', null, true),
(4, 'Pulsera ELA', 'Accesorios', 3, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', null, true),
(5, 'Botella T√©rmica', 'Accesorios', 15, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 'Popular', true),
(6, 'L√°piz Motoneurona', 'Oficina', 3, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', null, true),
(7, 'Labial Solidario', 'Cosm√©tica', 3, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', null, true),
(8, 'Bolsa Mochila', 'Bolsas', 10, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', null, true),
(9, 'Tote Bag', 'Bolsas', 10, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400', null, true),
(10, 'Neceser', 'Accesorios', 8, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', null, true),
(11, 'Camiseta Los 3 MosquetELAeros', 'Ropa', 16, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Bestseller', true),
(12, 'Colabora', 'Donaci√≥n', 10, 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400', null, true)
ON CONFLICT (id) DO NOTHING;

-- Config (use real values from current data.json)
INSERT INTO config (paypal_email, bizum_phone, bank_account, email_js, stripe_publishable_key, stripe_secret_key, stats)
VALUES (
  'neuronasconchispa@gmail.com',
  '617 123 456',
  '{"holder":"Neuronas con Chispa","iban":"ES39 2100 4823 0322 0036 2949"}'::jsonb,
  '{"serviceId":"service_nch_2026","templateId":"template_h5wg11r","publicKey":"XIxGEq1S5TGgtNuQF"}'::jsonb,
  '',
  '',
  '{"families":150,"euros":45000,"events":12,"volunteers":500}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Blog posts
INSERT INTO blog_posts (id, title, category, category_label, date, author, image, excerpt, content, featured, active) VALUES
(1, 'Nuevo ensayo cl√≠nico ofrece esperanza para pacientes con ELA', 'investigacion', 'Investigaci√≥n', '8 Abril 2026', 'Dr. Mar√≠a Garc√≠a', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'Un nuevo ensayo cl√≠nico fase 3 muestra resultados prometedores en la ralentizaci√≥n de la progresi√≥n de la enfermedad.', '<p>Un nuevo ensayo cl√≠nico de fase 3 ha mostrado resultados prometedores...</p>', true, true),
(2, 'V Torneo de P√°del Ben√©fico: R√©cord de participaci√≥n', 'eventos', 'Eventos', '5 Abril 2026', 'Ana Mart√≠nez', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'M√°s de 200 jugadores se dieron cita en el torneo.', '<p>El V Torneo de P√°del Ben√©fico...</p>', false, true),
(3, 'Gu√≠a para familiares: C√≥mo comunicarse con pacientes de ELA', 'familias', 'Familias', '2 Abril 2026', 'Luc√≠a S√°nchez', 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800', 'Consejos pr√°cticos de logopedas y psic√≥logos.', '<p>La comunicaci√≥n es fundamental...</p>', false, true),
(4, 'Concienciaci√≥n: ¬øPor qu√© necesitamos m√°s investigaci√≥n?', 'sensibilizacion', 'Sensibilizaci√≥n', '30 Marzo 2026', 'Carlos Rodr√≠guez', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', 'Cada a√±o se diagnostican 900 nuevos casos en Espa√±a.', '<p>La ELA afecta a m√°s de 4.000 personas...</p>', false, true),
(5, 'Nuevas tecnolog√≠as para mejorar la calidad de vida', 'familias', 'Familias', '25 Marzo 2026', 'Pedro Jim√©nez', 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800', 'Sistemas de comunicaci√≥n alternativa y control por ojos.', '<p>Los avances tecnol√≥gicos est√°n revolucionando...</p>', false, true),
(6, 'Investigadores espa√±oles logran un hito hist√≥rico', 'investigacion', 'Investigaci√≥n', '20 Marzo 2026', 'Dra. Carmen Ruiz', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', 'Un equipo espa√±ol identifica nuevos biomarcadores.', '<p>Investigadores del CSIC...</p>', false, true),
(7, 'Charla ''Rendirse no es una opci√≥n'' a cargo de Adri√°n Fern√°ndez', 'eventos', 'Eventos', '10 de mayo de 2026', 'Neuronas con Chispa', '/images/blog_ayto_29_May.webp', 'El pr√≥ximo 29 de mayo, Adri√°n Fern√°ndez compartir√° en C√°rtama su historia de superaci√≥n frente a la ELA. Entrada libre.', '<p>La Tenencia de Alcald√≠a de Estaci√≥n de C√°rtama albergar√° la charla ''Rendirse no es una opci√≥n'', a cargo del joven cartame√±o <strong>Adri√°n Fern√°ndez</strong>.</p><p>La charla tendr√° lugar el <strong>pr√≥ximo d√≠a 29 de mayo, a las 19.00 horas</strong>, y la entrada es libre hasta completar el aforo.</p>', false, true),
(8, 'El C√≥digo Postal no puede decidir sobre nuestra vida: La desigualdad en la aplicaci√≥n de la Ley ELA', 'investigacion', 'Investigaci√≥n', '10 de mayo de 2026', 'Neuronas con Chispa', '/images/Anciano_silla.webp', 'A un a√±o y medio de la aprobaci√≥n de la Ley ELA, el acceso a las ayudas sigue dependiendo del c√≥digo postal.', '<p>Ha pasado un a√±o y medio desde que la <strong>Ley ELA</strong> fuera aprobada.</p><p>La aplicaci√≥n de esta ley avanza a distintas velocidades.</p>', false, true)
ON CONFLICT (id) DO NOTHING;


-- Content blocks (editable page content)
CREATE TABLE IF NOT EXISTS content_blocks (
  block_key TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO content_blocks (block_key, title, content) VALUES
('hero_title', 'TÌtulo del Hero', 'Neuronas con Chispa'),
('hero_tagline', 'SubtÌtulo del Hero', 'AsociaciÛn para la investigaciÛn de la ELA'),
('hero_text', 'Texto del Hero', 'Juntos podemos hacer la diferencia. Cada donaciÛn nos acerca a un futuro sin ELA.'),
('quienes_somos_titulo', 'TÌtulo QuiÈnes Somos', 'QuiÈnes Somos'),
('quienes_somos_p1', 'QuiÈnes Somos p·rrafo 1', 'Neuronas con Chispa es una asociaciÛn sin ·nimo de lucro dedicada a mejorar la calidad de vida de las personas afectadas por la Esclerosis Lateral AmiotrÛfica (ELA) y sus familias.'),
('quienes_somos_p2', 'QuiÈnes Somos p·rrafo 2', 'Nuestro objetivo principal es fomentar la investigaciÛn cientÌfica para encontrar una cura definitiva, mientras acompaÒamos y apoyamos a los afectados en su dÌa a dÌa.'),
('que_es_ela_titulo', 'TÌtulo øQuÈ es la ELA?', 'øQuÈ es la ELA?'),
('que_es_ela_texto', 'Texto øQuÈ es la ELA?', '<p>La <strong>Esclerosis Lateral AmiotrÛfica (ELA)</strong> es una enfermedad neurodegenerativa que afecta a las neuronas motoras del cerebro y de la mÈdula espinal.</p><p>Esto provoca que las neuronas dejen de funcionar correctamente y, con el tiempo, mueren. Como resultado, los m˙sculos se debilitan gradualmente, afectando a:</p>'),
('que_es_ela_lista', 'Lista sÌntomas ELA', '<li><i class=\"fas fa-check\"></i> La capacidad de caminar, hablar y moverte</li><li><i class=\"fas fa-check\"></i> La respiraciÛn y degluciÛn</li><li><i class=\"fas fa-check\"></i> La comunicaciÛn verbal y gestual</li>'),
('ela_fact_1', 'Hecho ELA 1', '{\"number\":\"4.000+\",\"label\":\"Personas con ELA en EspaÒa\"}'),
('ela_fact_2', 'Hecho ELA 2', '{\"number\":\"900\",\"label\":\"Nuevos casos al aÒo\"}'),
('ela_fact_3', 'Hecho ELA 3', '{\"number\":\"35.000-60.000Ä\",\"label\":\"Coste anual por paciente\"}'),
('tienda_titulo', 'TÌtulo Tienda', 'Tienda Solidaria'),
('tienda_subtitulo', 'SubtÌtulo Tienda', 'Cada compra ayuda a financiar investigaciÛn y apoyo a familias'),
('donar_titulo', 'TÌtulo Donar', 'Haz tu DonaciÛn'),
('donar_subtitulo', 'SubtÌtulo Donar', 'Tu aportaciÛn marca la diferencia'),
('donar_impacto_5', 'Mensaje impacto 5Ä', '5Ä = Ayudas a mantener nuestra web y redes sociales'),
('colaborador_titulo', 'TÌtulo Colaborador', 'Hazte Colaborador'),
('colaborador_texto', 'Texto Colaborador', 'ConviÈrtete en colaborador mensual y apoya la investigaciÛn de la ELA.'),
('colaborador_impacto', 'Impacto Colaborador', '5Ä/mes = Ayuda constante para la investigaciÛn'),
('contacto_titulo', 'TÌtulo Contacto', 'Contacto'),
('contacto_direccion', 'DirecciÛn', 'C/ Ejemplo, 123<br>29001 M·laga, EspaÒa'),
('contacto_telefono', 'TelÈfono', '+34 612 345 678'),
('contacto_email_valor', 'Email contacto', 'info@neuronasconchispa.es'),
('blog_titulo', 'TÌtulo Blog', 'Blog y Noticias'),
('blog_subtitulo', 'SubtÌtulo Blog', '⁄ltimas novedades sobre la ELA y nuestra asociaciÛn')
ON CONFLICT (block_key) DO NOTHING;
