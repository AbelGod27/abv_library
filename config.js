// =========================================================
// Configuración global para GitHub Pages
// El frontend se sirve desde GitHub Pages y las peticiones
// van al backend desplegado en Render
// =========================================================

const API_BASE = "https://libreria-va.onrender.com";

// Interceptar fetch para agregar API_BASE a rutas relativas del API
const _originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === "string" && url.startsWith("/")) {
        url = API_BASE + url;
    }
    return _originalFetch.call(this, url, options);
};
