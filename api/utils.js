const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'server', 'data.json');

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            admin: { password: 'ela2026', email: 'admin@neuronasconchispa.es' },
            users: [],
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
    return require('crypto').createHash('sha256').update(password).digest('hex');
}

function authenticate(req) {
    const token = req.headers.authorization;
    return token === 'Bearer admin-token';
}

module.exports = { readData, saveData, hashPassword, authenticate };
