// js/admin.js
import { db as supabase } from './supabase-config.js';

// =========================================================================
// 1. LÓGICA DE SUSCRIPCIONES (Sincronizada con la Base de Datos y Edge)
// =========================================================================

export async function estaSuscrito(tipo, eventoId) {
    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) return false;

    // Mapeo estricto según tus reglas de base de datos
    let codigoTipo = "OPR";
    if (tipo === "preventivos") codigoTipo = "NRP";
    if (tipo === "emergencias") codigoTipo = "EMR";

    const { data } = await supabase
        .from("suscripciones")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("tipo", codigoTipo)
        .eq("evento_id", String(eventoId))
        .maybeSingle();

    return !!data;
}

window.toggleSuscripcion = async function(tipo, eventoId) {
    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) {
        alert("No se ha seleccionado ningún voluntario activo.");
        return;
    }

    const suscrito = await estaSuscrito(tipo, eventoId);
    let codigoTipo = tipo === "operativos" ? "OPR" : (tipo === "preventivos" ? "NRP" : "EMR");

    try {
        if (!suscrito) {
            // Invocación limpia usando la SDK nativa para tu Edge Function
            const { error } = await supabase.functions.invoke('admin-create-suscripcion-ts', {
                body: { 
                    usuario_id: usuarioId, 
                    evento_id: isNaN(eventoId) ? eventoId : Number(eventoId), 
                    tipo: tipo, 
                    admin_id: usuarioId 
                }
            });
            if (error) throw error;
            alert("Inscripción realizada con éxito.");
        } else {
            // Borrado directo en tabla como hacías en tu código original
            const { error } = await supabase
                .from("suscripciones")
                .delete()
                .eq("usuario_id", usuarioId)
                .eq("tipo", codigoTipo)
                .eq("evento_id", String(eventoId));
            if (error) throw error;
            alert("Inscripción cancelada.");
        }

        // Refrescos reactivos instantáneos de las secciones
        await cargarTodosLosEventosEdge();
        
        // Recargar la tabla/lista de usuarios para reflejar el cambio de horas anuales calculadas por el trigger
        await cargarUsuariosAdmin();
        
    } catch (err) {
        alert("Error en la operación de suscripción: " + err.message);
    }
};

// =========================================================================
// 2. LISTADOS DINÁMICOS UNIFICADOS BASADOS EN ENDPOINTS EDGE
// =========================================================================

