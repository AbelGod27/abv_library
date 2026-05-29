# ABV Library — Frontend (GitHub Pages)

Frontend estático del sistema ABV Library, desplegado en GitHub Pages. Se conecta al backend en Render para todas las operaciones.

**Frontend:** https://abelgod27.github.io/Libreria_va/  
**Backend (API):** https://libreria-va.onrender.com

---

## Acceso rápido

| Rol | Credenciales |
|-----|-------------|
| Visitante (solo lectura) | `visitante@abvlibrary.com` / `visitante1234` |

---

## Estructura

```
public/
├── index.html              # Catálogo principal
├── login.html              # Login unificado
├── cambiar-password.html   # Cambio de contraseña
├── config.js               # URL del backend (Render)
├── principal.css           # Estilos globales
├── index.css               # Estilos del catálogo
├── theme.js                # Temas (claro/oscuro/night)
├── readonly.js             # Modo solo lectura para visitantes
├── confirmar.js            # Diálogos de confirmación
├── img/
├── admin/                  # Panel administrador
├── bibliotecario/          # Panel bibliotecario
└── cliente/                # Portal del cliente
```

---

## Cómo funciona

- Los archivos HTML se sirven desde GitHub Pages
- Todas las llamadas `fetch()` son interceptadas por `config.js` que agrega la URL del backend en Render
- El backend tiene CORS habilitado para aceptar peticiones desde cualquier origen

---

## Capturas

| Vista | Descripción |
|-------|-------------|
| ![Catálogo](docs/01-catalogo.png) | Catálogo de libros |
| ![Modo oscuro](docs/02-modo-oscuro.png) | Modo oscuro |
| ![Login](docs/03-login.png) | Login unificado |
| ![Admin](docs/04-admin-panel.png) | Panel administrador |
| ![Libros](docs/05-libros-stock.png) | Gestión de libros |
| ![Bibliotecario](docs/06-bibliotecario-panel.png) | Panel bibliotecario |
| ![Ventas](docs/07-carrito-ventas.png) | Carrito de ventas |
| ![Cliente](docs/08-portal-cliente.png) | Portal del cliente |
| ![Facturas](docs/09-facturas.png) | Facturas |
| ![Proveedores](docs/10-proveedores.png) | Proveedores |

---

## Autor

Desarrollado por **Abel Pineda** y **Vanya Castillo**.
