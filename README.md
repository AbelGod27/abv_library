# ABV Library

Sistema web completo de gestión para una librería/biblioteca, desarrollado como proyecto de la materia **Base de Datos**. Permite administrar libros, empleados, clientes, proveedores, ventas, préstamos y donaciones desde una interfaz moderna tipo marketplace.

**Demo en producción:** https://libreria-va.onrender.com

---

## Características principales

### Catálogo y búsqueda
- Catálogo de libros con búsqueda en tiempo real (debounce 300ms)
- Integración con API de Open Library para buscar libros externos en español
- Switch Local/Global para alternar entre base de datos propia y Open Library
- Portadas de libros obtenidas automáticamente por ISBN

### Sistema de ventas (carrito)
- Carrito multi-libro: el bibliotecario puede agregar varios libros a una sola venta
- Búsqueda inteligente de libros con autocompletado (sin dropdown gigante)
- Control de stock automático (descuenta al vender)
- Cálculo de total en tiempo real
- Asociación opcional de cliente para acumular puntos

### Sistema de préstamos
- Registro de préstamos con fecha de vencimiento
- Devolución con cálculo automático de multas ($10 por día de retraso)
- Estados dinámicos: Activo, Por vencer, Vencido, Devuelto
- Alertas visuales al cliente cuando tiene préstamos por vencer

### Sistema de puntos (fidelización)
- Acumulación: 1 punto por cada $10 de compra
- Canje: 10 puntos = $1 de descuento en la siguiente compra
- Historial completo de puntos ganados y canjeados
- Visible para el cliente en su panel personal

### Donaciones de libros
- Los clientes pueden donar libros a la biblioteca
- Dos opciones de recompensa: 20 puntos por libro O intercambio por otro libro donado
- Los libros donados se agregan automáticamente al stock

### Proveedores y recepción de paquetes
- CRUD completo de proveedores
- Asignación de qué libros suministra cada proveedor (relación N:M)
- Recepción de paquetes con distribución de stock (venta/préstamo)
- Costo del paquete registrado para reportes financieros
- Validación: solo se pueden recibir libros que el proveedor tiene asignados

### Facturas y reportes financieros
- Reporte por rango de fechas con tres secciones:
  - Ingresos por ventas (+)
  - Ingresos por multas (+)
  - Egresos por recepciones de proveedores (-)
- Balance neto calculado automáticamente (verde si positivo, rojo si negativo)

### Favoritos y recomendaciones
- Los clientes pueden marcar libros como favoritos (locales y de Open Library)
- Botón de corazón en catálogo, tabla de búsqueda y recomendaciones
- Recomendaciones personalizadas basadas en autores de favoritos, compras y préstamos
- Si no hay datos suficientes, muestra libros aleatorios del catálogo

### Autenticación y seguridad
- Login unificado: un solo formulario que detecta roles y permite elegir panel
- Contraseñas hasheadas con bcrypt (10 salt rounds, nunca texto plano)
- Contraseña temporal para empleados nuevos (nombre+1234) con cambio obligatorio en primer login
- Validación de formato de correo electrónico en todos los formularios
- Sesión del cliente con expiración automática (7 días)
- Botón para ver/ocultar contraseña en todos los formularios de login

### Interfaz de usuario
- Diseño responsivo con CSS custom (sin frameworks pesados)
- Tres temas: Modo claro, Modo oscuro, Night shift (botón flotante)
- Iconos Bootstrap Icons (CDN)
- Mensajes toast flotantes (visibles sin importar el scroll)
- Paginación en tablas grandes (15 filas por página)
- Tablas colapsables en secciones secundarias
- Fuente Montserrat en toda la aplicación

### Roles de acceso
- **Administrador** — CRUD de libros, empleados, clientes, proveedores. Recepción de paquetes. Cambio de rol a bibliotecario.
- **Bibliotecario** — Ventas (carrito), préstamos, donaciones, historial, facturas. Cambio de rol a admin (si aplica).
- **Cliente** — Catálogo, favoritos, puntos, préstamos activos, donaciones, recomendaciones.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL (Render) |
| Frontend | HTML, CSS, JavaScript vanilla |
| Iconos | Bootstrap Icons 1.11 (CDN) |
| Fuente | Montserrat (Google Fonts) |
| Autenticación | bcrypt (10 salt rounds) |
| API externa | Open Library Search API |
| Hosting | Render (web service + PostgreSQL) |

---

## Estructura del proyecto