export async function cargarTodosLosEventosEdge() {
    const usuarioId = localStorage.getItem("usuario_id");
    if (!usuarioId) {
        console.warn("Falta usuario_id para la autenticación en el Edge.");
        return;
    }

    const contEmergencias = document.getElementById('contenedor-listado-emergencias');
    const contOperativos = document.getElementById('contenedor-listado-operativos');
    const contPreventivos = document.getElementById('contenedor-listado-preventivos');

    if (contEmergencias) contEmergencias.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Sincronizando emergencias...</p>';
    if (contOperativos) contOperativos.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Sincronizando operativos...</p>';
    if (contPreventivos) contPreventivos.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Sincronizando preventivos...</p>';

    try {
        // SOLUCIÓN: Concatenamos el parámetro de consulta directo en el nombre de la función
        const { data: respuestaEdge, error } = await supabase.functions.invoke(`admin-list-elements-ts?admin_id=${usuarioId}`);

        if (error) throw error;

        const listaCompleta = respuestaEdge?.data || [];

        // 🚨 Renderizar Emergencias
        if (contEmergencias) {
            const emergencias = listaCompleta.filter(item => item.tipo === 'emergencias');
            const promesasEm = emergencias.map(async (e) => {
                const inscrito = await estaSuscrito('emergencias', e.id);
                return `
                    <div style="padding: 12px; border-bottom: 1px solid #eee; background: ${e.activa ? '#fef2f2' : '#fff'}; margin-bottom:5px; border-radius:4px; border-left: 4px solid ${e.activa ? '#dc2626' : '#9ca3af'};">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                            <div><strong style="color:#dc2626;">${e.titulo}</strong> ${e.activa ? '<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">🚨 ACTIVA</span>' : ''}</div>
                            <div style="display:flex; gap:5px;">
                                <button onclick="toggleSuscripcion('emergencias', '${e.id}')" style="background:${inscrito ? '#9ca3af' : '#dc2626'}; color:#fff; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${inscrito ? '❌ Dar de Baja' : '✍️ Suscribirse'}</button>
                                ${e.activa ? `<button onclick="cerrarEmergenciaActiva('${e.id}')" style="background:#6b7280; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Cerrar Evento</button>` : ''}
                            </div>
                        </div>
                        <small style="display:block; margin-top:4px; color:#4b5563;">📅 Inicio: ${e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleString('es-ES') : 'S/F'} | ⚠️ Nivel: ${e.nivel || 'medio'}</small>
                    </div>
                `;
            });
            contEmergencias.innerHTML = (await Promise.all(promesasEm)).join('') || '<p style="color:#888; font-size:14px;">No hay emergencias registradas.</p>';
        }
        // 🔧 Renderizar Operativos
        if (contOperativos) {
            const operativos = listaCompleta.filter(item => item.tipo === 'operativos');
            const promesasOp = operativos.map(async (o) => {
                const inscrito = await estaSuscrito('operativos', o.id);
                return `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                        <div><strong style="color:#0284c7;">${o.titulo}</strong><br><small style="color:#555;">📅 ${o.fecha ? new Date(o.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${o.lugar || 'No asignado'}</small></div>
                        <button onclick="toggleSuscripcion('operativos', '${o.id}')" style="background:${inscrito ? '#6b7280' : '#0284c7'}; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${inscrito ? '❌ Cancelar' : '✍️ Suscribirse'}</button>
                    </div>
                `;
            });
            contOperativos.innerHTML = (await Promise.all(promesasOp)).join('') || '<p style="color:#888; font-size:14px;">No hay operativos registrados.</p>';
        }

        // 🛡️ Renderizar Preventivos
        if (contPreventivos) {
            const preventivos = listaCompleta.filter(item => item.tipo === 'preventivos');
            const promesasPr = preventivos.map(async (p) => {
                const inscrito = await estaSuscrito('preventivos', p.id);
                return `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                        <div><strong style="color:#b45309;">${p.titulo}</strong><br><small style="color:#555;">📅 ${p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${p.lugar || 'No asignado'}</small></div>
                        <button onclick="toggleSuscripcion('preventivos', '${p.id}')" style="background:${inscrito ? '#6b7280' : '#b45309'}; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">${inscrito ? '❌ Cancelar' : '✍️ Suscribirse'}</button>
                    </div>
                `;
            });
            contPreventivos.innerHTML = (await Promise.all(promesasPr)).join('') || '<p style="color:#888; font-size:14px;">No hay preventivos registrados.</p>';
        }

    } catch (err) {
        const errorHtml = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`;
        if (contEmergencias) contEmergencias.innerHTML = errorHtml;
        if (contOperativos) contOperativos.innerHTML = errorHtml;
        if (contPreventivos) contPreventivos.innerHTML = errorHtml;
    }
}

window.cerrarEmergenciaActiva = async function(id) {
    if (!confirm('¿Seguro que deseas dar por finalizada esta emergencia?')) return;
    try {
        const { error } = await supabase.functions.invoke('emergencia-ts', { body: { accion: 'close', id: id } });
        if (error) throw error;
        alert('Emergencia cerrada con éxito.');
        await cargarTodosLosEventosEdge();
    } catch (err) { alert('Error en Edge Function: ' + err.message); }
};

// =========================================================================
// 3. SECCIÓN ADMINISTRATIVA DE VOLUNTARIOS (Extracción e Inyección limpia)
// =========================================================================

export async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('contenedor-usuarios-admin');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    const usuarioId = localStorage.getItem("usuario_id");
    try {
        const { data: respuestaEdge, error } = await supabase.functions.invoke(`admin-list-users-ts?admin_id=${usuarioId}`);
        
        if (error) throw error;
        
        let usuarios = [];
        if (Array.isArray(respuestaEdge)) {
            usuarios = respuestaEdge;
        } else if (respuestaEdge && Array.isArray(respuestaEdge.data)) {
            usuarios = respuestaEdge.data;
        } else if (respuestaEdge && Array.isArray(respuestaEdge.usuarios)) {
            usuarios = respuestaEdge.usuarios;
        }
        
        if (usuarios.length === 0) {
            contenedor.innerHTML = '<p style="color:#888; font-size:14px;">No hay usuarios registrados aún.</p>';
            return;
        }

        let tablaHTML = `
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
            <tr style="border-bottom:1px solid #eee; cursor:pointer;" onclick="localStorage.setItem('usuario_id','${u.id}'); alert('Voluntario activo seleccionado: ${u.nombre}'); cargarTodosLosEventosEdge();">
              <td style="padding:10px; font-weight:500; color:#111827;">${u.nombre}</td>
              <td style="padding:10px; color:#4b5563;">${u.telefono || '-'}</td>
              <td style="padding:10px; color:#0284c7;">🎂 ${cumpleStr}</td>
              <td style="padding:10px; font-weight:bold; color:#059669;">⏱️ ${parseFloat(u.horas || 0).toFixed(2)} hrs</td>
            </tr>
          `;
        });

        tablaHTML += '</tbody></table><small style="color:#6b7280; display:block; margin-top:8px;">💡 Truco: Haz click en la fila de cualquier voluntario para seleccionarlo como activo y gestionar sus suscripciones.</small>';
        contenedor.innerHTML = tablaHTML;
    } catch (err) {
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`;
    }
}

export function initAdminFormListeners() {
    document.getElementById('form-emergencias')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { error } = await supabase.functions.invoke('emergencia-ts', { body: { accion: 'create', titulo: formData.get('titulo'), nivel: formData.get('nivel') } });
        if (error) alert('Error: ' + error.message); else { e.target.reset(); await cargarTodosLosEventosEdge(); }
    });

    document.getElementById('form-nuevo-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const diaValor = document.getElementById('usuario-cumple-dia').value;
        const mesValor = document.getElementById('usuario-cumple-mes').value;
        const { error } = await supabase.functions.invoke('admin-create-user-ts', { body: { nombre: document.getElementById('usuario-nombre').value, telefono: document.getElementById('usuario-telefono').value || null, cumple_dia: diaValor ? parseInt(diaValor, 10) : null, cumple_mes: mesValor ? parseInt(mesValor, 10) : null } });
        if (error) alert('Error: ' + error.message); else { e.target.reset(); await cargarUsuariosAdmin(); }
    });

    document.getElementById('form-operativos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { error } = await supabase.functions.invoke('admin-create-element-ts', { body: { tipo: 'operativos', titulo: formData.get('titulo'), lugar: formData.get('lugar'), fecha: formData.get('fecha') } });
        if (error) alert('Error: ' + error.message); else { e.target.reset(); await cargarTodosLosEventosEdge(); }
    });

    document.getElementById('form-preventivos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { error } = await supabase.functions.invoke('admin-create-element-ts', { body: { tipo: 'preventivos', titulo: formData.get('titulo'), lugar: formData.get('lugar'), fecha: formData.get('fecha') } });
        if (error) alert('Error: ' + error.message); else { e.target.reset(); await cargarTodosLosEventosEdge(); }
    });
}

// =========================================================================
// 4. PUENTES DE COMPATIBILIDAD MODULAR EXPORTABLES (Para app.js)
// =========================================================================
export async function cargarEmergencias() { await cargarTodosLosEventosEdge(); }
export async function cargarOperativos() { await cargarTodosLosEventosEdge(); }
export async function cargarPreventivos() { await cargarTodosLosEventosEdge(); }
