// Modal de confirmación personalizado (reemplaza confirm() nativo)
// Uso: confirmar("¿Seguro?").then(ok => { if (ok) ... })

function confirmar(mensaje) {
    return new Promise((resolve) => {
        // Crear overlay
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:10000; display:flex; align-items:center; justify-content:center; animation:fadeIn .15s ease;";

        // Crear modal
        const modal = document.createElement("div");
        modal.style.cssText = "background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px 32px; max-width:380px; width:90%; box-shadow:0 8px 32px rgba(0,0,0,.3); text-align:center; animation:modalIn .18s ease;";

        modal.innerHTML = `
            <p style="font-size:1rem; font-weight:600; color:var(--text); margin:0 0 20px; line-height:1.4;">${mensaje}</p>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button id="btnConfirmarNo" style="padding:9px 24px; font-size:.9rem; font-weight:600; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; min-width:auto;">Cancelar</button>
                <button id="btnConfirmarSi" style="padding:9px 24px; font-size:.9rem; font-weight:600; border-radius:8px; border:none; background:#dc2626; color:#fff; cursor:pointer; min-width:auto;">Aceptar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Quitar foco de cualquier botón previo
        if (document.activeElement) document.activeElement.blur();

        const cerrar = (resultado) => {
            document.removeEventListener("keydown", manejarTecla);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            resolve(resultado);
        };

        // Manejar Enter y Escape
        const manejarTecla = (e) => {
            if (e.key === "Enter") { e.preventDefault(); cerrar(true); }
            if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
        };
        document.addEventListener("keydown", manejarTecla);

        // Eventos de botones
        document.getElementById("btnConfirmarSi").onclick = () => cerrar(true);
        document.getElementById("btnConfirmarNo").onclick = () => cerrar(false);
        overlay.onclick = (e) => { if (e.target === overlay) cerrar(false); };
    });
}
