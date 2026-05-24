# ABV Library

Sistema web de gestion para una libreria/biblioteca, desarrollado como proyecto de la materia **Base de Datos**. Permite administrar libros, empleados, clientes, proveedores, ventas y prestamos desde una interfaz tipo marketplace.

**Demo en produccion:** https://libreria-va.onrender.com

---

## Caracteristicas

- **Catalogo de libros** con busqueda local y consulta a la API de Open Library.
- **Gestion de ventas** con control de stock, registro de metodo de pago y sistema de puntos.
- **Sistema de prestamos** con fechas de vencimiento, devolucion y calculo automatico de multas.
- **Sistema de puntos** — los clientes acumulan 1 punto por cada $10 de compra y pueden canjearlos por descuentos (10 puntos = $1).
- **Donaciones de libros** — los clientes pueden donar libros a cambio de 20 puntos o intercambiar por otro libro donado.
- **Libros favoritos** — los clientes pueden guardar libros favoritos (locales y de Open Library).
- **Recomendaciones personalizadas** basadas en favoritos, compras y prestamos del cliente.
- **Importacion masiva** desde Open Library al catalogo local.
- **Administracion de empleados y clientes** con roles diferenciados.
- **Autenticacion segura** con bcrypt (hash de contrasenas).
- **Validacion de correo electronico** en todos los formularios.
- **Tres roles de acceso:**
  - **Administrador** — gestiona libros, empleados, clientes y proveedores.
  - **Bibliotecario** — registra ventas, prestamos, donaciones y consulta historial/facturas.
  - **Cliente** — consulta el catalogo, ve sus puntos, favoritos, prestamos y recomendaciones.

---

## Tecnologias

| Capa | Tecnologia |
|------|-----------|
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Autenticacion | bcrypt |
| API externa | Open Library API |
| Hosting | Render (web service + PostgreSQL) |

---

## Estructura del proyecto

```
Libreria_va/
├── bd/                              # Scripts SQL y seeds
│   ├── abv_library.sql
│   ├── migration_add_password.sql
│   ├── migration_favoritos.sql
│   ├── migration_puntos.sql
│   ├── migration_donaciones.sql
│   ├── migration_precio_libro.sql
│   ├── seed_libros.sql
│   ├── seed_1000_libros.js
│   ├── seed_10000_libros.js
│   └── seed_stock.js
├── public/                          # Frontend (archivos estaticos)
│   ├── index.html                   # Pagina principal con catalogo
│   ├── principal.css                # Estilos globales
│   ├── index.css                    # Estilos del index
│   ├── img/
│   ├── admin/                       # Panel de administrador
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── libros.html
│   │   ├── empleados.html
│   │   ├── clientes.html
│   │   └── proveedores.html
│   ├── bibliotecario/               # Panel de bibliotecario
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── ventas.html
│   │   ├── prestamos.html
│   │   ├── donaciones.html
│   │   ├── historial.html
│   │   ├── historial-prestamos.html
│   │   └── facturas.html
│   └── cliente/                     # Vista de cliente
│       ├── cliente.html
│       └── registro.html
├── src/
│   ├── index.js                     # Servidor Express (API REST)
│   └── db.js                        # Conexion a PostgreSQL
├── .env                             # Variables de entorno (no subir)
├── .gitignore
├── package.json
└── README.md
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) (local o remoto)

---

## Instalacion y ejecucion local

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

Crear un archivo `.env` en la raiz con:

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

Ejecutar las migraciones en PostgreSQL:

```bash
psql -d tu_bd -f bd/migration_add_password.sql
psql -d tu_bd -f bd/migration_favoritos.sql
psql -d tu_bd -f bd/migration_puntos.sql
psql -d tu_bd -f bd/migration_donaciones.sql
psql -d tu_bd -f bd/migration_precio_libro.sql
psql -d tu_bd -f bd/seed_libros.sql
```

5. **Poblar con libros (opcional):**

```bash
node bd/seed_10000_libros.js
node bd/seed_stock.js
```

6. **Iniciar el servidor:**

```bash
npm start
```

El servidor se levanta en `http://localhost:3000` (o el puerto definido en el entorno).

