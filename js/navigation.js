// js/navigation.js

// Importamos la conexión segura de tu configuración local
import { db as supabase } from './supabase-config.js';

// Estados locales de la alerta de audio
let ac = null, os = null;

// --- FUNCIONES AUXILIARES PARA EVENTOS ---
async function obtenerTodosLosEventos() {
  try {
    const [ops, prevs, emers] = await Promise.all([
      supabase.from('operativos').select('id, titulo, fecha, lugar').order('fecha', { ascending: false }),
      supabase.from('preventivos').select('id, titulo, fecha, lugar').order('fecha', { ascending: false }),
      supabase.from('emergencias').select('id, titulo, fecha_inicio, nivel, activa').order('fecha_inicio', { ascending: false })
    ]);
    return { operativos: ops.data || [], preventivos: prevs.data || [], emergencias: emers.data || [] };
  } catch (err) {
    console.error('Error cargando los listados de eventos:', err);
    return { operativos: [], preventivos: [], emergencias: [] };
  }
}

function generarHTMLListadosEventos(eventos) {
  const formatearFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES') : 'S/F';
  const htmlOps = eventos.operativos.map(o => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${o.titulo}</strong><br><small>📅 ${formatearFecha(o.fecha)} | 📍 ${o.lugar || 'No asignado'}</small></div>`).join('') || '<p style="color: #888; font-size: 14px;">No hay operativos.</p>';
  const htmlPrevs = eventos.preventivos.map(p => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${p.titulo}</strong><br><small>📅 ${formatearFecha(p.fecha)} | 📍 ${p.lugar || 'No asignado'}</small></div>`).join('') || '<p style="color: #888; font-size: 14px;">No hay preventivos.</p>';
  const htmlEmers = eventos.emergencias.map(e => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${e.titulo}</strong> ${e.activa ? '<span style="color: green; font-size: 11px; font-weight: bold;">● ACTIVA</span>' : ''}<br><small>📅 ${formatearFecha(e.fecha_inicio)} | ⚠️ Nivel: ${e.nivel}</small></div>`).join('') || '<p style="color: #888; font-size: 14px;">No hay emergencias.</p>';

  return `
    <div class="seccion-eventos-inferior" style="margin-top: 35px; border-top: 2px solid #ddd; padding-top: 20px; width: 100%;">
      <h3 style="margin-bottom: 15px; color: #333;">📋 Listados Globales de Eventos</h3>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; background: #f9f9f9; padding: 15px; border-radius: 6px; border-top: 3px solid #0284c7;">
          <h4 style="margin-top: 0; color: #0284c7;">🔧 Operativos</h4>
          <div style="max-height: 200px; overflow-y: auto;">${htmlOps}</div>
        </div>
        <div style="flex: 1; min-width: 240px; background: #f9f9f9; padding: 15px; border-radius: 6px; border-top: 3px solid #b45309;">
          <h4 style="margin-top: 0; color: #b45309;">🛡️ Preventivos</h4>
          <div style="max-height: 200px; overflow-y: auto;">${htmlPrevs}</div>
        </div>
        <div style="flex: 1; min-width: 240px; background: #f9f9f9; padding: 15px; border-radius: 6px; border-top: 3px solid #dc2626;">
          <h4 style="margin-top: 0; color: #dc2626;">🚨 Emergencias</h4>
          <div style="max-height: 200px; overflow-y: auto;">${htmlEmers}</div>
        </div>
      </div>
    </div>
  `;
}

export function activarPitidoEmergencia() {
    if (os) return;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        os = ac.createOscillator();
        const g = ac.createGain();
        os.type = 'sine';
        os.frequency.setValueAtTime(880, ac.currentTime);
        g.gain.setValueAtTime(0.4, ac.currentTime);
        os.connect(g);
        g.connect(ac.destination);
        os.start();
    } catch (e) {}
}

export function detenerPitidoEmergencia() {
    if (os) {
        try {
            os.stop();
            os.disconnect();
            if (ac && ac.state !== 'closed') ac.close();
        } catch (e) {}
        os = null;
        ac = null;
    }
}

export function showScreen(screenId) {
    const screens = document.querySelectorAll('.app-screen'); 
    screens.forEach(screen => {
        screen.style.display = 'none'; 
        screen.classList.remove('screen-active');
    });

    const currentScreen = document.getElementById(screenId);
    if (currentScreen) {
        currentScreen.style.display = 'block'; 
        currentScreen.classList.add('screen-active');
    } else {
        console.warn(`La pantalla con ID "${screenId}" no existe en el DOM.`);
    }
}

// REPARADO: Automatizado el disparo de la vista 'admin' de forma nativa al hacer click
export function initNavigation(callbacks = {}) {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetScreen = button.getAttribute('data-screen');
            if (targetScreen) {
                showScreen(targetScreen);
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Si va a la pestaña Admin, autoejecutamos la inyección de usuarios/eventos
                if (targetScreen === 'admin') {
                    cargarListadoAdmin();
                }

                if (callbacks[targetScreen]) callbacks[targetScreen]();
            }
        });
    });
}
export async function cargarListadoAdmin() {
    let adminScreen = document.getElementById('admin') || document.querySelector('.screen-active') || document.getElementById('app');
    if (!adminScreen) return;

    // Estructuramos el panel con el orden estricto solicitado
    adminScreen.innerHTML = `
      <h2 style="margin-bottom:20px;">Panel de Control y Administración AVPCEA</h2>
      
      <div style="display: flex; flex-direction: column; gap: 30px; width:100%;">
      
        <!-- 🚨 1. EMERGENCIAS (ARRIBA DEL TODO) -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #fca5a5; border-top: 4px solid #dc2626;">
            <h3 style="margin-top:0; color:#dc2626;">🚨 Gestión de Emergencias Activas</h3>
            <form id="form-emergencias" style="display:flex; gap:10px; align-items:flex-end; margin-bottom:15px; flex-wrap:wrap;">
                <div style="flex:2; min-width:200px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px;">Título de la Emergencia:</label>
                    <input type="text" name="titulo" required style="width:100%; padding:8px; box-sizing:border-box;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px;">Nivel de Gravedad:</label>
                    <select name="nivel" style="width:100%; padding:8px; box-sizing:border-box;">
                        <option value="bajo">Bajo</option>
                        <option value="medio" selected>Medio</option>
                        <option value="alto">Alto</option>
                    </select>
                </div>
                <button type="submit" style="padding:9px 15px; background:#dc2626; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Desplegar Emergencia</button>
            </form>
            <div id="contenedor-listado-emergencias" style="max-height:200px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px;"></div>
        </div>

        <!-- 👥 2. REGISTRO Y TABLA DE VOLUNTARIOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ddd;">
            <h3>👥 Gestión de Voluntarios</h3>
            <form id="form-nuevo-usuario" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <div style="flex:2; min-width:180px;">
                    <input type="text" id="usuario-nombre" placeholder="Nombre completo" required style="width:100%; padding:8px; box-sizing:border-box;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <input type="text" id="usuario-telefono" placeholder="Teléfono" style="width:100%; padding:8px; box-sizing:border-box;">
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <input type="number" id="usuario-cumple-dia" placeholder="Día" min="1" max="31" style="width:60px; padding:8px; box-sizing:border-box;">
                    <span>/</span>
                    <input type="number" id="usuario-cumple-mes" placeholder="Mes" min="1" max="12" style="width:60px; padding:8px; box-sizing:border-box;">
                </div>
                <button type="submit" style="padding:9px 15px; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Añadir</button>
            </form>
            <div id="contenedor-usuarios-admin"></div>
        </div>

        <!-- 🔧 3. OPERATIVOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ddd; border-top: 4px solid #0284c7;">
            <h3 style="margin-top:0; color:#0284c7;">🔧 Configurar Dispositivos Operativos</h3>
            <form id="form-operativos" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin-bottom:15px;">
                <input type="text" name="titulo" placeholder="Título del Operativo" required style="padding:8px;">
                <input type="text" name="lugar" placeholder="Lugar / Ubicación" style="padding:8px;">
                <input type="date" name="fecha" required style="padding:8px;">
                <button type="submit" style="background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Crear Operativo</button>
            </form>
            <div id="contenedor-listado-operativos" style="max-height:180px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px;"></div>
        </div>

        <!-- 🛡️ 4. PREVENTIVOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ddd; border-top: 4px solid #b45309;">
            <h3 style="margin-top:0; color:#b45309;">🛡️ Servicios Preventivos</h3>
            <form id="form-preventivos" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin-bottom:15px;">
                <input type="text" name="titulo" placeholder="Título del Preventivo" required style="padding:8px;">
                <input type="text" name="lugar" placeholder="Lugar del Evento" style="padding:8px;">
                <input type="date" name="fecha" required style="padding:8px;">
                <button type="submit" style="background:#b45309; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Crear Preventivo</button>
            </form>
            <div id="contenedor-listado-preventivos" style="max-height:180px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px;"></div>
        </div>

      </div>
    `;

    // Importación dinámica y ejecución asíncrona del nuevo módulo desacoplado
    const adminModule = await import('./admin.js');
    adminModule.initAdminFormListeners();
    adminModule.cargarEmergencias();
    adminModule.cargarUsuariosAdmin();
    adminModule.cargarOperativos();
    adminModule.cargarPreventivos();
}

// Dejamos la función como puente por retrocompatibilidad con abrirModalEdicionUsuario u otros módulos
export async function cargarUsuariosAdmin() {
    const adminModule = await import('./admin.js');
    adminModule.cargarUsuariosAdmin();
}

export async function cargarListadoHorasVoluntarios() {
    const cont = document.getElementById("admin-contabilidad-horas");
    if (!cont) return;
    try {
        const { data: registros } = await supabase.from("horas").select("usuario_id, tipo, horas, anio, usuarios(nombre)").order("anio", { ascending: false });
        cont.innerHTML = "<h4>Desglose de Horas Anuales</h4>";
        registros?.forEach(reg => {
            cont.innerHTML += "<p><strong>"+(reg.usuarios?.nombre || "Voluntario")+"</strong> - "+reg.tipo+": "+parseFloat(reg.horas).toFixed(2)+" hs ("+reg.anio+")</p>";
        });
    } catch (e) {}
}

export function initAdminFormListeners() {
    const formOperativos = document.getElementById('form-operativos');
    if (formOperativos) {
        formOperativos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formOperativos);
            const datos = {
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                descripcion: formData.get('descripcion'),
                fecha: formData.get('fecha'),
                fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
            };
            try {
                const { error } = await supabase.from('operativos').insert([datos]);
                if (error) throw error;
                alert('¡Operativo guardado con éxito!');
                formOperativos.reset();
                await cargarListadoAdmin();
            } catch (err) { alert('Error: ' + err.message); }
        });
    }

    const formPreventivos = document.getElementById('form-preventivos');
    if (formPreventivos) {
        formPreventivos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formPreventivos);
            const datos = {
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                descripcion: formData.get('descripcion'),
                fecha: formData.get('fecha'),
                fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
            };
            try {
                const { error } = await supabase.from('preventivos').insert([datos]);
                if (error) throw error;
                alert('¡Preventivo guardado con éxito!');
                formPreventivos.reset();
                await cargarListadoAdmin();
            } catch (err) { alert('Error: ' + err.message); }
        });
    }
}

window.abrirModalEdicionUsuario = async function(id) {
    try {
        const { data: usr } = await supabase.from("usuarios").select("*").eq("id", id).single();
        const nuevoNombre = prompt("Nombre:", usr.nombre); if (!nuevoNombre) return;
        const nuevoTelefono = prompt("Teléfono:", usr.telefono); if (!nuevoTelefono) return;
        const cumpleActual = (usr.cumple_dia && usr.cumple_mes) ? (String(usr.cumple_dia).padStart(2,"0")+"/"+String(usr.cumple_mes).padStart(2,"0")) : "DD/MM";
        const nuevoCumple = prompt("Cumpleaños (DD/MM):", cumpleActual); if (!nuevoCumple) return;
        const datos = { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim() };
        if (nuevoCumple.includes("/")) {
            const p = nuevoCumple.split("/"); const d = parseInt(p[0], 10), m = parseInt(p[1], 10);
            if (!isNaN(d) && !isNaN(m)) { datos.cumple_dia = d; datos.cumple_mes = m; }
        }
        await supabase.from("usuarios").update(datos).eq("id", id);
        alert("Actualizado."); await cargarUsuariosAdmin(); await cargarListadoHorasVoluntarios();
    } catch (e) {}
};
