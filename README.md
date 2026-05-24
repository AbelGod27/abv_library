# ABV Library

Sistema web de gestion para una libreria/biblioteca, desarrollado como proyecto de la materia **Base de Datos**. Permite administrar libros, empleados, clientes, proveedores, ventas y prestamos desde una interfaz tipo marketplace.

**Demo en produccion:** https://libreria-va.onrender.com

---

## Caracteristicas

- **Catalogo de libros** con busqueda local y consulta a la API de Open Library (filtrado en español).
- **Gestion de ventas** con carrito multi-libro, control de stock y sistema de puntos.
- **Sistema de prestamos** con fechas de vencimiento, devolucion, calculo automatico de multas y alertas al cliente.
- **Sistema de puntos** — los clientes acumulan 1 punto por cada $10 de compra y pueden canjearlos por descuentos (10 puntos = $1).
- **Donaciones de libros** — los clientes pueden donar libros a cambio de 20 puntos o intercambiar por otro libro donado.
- **Libros favoritos** — los clientes pueden guardar libros favoritos (locales y de Open Library).
- **Recomendaciones personalizadas** basadas en favoritos, compras y prestamos del cliente.
- **Importacion masiva** desde Open Library al catalogo local.
- **Proveedores con suministro de libros** — relacion proveedor-libro para registrar que libros suministra cada proveedor.
- **Login unificado** — un solo formulario de login que detecta los roles del usuario y permite elegir como entrar.
- **CRUD completo** en todas las entidades del admin (libros, empleados, clientes, proveedores).
- **Busqueda inteligente** de libros en ventas, prestamos y asignacion de proveedores (autocompletado).
- **Autenticacion segura** con bcrypt (hash de contrasenas).
- **Validacion de correo electronico** en todos los formularios.
- **Iconos Bootstrap Icons** en toda la interfaz.
- **Tres roles de acceso:**
  - **Administrador** — gestiona libros, empleados, clientes, proveedores y sus relaciones (CRUD completo).
  - **Bibliotecario** — registra ventas (carrito), prestamos, donaciones y consulta historial/facturas.
  - **Cliente** — consulta el catalogo, ve sus puntos, favoritos, prestamos, donaciones y recomendaciones.

---

## Seguridad: Hasheo de contrasenas con bcrypt

El sistema nunca almacena contrasenas en texto plano. Se utiliza **bcrypt** para generar un hash seguro antes de guardar en la base de datos.

### Como funciona

1. **Registro/creacion de usuario:** cuando se crea un empleado o cliente con contrasena, el servidor ejecuta `bcrypt.hash(password, 10)` que genera un hash unico e irreversible. El numero 10 es el "salt rounds" (factor de costo) que determina cuantas iteraciones de cifrado se aplican.

2. **Login:** cuando el usuario ingresa su contrasena, el servidor ejecuta `bcrypt.compare(password, hash)` que compara la contrasena ingresada contra el hash almacenado sin necesidad de descifrar.

3. **Salt automatico:** bcrypt genera un salt aleatorio por cada hash, lo que significa que dos usuarios con la misma contrasena tendran hashes diferentes. Esto protege contra ataques de tablas rainbow.

4. **Admin:** la contrasena del administrador se almacena como hash en la variable de entorno `ADMIN_PASSWORD_HASH`.

### Ejemplo practico

```bash
# Generar un hash para una contrasena:
node -e "require('bcrypt').hash('MiContrasena123', 10).then(console.log)"
# Resultado: $2b$10$ID8ndfLLHbTeTr8PzDew0u50U4MY7Psdb6Yi8aYVwzfbPHWkuKpnG

# Estructura del hash:
# $2b$   -> version del algoritmo
# 10$    -> salt rounds (factor de costo)
# ID8... -> salt + hash combinados (60 caracteres)
```

### Por que bcrypt y no SHA-256 u otro

- bcrypt es **deliberadamente lento** (configurable con salt rounds), lo que dificulta ataques de fuerza bruta.
- Incluye salt automatico, no necesitas generarlo manualmente.
- Es el estandar de la industria para almacenar contrasenas en aplicaciones web.

