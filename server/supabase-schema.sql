-- ============================================================
-- Neuronas con Chispa - Supabase Schema
-- Run this SQL in the Supabase SQL Editor after creating your project
-- ============================================================

-- Admin table
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL DEFAULT 'ela2026',
  email TEXT NOT NULL DEFAULT 'neuronasconchispa@gmail.com'
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
INSERT INTO admin (password, email) VALUES ('ela2026', 'neuronasconchispa@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, category, price, image, badge, active) VALUES
(1, 'V Torneo de Pádel Benéfico', 'Eventos', 10, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 'Evento', true),
(2, 'Calendario Solidario 2026', 'Calendarios', 10, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400', 'Nuevo', true),
(3, 'Monedero Solidario', 'Accesorios', 5, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', null, true),
(4, 'Pulsera ELA', 'Accesorios', 3, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', null, true),
(5, 'Botella Térmica', 'Accesorios', 15, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 'Popular', true),
(6, 'Lápiz Motoneurona', 'Oficina', 3, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', null, true),
(7, 'Labial Solidario', 'Cosmética', 3, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', null, true),
(8, 'Bolsa Mochila', 'Bolsas', 10, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', null, true),
(9, 'Tote Bag', 'Bolsas', 10, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400', null, true),
(10, 'Neceser', 'Accesorios', 8, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', null, true),
(11, 'Camiseta Los 3 MosquetELAeros', 'Ropa', 16, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Bestseller', true),
(12, 'Colabora', 'Donación', 10, 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400', null, true)
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
(1, 'Nuevo ensayo clínico ofrece esperanza para pacientes con ELA', 'investigacion', 'Investigación', '8 Abril 2026', 'Dr. María García', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'Un nuevo ensayo clínico fase 3 muestra resultados prometedores en la ralentización de la progresión de la enfermedad.', '<p>Un nuevo ensayo clínico de fase 3 ha mostrado resultados prometedores...</p>', true, true),
(2, 'V Torneo de Pádel Benéfico: Récord de participación', 'eventos', 'Eventos', '5 Abril 2026', 'Ana Martínez', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'Más de 200 jugadores se dieron cita en el torneo.', '<p>El V Torneo de Pádel Benéfico...</p>', false, true),
(3, 'Guía para familiares: Cómo comunicarse con pacientes de ELA', 'familias', 'Familias', '2 Abril 2026', 'Lucía Sánchez', 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800', 'Consejos prácticos de logopedas y psicólogos.', '<p>La comunicación es fundamental...</p>', false, true),
(4, 'Concienciación: ¿Por qué necesitamos más investigación?', 'sensibilizacion', 'Sensibilización', '30 Marzo 2026', 'Carlos Rodríguez', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', 'Cada año se diagnostican 900 nuevos casos en España.', '<p>La ELA afecta a más de 4.000 personas...</p>', false, true),
(5, 'Nuevas tecnologías para mejorar la calidad de vida', 'familias', 'Familias', '25 Marzo 2026', 'Pedro Jiménez', 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800', 'Sistemas de comunicación alternativa y control por ojos.', '<p>Los avances tecnológicos están revolucionando...</p>', false, true),
(6, 'Investigadores españoles logran un hito histórico', 'investigacion', 'Investigación', '20 Marzo 2026', 'Dra. Carmen Ruiz', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', 'Un equipo español identifica nuevos biomarcadores.', '<p>Investigadores del CSIC...</p>', false, true),
(7, 'Charla ''Rendirse no es una opción'' a cargo de Adrián Fernández', 'eventos', 'Eventos', '10 de mayo de 2026', 'Neuronas con Chispa', '/images/blog_ayto_29_May.webp', 'El próximo 29 de mayo, Adrián Fernández compartirá en Cártama su historia de superación frente a la ELA. Entrada libre.', '<p>La Tenencia de Alcaldía de Estación de Cártama albergará la charla ''Rendirse no es una opción'', a cargo del joven cartameño <strong>Adrián Fernández</strong>.</p><p>La charla tendrá lugar el <strong>próximo día 29 de mayo, a las 19.00 horas</strong>, y la entrada es libre hasta completar el aforo.</p>', false, true),
(8, 'El Código Postal no puede decidir sobre nuestra vida: La desigualdad en la aplicación de la Ley ELA', 'investigacion', 'Investigación', '10 de mayo de 2026', 'Neuronas con Chispa', '/images/Anciano_silla.webp', 'A un año y medio de la aprobación de la Ley ELA, el acceso a las ayudas sigue dependiendo del código postal.', '<p>Ha pasado un año y medio desde que la <strong>Ley ELA</strong> fuera aprobada.</p><p>La aplicación de esta ley avanza a distintas velocidades.</p>', false, true)
ON CONFLICT (id) DO NOTHING;


-- Content blocks (editable page content)
CREATE TABLE IF NOT EXISTS content_blocks (
  block_key TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO content_blocks (block_key, title, content) VALUES
('hero_title', 'T�tulo del Hero', 'Neuronas con Chispa'),
('hero_tagline', 'Subt�tulo del Hero', 'Asociaci�n para la investigaci�n de la ELA'),
('hero_text', 'Texto del Hero', 'Juntos podemos hacer la diferencia. Cada donaci�n nos acerca a un futuro sin ELA.'),
('quienes_somos_titulo', 'T�tulo Qui�nes Somos', 'Qui�nes Somos'),
('quienes_somos_p1', 'Qui�nes Somos p�rrafo 1', 'Neuronas con Chispa es una asociaci�n sin �nimo de lucro dedicada a mejorar la calidad de vida de las personas afectadas por la Esclerosis Lateral Amiotr�fica (ELA) y sus familias.'),
('quienes_somos_p2', 'Qui�nes Somos p�rrafo 2', 'Nuestro objetivo principal es fomentar la investigaci�n cient�fica para encontrar una cura definitiva, mientras acompa�amos y apoyamos a los afectados en su d�a a d�a.'),
('que_es_ela_titulo', 'T�tulo �Qu� es la ELA?', '�Qu� es la ELA?'),
('que_es_ela_texto', 'Texto �Qu� es la ELA?', '<p>La <strong>Esclerosis Lateral Amiotr�fica (ELA)</strong> es una enfermedad neurodegenerativa que afecta a las neuronas motoras del cerebro y de la m�dula espinal.</p><p>Esto provoca que las neuronas dejen de funcionar correctamente y, con el tiempo, mueren. Como resultado, los m�sculos se debilitan gradualmente, afectando a:</p>'),
('que_es_ela_lista', 'Lista s�ntomas ELA', '<li><i class=\"fas fa-check\"></i> La capacidad de caminar, hablar y moverte</li><li><i class=\"fas fa-check\"></i> La respiraci�n y degluci�n</li><li><i class=\"fas fa-check\"></i> La comunicaci�n verbal y gestual</li>'),
('ela_fact_1', 'Hecho ELA 1', '{\"number\":\"4.000+\",\"label\":\"Personas con ELA en Espa�a\"}'),
('ela_fact_2', 'Hecho ELA 2', '{\"number\":\"900\",\"label\":\"Nuevos casos al a�o\"}'),
('ela_fact_3', 'Hecho ELA 3', '{\"number\":\"35.000-60.000�\",\"label\":\"Coste anual por paciente\"}'),
('tienda_titulo', 'T�tulo Tienda', 'Tienda Solidaria'),
('tienda_subtitulo', 'Subt�tulo Tienda', 'Cada compra ayuda a financiar investigaci�n y apoyo a familias'),
('donar_titulo', 'T�tulo Donar', 'Haz tu Donaci�n'),
('donar_subtitulo', 'Subt�tulo Donar', 'Tu aportaci�n marca la diferencia'),
('donar_impacto_5', 'Mensaje impacto 5�', '5� = Ayudas a mantener nuestra web y redes sociales'),
('colaborador_titulo', 'T�tulo Colaborador', 'Hazte Colaborador'),
('colaborador_texto', 'Texto Colaborador', 'Convi�rtete en colaborador mensual y apoya la investigaci�n de la ELA.'),
('colaborador_impacto', 'Impacto Colaborador', '5�/mes = Ayuda constante para la investigaci�n'),
('contacto_titulo', 'T�tulo Contacto', 'Contacto'),
('contacto_direccion', 'Direcci�n', 'C/ Ejemplo, 123<br>29001 M�laga, Espa�a'),
('contacto_telefono', 'Tel�fono', '+34 612 345 678'),
('contacto_email_valor', 'Email contacto', 'info@neuronasconchispa.es'),
('blog_titulo', 'T�tulo Blog', 'Blog y Noticias'),
('blog_subtitulo', 'Subt�tulo Blog', '�ltimas novedades sobre la ELA y nuestra asociaci�n')
ON CONFLICT (block_key) DO NOTHING;
