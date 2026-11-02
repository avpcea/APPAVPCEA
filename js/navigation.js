// js/navigation.js (Primeras líneas)

// Importamos la conexión segura de tu configuración local
import { db as supabase } from './supabase-config.js';

// Estados locales de la alerta de audio
let ac = null, os = null;

// --- FUNCIONES AUXILIAR PARA EVENTOS (Añadir arriba en navigation.js) ---
async function obtenerTodosLosEventos() {
  try {
    const [ops, prevs, emers] = await Promise.all([
      db.from('operativos').select('id, titulo, fecha, lugar').order('fecha', { ascending: false }),
      db.from('preventivos').select('id, titulo, fecha, lugar').order('fecha', { ascending: false }),
      db.from('emergencias').select('id, titulo, fecha_inicio, nivel, activa').order('fecha_inicio', { ascending: false })
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
    <div class="seccion-eventos-inferior" style="margin-top: 35px; border-top: 2px solid #ddd; padding-top: 20px;">
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

// Configuración de eventos de la barra de navegación inferior
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

                // Ejecutar cargas dinámicas asociadas a la pestaña
                if (callbacks[targetScreen]) callbacks[targetScreen]();
            }
        });
    });
},

  async cargarListadoAdmin() {
    const appContainer = document.getElementById('app');
    
    appContainer.innerHTML = `
      <h2>Panel de Administración AVPCEA</h2>
      <div class="card-formulario" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <h3>➕ Registrar Nuevo Usuario</h3>
        <form id="form-nuevo-usuario">
          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px;">Nombre completo:</label>
            <input type="text" id="usuario-nombre" required style="width:100%; padding:8px;">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px;">Teléfono:</label>
            <input type="text" id="usuario-telefono" style="width:100%; padding:8px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:bold;">Cumpleaños:</label>
            <div style="display: flex; gap: 10px;">
              <input type="number" id="usuario-cumple-dia" placeholder="Día (1-31)" min="1" max="31" style="flex:1; padding:8px;">
              <input type="number" id="usuario-cumple-mes" placeholder="Mes (1-12)" min="1" max="12" style="flex:1; padding:8px;">
            </div>
          </div>
          <button type="submit" style="padding:10px 15px; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer;">Guardar Usuario</button>
        </form>
      </div>
      <div id="contenedor-usuarios-admin" style="margin-top:30px;"></div>
      <div id="contenedor-eventos-admin">
        <p style="color: #666; font-size: 14px; margin-top: 25px;">🔄 Cargando listados de eventos...</p>
      </div>
    `;

    document.getElementById('form-nuevo-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const diaValor = document.getElementById('usuario-cumple-dia').value;
      const mesValor = document.getElementById('usuario-cumple-mes').value;

      const nuevoUsuario = {
        nombre: document.getElementById('usuario-nombre').value,
        telefono: document.getElementById('usuario-telefono').value || null,
        cumple_dia: diaValor ? parseInt(diaValor, 10) : null,
        cumple_mes: mesValor ? parseInt(mesValor, 10) : null
      };

      const { error } = await db.from('usuarios').insert([nuevoUsuario]);
      if (error) {
        alert('Error al guardar el usuario: ' + error.message);
      } else {
        alert('Usuario guardado con éxito');
        e.target.reset();
        this.cargarUsuariosAdmin();
      }
    });

    this.cargarUsuariosAdmin();
    
    obtenerTodosLosEventos().then(eventos => {
      const divEventos = document.getElementById('contenedor-eventos-admin');
      if (divEventos) divEventos.innerHTML = generarHTMLListadosEventos(eventos);
    });
  },


  async cargarUsuariosAdmin() {
    const contenedorUsuarios = document.getElementById('contenedor-usuarios-admin');
    if (!contenedorUsuarios) return;

    contenedorUsuarios.innerHTML = '<p style="color:#666;">Cargando lista de usuarios...</p>';
    const { data: usuarios, error } = await db.from('usuarios').select('*').order('nombre', { ascending: true });

    if (error) {
      contenedorUsuarios.innerHTML = `<p style="color:red;">Error cargando usuarios: ${error.message}</p>`;
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      contenedorUsuarios.innerHTML = '<p style="color:#888;">No hay usuarios registrados aún.</p>';
      return;
    }

    let tablaHTML = `
      <h3>👥 Usuarios Registrados</h3>
      <table style="width:100%; border-collapse: collapse; margin-top:10px; background:#fff; border:1px solid #ddd;">
        <thead>
          <tr style="background:#f3f4f6; border-bottom:1px solid #ddd; text-align:left;">
            <th style="padding:10px;">Nombre</th>
            <th style="padding:10px;">Teléfono</th>
            <th style="padding:10px;">Cumpleaños</th>
            <th style="padding:10px;">Horas Totales</th>
          </tr>
        </thead>
        <tbody>
    `;

    usuarios.forEach(u => {
      const cumpleStr = (u.cumple_dia && u.cumple_mes) ? `${u.cumple_dia}/${u.cumple_mes}` : 'No configurado';
      tablaHTML += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px; font-weight:500;">${u.nombre}</td>
          <td style="padding:10px; color:#555;">${u.telefono || '-'}</td>
          <td style="padding:10px; color:#0284c7;">🎂 ${cumpleStr}</td>
          <td style="padding:10px; font-weight:bold; color:#10b981;">⏱️ ${u.horas || '0.00'} hrs</td>
        </tr>
      `;
    });

    tablaHTML += '</tbody></table>';
    contenedorUsuarios.innerHTML = tablaHTML;
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
                cargarListadoAdmin();
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
                cargarListadoAdmin();
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
