// js/app.js

// 1. IMPORTACIONES MODULARES REESTRUCTURADAS
import { db as supabase } from './supabase-config.js';
import { initNavigation, showScreen } from './navigation.js';

// ==========================================
// CARGA DINÁMICA DESDE SUPABASE (Vistas de Voluntario)
// ==========================================
async function cargarFichaVoluntario() {
    const nombreEL = document.getElementById('voluntario-nombre');
    const telefonoEL = document.getElementById('voluntario-telefono');
    const horasEL = document.getElementById('voluntario-horas');

    try {
        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId) {
            console.warn("No se encontró 'usuario_id' in el localStorage.");
            if (nombreEL) nombreEL.textContent = "ID no encontrado / Sin sesión";
            return;
        }

        const { data, error } = await supabase
            .from('usuarios')
            .select('nombre, telefono, horas')
            .eq('id', usuarioId)
            .single();

        if (error) throw error;

        if (data) {
            if (nombreEL) nombreEL.textContent = data.nombre || 'Sin nombre';
            if (telefonoEL) telefonoEL.textContent = data.telefono || '-';
            if (horasEL) horasEL.textContent = parseFloat(data.horas || 0).toFixed(2);
        }
    } catch (err) {
        console.error("Error al cargar desde Supabase:", err.message);
        if (nombreEL) nombreEL.textContent = "Error de conexión";
    }
}

// ==========================================
// FUNCIONES GLOBALES INYECTADAS AL ENTORNO WINDOW (Compatibilidad HTML)
// ==========================================
window.cargarFichaVoluntario = cargarFichaVoluntario;

// ==========================================
// FLUJO DE INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
async function inicializarAplicacionVoluntario() {
    const ac = document.getElementById("app-container");
    if (ac) ac.style.display = "block";
    localStorage.setItem("avpcea_token", "v3");
    
    // Sesión persistente simulada
    localStorage.setItem("usuario_id", "2fa1fce4-aad0-439a-a391-3cd3079556c6");

    const u = localStorage.getItem("usuario_id");
    if (u && u.trim() !== "") {
        const ws = document.getElementById("welcome-screen");
        const wh = document.getElementById("welcome-header");
        if (ws) ws.style.display = "none";
        if (wh) wh.style.display = "none";
        showScreen("perfil");
    } else {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>Terminal No Enlazado</h2><p>Falta usuario_id.</p></div>';
    }
}

async function arrancarAplicacion() {
    try {
        // 1. Levantar variables e interfaz básica
        await inicializarAplicacionVoluntario();
        
        // 2. Cargar perfil del voluntario
        await cargarFichaVoluntario();

        // 3. Inicializar los oyentes de la barra de navegación nativa
        // Nota: La pestaña 'admin' autogestiona sus cargas dinámicas mediante navigation.js -> admin.js
        initNavigation({
            'perfil': async () => {
                await cargarFichaVoluntario();
            },
            'operativos': async () => {
                const adminModule = await import('./admin.js');
                adminModule.cargarOperativos();
            },
            'preventivos': async () => {
                const adminModule = await import('./admin.js');
                adminModule.cargarPreventivos();
            },
            'emergencias': async () => {
                const adminModule = await import('./admin.js');
                adminModule.cargarEmergencias();
            }
        });

        console.log('⚡ APP AVPCEA: Ecosistema modular inicializado con éxito.');
    } catch (error) {
        console.error("Fallo crítico en el arranque de la app:", error.message);
    }
}

// Inicialización limpia al cargar el DOM completo
document.addEventListener('DOMContentLoaded', () => {
    arrancarAplicacion();
});
