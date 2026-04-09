# Neuronas con Chispa - Web para ELA

## Descripción
Web completa para una asociación sin ánimo de lucro dedicada a la investigación de la ELA (Esclerosis Lateral Amiotrófica).

## Estructura del proyecto
```
ela-web/
├── public/              # Frontend (HTML, CSS, JS)
│   ├── index.html      # Página principal
│   ├── admin.html      # Panel de administración
│   ├── css/styles.css  # Estilos
│   └── js/app.js       # JavaScript
├── server/             # Backend
│   ├── server.js       # API REST
│   ├── package.json    # Dependencias
│   └── data.json       # Base de datos (se crea automáticamente)
└── README.md
```

## Instalación local

### 1. Backend
```bash
cd ela-web/server
npm install
npm start
```
El servidor estará en http://localhost:3000

### 2. Abrir la web
- Página principal: http://localhost:3000
- Panel de admin: http://localhost:3000/admin.html

### Contraseña inicial del admin
```
ela2026
```

## Funcionalidades

### Página pública
- Inicio con estadísticas animadas
- Quiénes Somos
- Información sobre la ELA
- Tienda Solidaria con carrito
- Blog con filtros
- Donaciones (PayPal/Bizum)
- Formulario de contacto

### Panel de administración
- Gestionar productos (crear, editar, eliminar)
- Gestionar artículos del blog
- Configurar estadísticas, PayPal y Bizum
- Ver pedidos recibidos
- Cambiar contraseña

## Despliegue en Railway (gratis)

### 1. Crear cuenta en Railway
- Ir a https://railway.app
- Conectar con GitHub

### 2. Subir el proyecto a GitHub
```bash
cd ela-web
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/ela-web.git
git push -u origin main
```

### 3. Desplegar en Railway
1. Ir a Railway → New Project → Deploy from GitHub
2. Seleccionar el repositorio
3. Railway detectará Node.js automáticamente
4. Configurar el directorio de inicio: `server`
5. Click en Deploy

### 4. Configurar dominio (opcional)
En Railway → Settings → Networking → Generate Domain

## Alternativa: Desplegar solo el frontend

Si solo quieres el frontend estático (sin panel de admin editable):

### Netlify
1. Ir a https://netlify.com
2. Arrastrar la carpeta `public` a Netlify
3. La web estará disponible en netlify.app

**Nota:** El contenido no se podrá editar sin redeploy.

## Configuración

### Cambiar contraseña del admin
1. Acceder a /admin.html
2. Ir a Configuración → Cambiar Contraseña
3. Introducir nueva contraseña

### Configurar PayPal
1. Acceder a /admin.html
2. Ir a Configuración
3. Introducir email de PayPal para recibir pagos

### Configurar Bizum
1. Acceder a /admin.html
2. Ir a Configuración
3. Introducir número de teléfono para Bizum

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/login | Iniciar sesión admin |
| GET | /api/products | Listar productos |
| GET | /api/blog | Listar artículos |
| GET | /api/config | Obtener configuración |
| POST | /api/orders | Registrar pedido |

### Endpoints Admin (requieren token)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/admin/products | Listar productos |
| POST | /api/admin/products | Crear/editar producto |
| DELETE | /api/admin/products/:id | Eliminar producto |
| GET | /api/admin/blog | Listar artículos |
| POST | /api/admin/blog | Crear/editar artículo |
| DELETE | /api/admin/blog/:id | Eliminar artículo |
| GET | /api/admin/orders | Listar pedidos |
| GET | /api/admin/config | Obtener config |
| POST | /api/admin/config | Guardar config |
| POST | /api/admin/change-password | Cambiar contraseña |

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js, Express
- **Base de datos**: JSON (archivo local)
- **Estilos**: CSS personalizado con variables
- **Iconos**: Font Awesome
- **Tipografía**: Google Fonts (Poppins)

## Próximos pasos recomendados

1. Configurar email real de PayPal
2. Personalizar imágenes y textos
3. Añadir certificado SSL (HTTPS)
4. Configurar formulario de contacto real (EmailJS, Formspree, etc.)
5. Implementar Google Analytics
6. SEO y meta tags

## Soporte

Para cualquier duda sobre el código, contactar con el desarrollador.
