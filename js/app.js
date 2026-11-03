// js/app.js

// 1. IMPORTACIONES MODULARES REESTRUCTURADAS
import { db as supabase, BASE_FN } from './supabase-config.js';
import { 
    showScreen, 
    initNavigation, 
    activarPitidoEmergencia, 
    detenerPitidoEmergencia,
    initAdminFormListeners, 
    cargarListadoAdmin,     
    cargarUsuariosAdmin,   
} from './navigation.js';


// ==========================================
// CARGA DINÁMICA DESDE SUPABASE (Vistas de Voluntario)
// ==========================================
async function cargarOperativos() {
    const contenedor = document.getElementById('operativos');
    if (!contenedor) return;
    try {
        const { data, error } = await supabase
            .from('operativos')
            .select('titulo, lugar, fecha_inicio, descripcion')
            .order('fecha_inicio', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            let html = `<h3 style="text-align: center;">Próximos Operativos</h3>`;
            data.forEach(op => {
                const fecha = new Date(op.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                html += `
                    <div class="card" style="border-left: 5px solid #ff6600; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 5px 0; color: #0056b3; font-size: 1.3rem; font-weight: bold;">${op.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Fecha/Hora:</strong> ${fecha}</p>
                        ${op.lugar ? `<p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${op.lugar}</p>` : ''}
                        ${op.descripcion ? `<p style="margin: 8px 0 0 0; color: #555; font-size: 0.95rem;">${op.descripcion}</p>` : ''}
                    </div>`;
            });
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `
                <h3 style="text-align: center;">Próximos Operativos</h3>
                <p class="placeholder-text">No hay operativos activos asignados en este momento.</p>`;
        }
    } catch (err) {
        console.error("Error al cargar operativos:", err.message);
    }
}

async function cargarPreventivos() {
    const contenedor = document.getElementById('preventivos');
    if (!contenedor) return;
    try {
        const { data, error } = await supabase
            .from('preventivos')
            .select('titulo, lugar, fecha_inicio, descripcion')
            .order('fecha_inicio', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            let html = `<h3 style="text-align: center;">Dispositivos Preventivos</h3>`;
            data.forEach(prev => {
                const fecha = new Date(prev.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                html += `
                    <div class="card" style="border-left: 5px solid #007bff; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 5px 0; color: #0056b3; font-size: 1.3rem; font-weight: bold;">${prev.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Fecha/Hora:</strong> ${fecha}</p>
                        ${prev.lugar ? `<p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${prev.lugar}</p>` : ''}
                        ${prev.descripcion ? `<p style="margin: 8px 0 0 0; color: #555; font-size: 0.95rem;">${prev.descripcion}</p>` : ''}
                    </div>`;
            });
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `
                <h3 style="text-align: center;">Dispositivos Preventivos</h3>
                <p class="placeholder-text">Consulta y apúntate a los próximos preventivos de El Arenal.</p>`;
        }
    } catch (err) {
        console.error("Error al cargar preventivos:", err.message);
    }
}

async function cargarEmergencias() {
    const contenedor = document.getElementById('emergencias');
    if (!contenedor) return;
    try {
        const { data, error } = await supabase
            .from('emergencias')
            .select('titulo, fecha_inicio, nivel, activa')
            .order('fecha_inicio', { ascending: false });

        if (error) throw error;

        const tieneEmergenciaActiva = data && data.some(em => em.activa === true);

        if (tieneEmergenciaActiva) {
            activarPitidoEmergencia();
        } else {
            detenerPitidoEmergencia();
        }

        if (data && data.length > 0) {
            let html = `<h3>Alertas de Emergencia</h3>`;
            data.forEach(em => {
                const fecha = new Date(em.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                const badgeActiva = em.activa 
                    ? `<span style="background-color: #dc3545; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; float: right;">ACTIVA</span>` 
                    : `<span style="background-color: #6c757d; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; float: right;">CERRADA</span>`;

                html += `
                    <div class="card" style="border-left: 5px solid #dc3545; margin-bottom: 12px; background-color: ${em.activa ? '#fff5f5' : '#ffffff'};">
                        ${badgeActiva}
                        <h4 style="margin: 0 0 5px 0; color: #dc3545;">🚨 ${em.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Inicio:</strong> ${fecha}</p>
                        <p style="margin: 4px 0;"><strong>Nivel de Riesgo:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #dc3545;">${em.nivel || 'medio'}</span></p>
                    </div>`;
            });
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `
                <div class="card card-danger">
                    <h3>Alertas de Emergencia</h3>
                    <p class="placeholder-text">Sin alertas de última hora de la central.</p>
                </div>`;
        }
    } catch (err) {
        console.error("Error al cargar emergencias:", err.message);
        contenedor.innerHTML = `<h3>Alertas de Emergencia</h3><p style="color: red;">Error al conectar con el centro de alertas.</p>`;
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
//                cargarListadoHorasVoluntarios();
            }
        });

        // 4. Inicializar interceptores de formularios administrativos (Operativos/Preventivos con fecha)
        initAdminFormListeners();

        console.log('⚡ APP AVPCEA: Ecosistema modular inicializado con éxito.');
    } catch (error) {
        console.error("Fallo crítico en el arranque de la app:", error.message);
    }
}

// Ejecución segura según el estado del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarAplicacion);
} else {
    arrancarAplicacion();
}
