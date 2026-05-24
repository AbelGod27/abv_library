# 📚 ABV Library

Sistema web de gestión para una librería/biblioteca, desarrollado como proyecto de la materia **Base de Datos**. Permite administrar libros, empleados, clientes, proveedores, ventas y préstamos desde una interfaz tipo marketplace.

🔗 **Demo en producción:** https://libreria-va.onrender.com

---

## Características

- **Catálogo de libros** con búsqueda local y consulta a la API de Open Library.
- **Gestión de ventas** con control de stock y registro de método de pago.
- **Sistema de préstamos** con fechas de vencimiento, devolución y cálculo automático de multas.
- **Administración de empleados y clientes** con roles diferenciados.
- **Autenticación segura** con bcrypt (hash de contraseñas).
- **Tres roles de acceso:**
  - **Administrador** — gestiona libros, empleados, clientes y proveedores.
  - **Bibliotecario** — registra ventas, préstamos y consulta historial/facturas.
  - **Cliente** — consulta el catálogo de libros disponibles.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Autenticación | bcrypt |
| API externa | Open Library API |
| Hosting | Render (web service + PostgreSQL) |

---

## Estructura del proyecto

```
Libreria_va/
├── bd/                          # Scripts SQL
│   ├── abv_library.sql          # Consultas de la BD
│   ├── migration_add_password.sql # Migración para contraseñas
│   └── seed_libros.sql          # Seed con 100 libros reales
├── public/                      # Frontend (archivos estáticos)
│   ├── index.html               # Página principal (marketplace)
│   ├── principal.css            # Estilos globales
│   ├── index.css                # Estilos del index
│   ├── img/                     # Imágenes
│   ├── admin/                   # Panel de administrador
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── libros.html
│   │   ├── empleados.html
│   │   ├── clientes.html
│   │   └── proveedores.html
│   ├── bibliotecario/           # Panel de bibliotecario
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── ventas.html
│   │   ├── prestamos.html
│   │   ├── historial.html
│   │   ├── historial-prestamos.html
│   │   └── facturas.html
│   └── cliente/                 # Vista de cliente
│       └── cliente.html
├── src/
│   ├── index.js                 # Servidor Express (API REST)
│   └── db.js                    # Conexión a PostgreSQL
├── .env                         # Variables de entorno (no subir)
├── .gitignore
├── package.json
└── README.md
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) (local o remoto)

---

## Instalación y ejecución local

1. **Clonar el repositorio:**

```bash
git clone https://github.com/AbelGod27/Libreria_va.git
cd Libreria_va
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

Crear un archivo `.env` en la raíz con:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd
ADMIN_PASSWORD=tu_contraseña_admin
ADMIN_PASSWORD_HASH=$2b$10$...hash_bcrypt_de_la_contraseña...
```

Para generar el hash del admin:

```bash
node -e "require('bcrypt').hash('TuContraseña', 10).then(console.log)"
```

4. **Configurar la base de datos:**

Ejecutar las migraciones y seed en PostgreSQL:

```bash
psql -d tu_bd -f bd/migration_add_password.sql
psql -d tu_bd -f bd/seed_libros.sql
```

5. **Iniciar el servidor:**

```bash
npm start
```

El servidor se levanta en `http://localhost:3000` (o el puerto definido en el entorno).

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login-admin` | Login del administrador |
| POST | `/login-vendedor` | Login de bibliotecario/empleado |
| POST | `/login-cliente` | Login de cliente |
| PUT | `/usuarios/:correo/password` | Cambiar contraseña |

### Libros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/libros?buscar=texto` | Buscar libros locales |
| POST | `/libros` | Agregar libro |
| GET | `/api/libros-externos?buscar=texto` | Buscar en Open Library |

### Empleados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/empleados` | Listar empleados |
| POST | `/empleados` | Agregar empleado |
| PUT | `/empleados/:correo` | Actualizar empleado |
| DELETE | `/empleados/:correo` | Eliminar empleado |

### Ventas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/ventas` | Listar ventas |
| POST | `/ventas` | Registrar venta |

### Préstamos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/prestamos` | Listar préstamos |
| POST | `/prestamos` | Registrar préstamo |
| PUT | `/prestamos/:id/devolver` | Devolver préstamo |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/proveedores` | Listar proveedores |
| POST | `/proveedores` | Agregar proveedor |
| GET | `/facturas?fecha_inicio=...&fecha_fin=...` | Reporte de facturas |

---

## Base de datos

Tablas principales:

- **persona** — datos personales (correo, nombre, apellidos, teléfono, contraseña hash)
- **empleado** — relación con persona + rol (Vendedor, Bibliotecario, Administrador, Dueño)
- **cliente** — relación con persona + fecha de registro
- **libro** — catálogo (ISBN, título, autor, editorial, versión, año)
- **proveedor** — proveedores de libros
- **venta** — registro de ventas (fecha, total, método de pago, vendedor)
- **lib_venta** — libros vendidos (cantidad, ISBN, id_venta)
- **prestamo** — préstamos (fechas, multa, cliente, empleado)
- **lib_pres** — libros prestados (cantidad, ISBN, id_prestamo)

---

## Dependencias

| Paquete | Uso |
|---------|-----|
| express | Servidor web y API REST |
| pg | Cliente PostgreSQL |
| bcrypt | Hash de contraseñas |
| dotenv | Variables de entorno |
| cors | Cross-Origin Resource Sharing |
| axios | Consultas a API externa (Open Library) |

---

## Autor

Desarrollado por **Abel God** como proyecto académico de Base de Datos.

---

## Licencia

ISC
