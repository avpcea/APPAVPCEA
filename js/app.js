// js/app.js

// 1. IMPORTACIONES MODULARES REESTRUCTURADAS
import { db as supabase, BASE_FN } from './supabase-config.js';
import { 
    initNavigation, 
    cargarListadoAdmin,     
} from './navigation.js';


// ==========================================
// CARGA DINÁMICA DESDE SUPABASE (Vistas de Voluntario)
// ==========================================
export async function cargarEmergencias() {
    const contenedor = document.getElementById('contenedor-listado-emergencias');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    try {
        // Sintaxis nativa y limpia: la SDK se encarga de las cabeceras y del POST automáticamente
        const { data, error } = await supabase.functions.invoke('admin-list-elements-ts', {
            body: { tipo: 'emergencias' }
        });
        
        if (error) throw error;
        
        const lista = data || [];
        const promesasHtml = lista.map(async (e) => {
            const inscrito = await estaSuscrito('emergencias', e.id);
            const textoBoton = inscrito ? '❌ Dar de Baja' : '✍️ Suscribirse';
            const colorBoton = inscrito ? '#9ca3af' : '#dc2626';

            return `
                <div style="padding: 12px; border-bottom: 1px solid #eee; background: ${e.activa ? '#fef2f2' : '#fff'}; margin-bottom:5px; border-radius:4px; border-left: 4px solid ${e.activa ? '#dc2626' : '#9ca3af'};">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                        <div>
                            <strong style="color:#dc2626;">${e.titulo}</strong> 
                            ${e.activa ? '<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">🚨 ACTIVA</span>' : '<span style="color:#6b7280; font-size:11px;">(Cerrada)</span>'}
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button onclick="toggleSuscripcion('emergencias', '${e.id}')" style="background:${colorBoton}; color:#fff; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${textoBoton}</button>
                            ${e.activa ? `<button onclick="cerrarEmergenciaActiva('${e.id}')" style="background:#6b7280; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Cerrar Evento</button>` : ''}
                        </div>
                    </div>
                    <small style="display:block; margin-top:4px; color:#4b5563;">📅 Inicio: ${e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleString('es-ES') : 'S/F'} | ⚠️ Nivel: ${e.nivel || 'medio'}</small>
                </div>
            `;
        });
        
        contenedor.innerHTML = (await Promise.all(promesasHtml)).join('') || '<p style="color:#888; font-size:14px;">No hay emergencias registradas.</p>';
    } catch (err) { 
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`; 
    }
}

export async function cargarOperativos() {
    const contenedor = document.getElementById('contenedor-listado-operativos');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    try {
        const { data, error } = await supabase.functions.invoke('admin-list-elements-ts', {
            body: { tipo: 'operativos' }
        });
        
        if (error) throw error;
        
        const lista = data || [];
        const promesasHtml = lista.map(async (o) => {
            const inscrito = await estaSuscrito('operativos', o.id);
            const textoBoton = inscrito ? '❌ Cancelar' : '✍️ Suscribirse';
            const colorBoton = inscrito ? '#6b7280' : '#0284c7';

            return `
                <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#0284c7;">${o.titulo}</strong><br>
                        <small style="color:#555;">📅 ${o.fecha ? new Date(o.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${o.lugar || 'No asignado'}</small>
                    </div>
                    <button onclick="toggleSuscripcion('operativos', '${o.id}')" style="background:${colorBoton}; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${textoBoton}</button>
                </div>
            `;
        ));
        contenedor.innerHTML = (await Promise.all(promesasHtml)).join('') || '<p style="color:#888; font-size:14px;">No hay operativos registrados.</p>';
    } catch (err) { 
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>'; 
    }
}

export async function cargarPreventivos() {
    const contenedor = document.getElementById('contenedor-listado-preventivos');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    try {
        const { data, error } = await supabase.functions.invoke('admin-list-elements-ts', {
            body: { tipo: 'preventivos' }
        });
        
        if (error) throw error;
        
        const lista = data || [];
        const promesasHtml = lista.map(async (p) => {
            const inscrito = await estaSuscrito('preventivos', p.id);
            const textoBoton = inscrito ? '❌ Cancelar' : '✍️ Suscribirse';
            const colorBoton = inscrito ? '#6b7280' : '#b45309';

            return `
                <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#b45309;">${p.titulo}</strong><br>
                        <small style="color:#555;">📅 ${p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${p.lugar || 'No asignado'}</small>
                    </div>
                    <button onclick="toggleSuscripcion('preventivos', '${p.id}')" style="background:${colorBoton}; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${textoBoton}</button>
                </div>
            `;
        });
        contenedor.innerHTML = (await Promise.all(promesasHtml)).join('') || '<p style="color:#888; font-size:14px;">No hay preventivos registrados.</p>';
    } catch (err) { 
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`; 
    }
}

async function estaSuscrito(t, id) {
    const u = localStorage.getItem("usuario_id");
    const tc = t === "operativos" ? "OPR" : "NRP";
    const { data: d } = await supabase.from("suscripciones").select("*").eq("usuario_id", u).eq("tipo", tc).eq("evento_id", String(id)).maybeSingle();
    return !!d;
}

async function cargarFichaVoluntario() {
    const nombreEL = document.getElementById('voluntario-nombre');
    const telefonoEL = document.getElementById('voluntario-telefono');
    const horasEL = document.getElementById('voluntario-horas');

    try {
        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId) {
            console.warn("No se encontró 'usuario_id' en el localStorage.");
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
            if (horasEL) horasEL.textContent = data.horas || '0';
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

window.toggleSuscripcion = async function(t, id) {
    const u = localStorage.getItem("usuario_id");
    const sc = await estaSuscrito(t, id);
    const tc = t === "operativos" ? "OPR" : "NRP";
    if (!sc) {
        await fetch(`${BASE_FN}/admin-create-suscripcion-ts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apiKey": supabase.supabaseKey,
                "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
            },
            body: JSON.stringify({ usuario_id: u, evento_id: Number(id), tipo: t, admin_id: u })
        });
        alert("Suscrito.");
    } else {
        await supabase.from("suscripciones").delete().eq("usuario_id", u).eq("tipo", tc).eq("evento_id", String(id));
        alert("Cancelado.");
    }
    if (t === "preventivos") cargarPreventivos();
    if (t === "operativos") cargarOperativos();
    await cargarFichaVoluntario();
};

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

        // 3. Inicializar los oyentes de la barra de navegación con sus callbacks dinámicos
        initNavigation({
            'operativos': cargarOperativos,
            'preventivos': cargarPreventivos,
            'emergencias': cargarEmergencias,
            'admin': () => {
                cargarListadoAdmin();
                cargarUsuariosAdmin();
            }
        });

        // 4. Inicializar interceptores de formularios administrativos (Operativos/Preventivos con fecha)
        initAdminFormListeners();

        console.log('⚡ APP AVPCEA: Ecosistema modular inicializado con éxito.');
    } catch (error) {
        console.error("Fallo crítico en el arranque de la app:", error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa la barra de navegación nativa e inferior
    initNavigation({
        admin: () => {
            // Se ejecuta de fondo si necesitas callbacks adicionales para la pestaña Admin
            console.log("Cargando módulo de administración...");
        }
    });

    // Si tu app arranca por defecto en la pantalla de administración, llama a:
    // cargarListadoAdmin();
});
