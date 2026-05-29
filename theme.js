// Archivo: theme.js — Sistema de temas (claro, oscuro, night shift) con botón flotante
// Se incluye en todas las páginas para permitir cambio de tema global
(function() {
    const temas = ['light', 'dark', 'night'];
    const iconos = { light: 'bi-sun-fill', dark: 'bi-moon-fill', night: 'bi-brightness-low-fill' };
    const titulos = { light: 'Modo claro', dark: 'Modo oscuro', night: 'Night shift' };

    // Cargar tema guardado en localStorage (por defecto: light)
    const temaGuardado = localStorage.getItem('tema') || 'light';
    if (temaGuardado !== 'light') {
        document.documentElement.setAttribute('data-theme', temaGuardado);
    }

    // Crear botón flotante para alternar entre temas
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.title = titulos[temaGuardado];
        btn.innerHTML = `<i class="bi ${iconos[temaGuardado]}"></i>`;
        btn.onclick = () => {
            // Ciclar al siguiente tema en la lista
            const actual = localStorage.getItem('tema') || 'light';
            const siguiente = temas[(temas.indexOf(actual) + 1) % temas.length];

            if (siguiente === 'light') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', siguiente);
            }

            localStorage.setItem('tema', siguiente);
            btn.innerHTML = `<i class="bi ${iconos[siguiente]}"></i>`;
            btn.title = titulos[siguiente];
        };
        document.body.appendChild(btn);
    });
})();