---

## Endpoints de la API

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/login-admin` | Login del administrador |
| POST | `/login-vendedor` | Login de bibliotecario/empleado |
| POST | `/login-cliente` | Login de cliente |
| POST | `/registro-cliente` | Registro publico de cliente |
| PUT | `/usuarios/:correo/password` | Cambiar contrasena |

### Libros

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/libros?buscar=texto` | Buscar libros locales |
| POST | `/libros` | Agregar libro |
| PUT | `/libros/:isbn` | Actualizar libro |
| DELETE | `/libros/:isbn` | Eliminar libro |
| GET | `/api/libros-externos?buscar=texto` | Buscar en Open Library |
| POST | `/libros/importar-openlibrary` | Importar libros desde Open Library |

### Empleados

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/empleados` | Listar empleados |
| POST | `/empleados` | Agregar empleado |
| PUT | `/empleados/:correo` | Actualizar empleado |
| DELETE | `/empleados/:correo` | Eliminar empleado |

### Clientes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/clientes` | Listar clientes |
| POST | `/clientes` | Agregar cliente |
| PUT | `/clientes/:correo` | Actualizar cliente |
| DELETE | `/clientes/:correo` | Eliminar cliente |

### Ventas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/ventas` | Listar ventas |
| POST | `/ventas` | Registrar venta (con puntos y canje opcional) |

### Prestamos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/prestamos` | Listar prestamos |
| POST | `/prestamos` | Registrar prestamo |
| PUT | `/prestamos/:id/devolver` | Devolver prestamo |
| GET | `/prestamos/cliente/:correo` | Prestamos de un cliente |

### Puntos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/puntos/:correo` | Consultar puntos del cliente |
| GET | `/puntos/:correo/historial` | Historial de puntos ganados |
| POST | `/puntos/canjear` | Canjear puntos por descuento |

### Favoritos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/favoritos/:correo` | Listar favoritos del cliente |
| POST | `/favoritos` | Agregar libro a favoritos |
| DELETE | `/favoritos/:correo/:isbn` | Quitar de favoritos |

### Donaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/donaciones` | Registrar donacion (puntos o intercambio) |
| GET | `/donaciones/:correo` | Historial de donaciones del cliente |
| GET | `/donaciones/libros-disponibles` | Libros donados disponibles para intercambio |

### Recomendaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/recomendaciones/:correo` | Recomendaciones personalizadas |
| GET | `/recomendaciones` | Recomendaciones generales |

### Otros

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/proveedores` | Listar proveedores |
| POST | `/proveedores` | Agregar proveedor |
| GET | `/facturas?fecha_inicio=...&fecha_fin=...` | Reporte de facturas |

---

## Base de datos

Tablas principales:

- **persona** — datos personales (correo, nombre, apellidos, telefono, contrasena hash)
- **empleado** — relacion con persona + rol (Vendedor, Bibliotecario, Administrador, Dueno)
- **cliente** — relacion con persona + fecha de registro + puntos
- **libro** — catalogo (ISBN, titulo, autor, editorial, version, ano, precio)
- **proveedor** — proveedores de libros
- **venta** — registro de ventas (fecha, total, metodo de pago, vendedor)
- **lib_venta** — libros vendidos / stock para venta
- **prestamo** — prestamos (fechas, multa, cliente, empleado)
- **lib_pres** — libros prestados / stock para prestamo
- **libro_favorito** — libros favoritos de cada cliente
- **historial_puntos** — registro de puntos ganados por compra
- **donacion** — registro de libros donados por clientes

---

## Dependencias

| Paquete | Uso |
|---------|-----|
| express | Servidor web y API REST |
| pg | Cliente PostgreSQL |
| bcrypt | Hash de contrasenas |
| dotenv | Variables de entorno |
| cors | Cross-Origin Resource Sharing |
| axios | Consultas a API externa (Open Library) |

---

## Autor

Desarrollado por **Abel God** como proyecto academico de Base de Datos.

---

## Licencia

ISC