---

## Tecnologias

| Capa | Tecnologia |
|------|-----------|
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Iconos | Bootstrap Icons (CDN) |
| Autenticacion | bcrypt |
| API externa | Open Library API |
| Hosting | Render (web service + PostgreSQL) |

---

## Estructura del proyecto

```
Libreria_va/
├── bd/
│   └── abv_library.sql              # Esquema completo de la BD
├── public/
│   ├── index.html                    # Pagina principal con catalogo
│   ├── login.html                    # Login unificado
│   ├── principal.css                 # Estilos globales
│   ├── index.css                     # Estilos del catalogo
│   ├── img/
│   ├── admin/
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── libros.html
│   │   ├── empleados.html
│   │   ├── clientes.html
│   │   └── proveedores.html
│   ├── bibliotecario/
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── ventas.html
│   │   ├── prestamos.html
│   │   ├── donaciones.html
│   │   ├── historial.html
│   │   ├── historial-prestamos.html
│   │   └── facturas.html
│   └── cliente/
│       ├── cliente.html
│       └── registro.html
├── src/
│   ├── index.js                      # Servidor Express (API REST)
│   └── db.js                         # Conexion a PostgreSQL
├── .env                              # Variables de entorno (no subir)
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
ADMIN_PASSWORD_HASH=$2b$10$...hash_bcrypt...
```

Para generar el hash del admin:

```bash
node -e "require('bcrypt').hash('TuContraseña', 10).then(console.log)"
```

Copia el resultado y pegalo en `ADMIN_PASSWORD_HASH`.

4. **Crear las tablas:**

Ejecutar el esquema en PostgreSQL:

```bash
psql -d tu_bd -f bd/abv_library.sql
```

5. **Iniciar el servidor:**

```bash
npm start
```

El servidor se levanta en `http://localhost:3000`.

---

## Endpoints de la API

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/login` | Login unificado (detecta roles) |
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
| GET | `/api/libros-externos?buscar=texto` | Buscar en Open Library (español) |
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
| POST | `/clientes` | Agregar cliente (password opcional) |
| PUT | `/clientes/:correo` | Actualizar cliente |
| DELETE | `/clientes/:correo` | Eliminar cliente |

### Proveedores

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/proveedores` | Listar proveedores |
| POST | `/proveedores` | Agregar proveedor |
| PUT | `/proveedores/:id` | Actualizar proveedor |
| DELETE | `/proveedores/:id` | Eliminar proveedor |
| GET | `/proveedores-libros` | Listar relaciones proveedor-libro |
| POST | `/proveedores-libros` | Asignar libro a proveedor |

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

### Facturas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/facturas?fecha_inicio=...&fecha_fin=...` | Reporte de facturas |

---

## Base de datos

Tablas (ver `bd/abv_library.sql` para el esquema completo):

- **persona** — datos personales + contrasena hash (bcrypt)
- **empleado** — rol (Vendedor, Bibliotecario, Administrador, Dueno)
- **cliente** — fecha de registro + puntos acumulados
- **libro** — catalogo con precio
- **proveedor** — proveedores de libros
- **prov_suministra_lib** — relacion N:M entre proveedor y libro
- **venta** — registro de ventas
- **lib_venta** — stock para venta y libros vendidos
- **prestamo** — prestamos con multas
- **lib_pres** — stock para prestamo y libros prestados
- **libro_favorito** — favoritos de cada cliente
- **historial_puntos** — puntos ganados por compra
- **donacion** — libros donados por clientes

---

## Dependencias

| Paquete | Uso |
|---------|-----|
| express | Servidor web y API REST |
| pg | Cliente PostgreSQL |
| bcrypt | Hash de contrasenas (10 salt rounds) |
| dotenv | Variables de entorno |
| cors | Cross-Origin Resource Sharing |
| axios | Consultas a Open Library API |

---

## Autor

Desarrollado por **Abel Pineda** y **Vanya Castillo** como proyecto academico de Base de Datos.

---

## Licencia

ISC