```
Libreria_va/
├── bd/
│   ├── abv_library.sql           # Esquema completo (13 tablas + índices)
│   ├── seed_libros.sql           # 127 libros reales con ISBN
│   └── seed_libros_extra.sql     # 39 libros adicionales
├── public/
│   ├── index.html                # Página principal (catálogo + búsqueda)
│   ├── login.html                # Login unificado con selección de rol
│   ├── cambiar-password.html     # Cambio obligatorio de contraseña
│   ├── principal.css             # Design system (variables, temas, componentes)
│   ├── index.css                 # Estilos del catálogo
│   ├── theme.js                  # Lógica de cambio de tema (claro/oscuro/night)
│   ├── img/
│   ├── admin/
│   │   ├── login.html            # Login admin (contraseña maestra)
│   │   ├── panel.html            # Panel con módulos
│   │   ├── libros.html           # CRUD libros + stock + importación
│   │   ├── empleados.html        # CRUD empleados + contraseña
│   │   ├── clientes.html         # CRUD clientes + contraseña
│   │   └── proveedores.html      # CRUD + suministro + recepción
│   ├── bibliotecario/
│   │   ├── login.html            # Login empleado
│   │   ├── panel.html            # Panel con módulos
│   │   ├── ventas.html           # Carrito multi-libro
│   │   ├── prestamos.html        # Registro de préstamos
│   │   ├── donaciones.html       # Registro de donaciones
│   │   ├── historial.html        # Historial de ventas
│   │   ├── historial-prestamos.html  # Historial + devolución
│   │   └── facturas.html         # Reportes financieros
│   └── cliente/
│       ├── cliente.html          # Portal completo del cliente
│       └── registro.html         # Auto-registro público
├── src/
│   ├── index.js                  # Servidor Express (~2800 líneas, comentado)
│   └── db.js                     # Pool de conexión PostgreSQL
├── .env                          # Variables de entorno (no se sube)
├── .gitignore
├── package.json
└── README.md
```

---

## Instalación y ejecución local

### Requisitos
- Node.js v18+
- PostgreSQL (local o remoto)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/AbelGod27/Libreria_va.git
cd Libreria_va

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env con:
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd
ADMIN_PASSWORD=tu_contraseña_admin
ADMIN_PASSWORD_HASH=$2b$10$...hash_bcrypt...

# 4. Crear tablas en la base de datos
psql -d tu_bd -f bd/abv_library.sql

# 5. (Opcional) Poblar con libros de ejemplo
psql -d tu_bd -f bd/seed_libros.sql
psql -d tu_bd -f bd/seed_libros_extra.sql

# 6. Iniciar servidor
npm start
# Servidor en http://localhost:3000
```

### Generar hash para contraseña del admin

```bash
node -e "require('bcrypt').hash('TuContraseña', 10).then(console.log)"
```

Copia el resultado y pégalo en `ADMIN_PASSWORD_HASH` del `.env`.

---

## Seguridad: Hasheo con bcrypt

El sistema nunca almacena contraseñas en texto plano.

**Proceso de registro:**
1. El usuario ingresa su contraseña
2. bcrypt genera un salt aleatorio (único por usuario)
3. Aplica 10 rondas de cifrado (2^10 = 1024 iteraciones)
4. Almacena el hash resultante (60 caracteres)

**Proceso de login:**
1. El usuario ingresa su contraseña
2. bcrypt compara contra el hash almacenado
3. No necesita descifrar (comparación de una vía)

**Estructura del hash:**
```
$2b$10$ID8ndfLLHbTeTr8PzDew0u50U4MY7Psdb6Yi8aYVwzfbPHWkuKpnG
 │   │  └── salt + hash combinados (53 caracteres)
 │   └── salt rounds (factor de costo)
 └── versión del algoritmo
```

**Ventajas sobre SHA-256:**
- Deliberadamente lento (configurable), dificulta fuerza bruta
- Salt automático por cada hash (protege contra tablas rainbow)
- Estándar de la industria para contraseñas web

---

## Base de datos (13 tablas)

| Tabla | Descripción |
|-------|-------------|
| persona | Datos personales + contraseña hash + flag cambio obligatorio |
| empleado | Rol (Vendedor, Bibliotecario, Administrador, Dueño) |
| cliente | Fecha registro + puntos acumulados |
| libro | Catálogo (ISBN, título, autor, editorial, versión, año, precio) |
| proveedor | Nombre del proveedor |
| prov_suministra_lib | Relación N:M proveedor-libro |
| recepcion_paquete | Historial de paquetes recibidos + costo |
| venta | Registro de ventas (fecha, total, método, vendedor) |
| lib_venta | Stock para venta + detalle de libros vendidos |
| prestamo | Préstamos (fechas, multa, cliente, empleado) |
| lib_pres | Stock para préstamo + detalle de libros prestados |
| libro_favorito | Favoritos de cada cliente (correo + isbn) |
| historial_puntos | Puntos ganados por compra |
| donacion | Libros donados por clientes |

---

## Endpoints de la API (40+)

### Autenticación (6)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Login unificado (detecta roles) |
| POST | `/login-admin` | Login admin (contraseña maestra) |
| POST | `/login-vendedor` | Login empleado |
| POST | `/login-cliente` | Login cliente |
| POST | `/registro-cliente` | Auto-registro público |
| PUT | `/usuarios/:correo/password` | Cambiar contraseña |

### Libros (6)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/libros?buscar=texto` | Buscar libros locales (LIMIT 50) |
| POST | `/libros` | Agregar libro |
| PUT | `/libros/:isbn` | Actualizar libro |
| DELETE | `/libros/:isbn` | Eliminar libro |
| GET | `/api/libros-externos?buscar=texto` | Buscar en Open Library |
| POST | `/libros/importar-openlibrary` | Importar masivo |

