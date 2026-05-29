// Modo solo lectura: oculta botones de agregar, editar, eliminar
// Se activa cuando el usuario es "Vendedor" accediendo al panel de admin
(function() {
    if (sessionStorage.getItem("soloLectura") === "true") {
        document.addEventListener("DOMContentLoaded", () => {
            // Ocultar botones de acción
            document.querySelectorAll(".btn-danger, .form-actions, [onclick*='eliminar'], [onclick*='agregar'], [onclick*='Agregar'], [onclick*='registrar'], [onclick*='Registrar'], [onclick*='actualizar'], [onclick*='Actualizar'], [onclick*='recibir'], [onclick*='asignar']").forEach(el => {
                el.style.display = "none";
            });

            // Ocultar formularios de agregar/editar
            document.querySelectorAll(".card h2").forEach(h2 => {
                const texto = h2.textContent.toLowerCase();
                if (texto.includes("agregar") || texto.includes("editar") || texto.includes("recibir") || texto.includes("asignar") || texto.includes("importar")) {
                    h2.closest(".card").style.display = "none";
                }
            });

            // Mostrar badge de solo lectura
            const badge = document.createElement("div");
            badge.style.cssText = "position:fixed; top:70px; right:20px; z-index:9999; background:#f59e0b; color:#fff; padding:6px 14px; border-radius:8px; font-size:.8rem; font-weight:600;";
            badge.textContent = "MODO SOLO LECTURA";
            document.body.appendChild(badge);
        });
    }
})();