### Stock (1)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/stock` | Stock de venta y préstamo por libro |

### Proveedores (8)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/proveedores` | Listar |
| POST | `/proveedores` | Agregar |
| PUT | `/proveedores/:id` | Actualizar |
| DELETE | `/proveedores/:id` | Eliminar |
| GET | `/proveedores-libros` | Relaciones proveedor-libro |
| POST | `/proveedores-libros` | Asignar libro a proveedor |
| GET | `/proveedores/:id/libros` | Libros de un proveedor |
| POST | `/proveedores/recibir-paquete` | Recibir paquete (stock + costo) |

### Empleados (4)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/empleados` | Listar |
| POST | `/empleados` | Agregar (contraseña temporal) |
| PUT | `/empleados/:correo` | Actualizar |
| DELETE | `/empleados/:correo` | Eliminar |

### Clientes (4)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/clientes` | Listar |
| POST | `/clientes` | Agregar (password opcional) |
| PUT | `/clientes/:correo` | Actualizar |
| DELETE | `/clientes/:correo` | Eliminar |

### Ventas (2)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/ventas` | Historial |
| POST | `/ventas` | Registrar (con puntos y canje) |

### Préstamos (4)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/prestamos` | Historial general |
| POST | `/prestamos` | Registrar |
| PUT | `/prestamos/:id/devolver` | Devolver (calcula multa) |
| GET | `/prestamos/cliente/:correo` | Préstamos de un cliente |

### Puntos (3)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/puntos/:correo` | Saldo actual |
| GET | `/puntos/:correo/historial` | Historial de puntos |
| POST | `/puntos/canjear` | Canjear por descuento |

### Favoritos (3)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/favoritos/:correo` | Listar favoritos |
| POST | `/favoritos` | Agregar |
| DELETE | `/favoritos/:correo/:isbn` | Quitar |

### Donaciones (3)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/donaciones` | Registrar (puntos o intercambio) |
| GET | `/donaciones/:correo` | Historial del cliente |
| GET | `/donaciones/libros-disponibles` | Libros para intercambio |

### Recomendaciones (2)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/recomendaciones/:correo` | Personalizadas |
| GET | `/recomendaciones` | Generales (aleatorias) |

### Facturas (1)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/facturas?fecha_inicio=...&fecha_fin=...` | Reporte financiero |

---

## Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| express | ^5.2.1 | Servidor web y API REST |
| pg | ^8.21.0 | Cliente PostgreSQL |
| bcrypt | ^6.0.0 | Hash de contraseñas |
| dotenv | ^17.4.2 | Variables de entorno |
| cors | ^2.8.6 | Cross-Origin Resource Sharing |
| axios | ^1.16.1 | Peticiones HTTP (Open Library) |

---

## Capturas de pantalla

| Vista | Descripción |
|-------|-------------|
| ![Catálogo](docs/01-catalogo.png) | Página principal con catálogo de libros |
| ![Modo oscuro](docs/02-modo-oscuro.png) | Catálogo en modo oscuro |
| ![Login](docs/03-login.png) | Login unificado con selección de rol |
| ![Admin panel](docs/04-admin-panel.png) | Panel del administrador |
| ![Libros stock](docs/05-libros-stock.png) | Gestión de libros con stock |
| ![Bibliotecario](docs/06-bibliotecario-panel.png) | Panel del bibliotecario |
| ![Carrito](docs/07-carrito-ventas.png) | Carrito de ventas multi-libro |
| ![Cliente](docs/08-portal-cliente.png) | Portal del cliente (puntos, favoritos) |
| ![Facturas](docs/09-facturas.png) | Reporte de facturas con balance |
| ![Proveedores](docs/10-proveedores.png) | Recepción de paquetes |

---

## Autor

Desarrollado por **Abel Pineda** y **Vanya Castillo** como proyecto académico de Base de Datos.

---

## Licencia

ISC
