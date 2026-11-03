// js/admin.js
import { db as supabase } from './supabase-config.js';

// --- Funciones de Carga de Datos desde Supabase ---
export async function cargarOperativos() {
    const contenedor = document.getElementById('contenedor-listado-operativos');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">Cargando operativos...</p>';
    
    const { data, error } = await supabase.from('operativos').select('*').order('fecha', { ascending: false });
    if (error) return contenedor.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    
    contenedor.innerHTML = data.map(o => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px;">
            <strong style="color:#0284c7;">${o.titulo}</strong><br>
            <small>📅 ${new Date(o.fecha).toLocaleDateString('es-ES')} | 📍 ${o.lugar || 'No asignado'} | ⏱️ ${o.duracion_hours || o.duracion_horas || 0} hrs</small>
        </div>
    `).join('') || '<p style="color:#888; font-size:14px;">No hay operativos registrados.</p>';
}

export async function cargarPreventivos() {
    const contenedor = document.getElementById('contenedor-listado-preventivos');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">Cargando preventivos...</p>';
    
    const { data, error } = await supabase.from('preventivos').select('*').order('fecha', { ascending: false });
    if (error) return contenedor.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    
    contenedor.innerHTML = data.map(p => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px;">
            <strong style="color:#b45309;">${p.titulo}</strong><br>
            <small>📅 ${new Date(p.fecha).toLocaleDateString('es-ES')} | 📍 ${p.lugar || 'No asignado'} | ⏱️ ${p.duracion_hours || p.duracion_horas || 0} hrs</small>
        </div>
    `).join('') || '<p style="color:#888; font-size:14px;">No hay preventivos registrados.</p>';
}

export async function cargarEmergencias() {
    const contenedor = document.getElementById('contenedor-listado-emergencias');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">Cargando emergencias...</p>';
    
    const { data, error } = await supabase.from('emergencias').select('*').order('fecha_inicio', { ascending: false });
    if (error) return contenedor.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    
    contenedor.innerHTML = data.map(e => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; background: ${e.activa ? '#fef2f2' : '#fff'}; margin-bottom:5px; border-radius:4px; border-left: 4px solid ${e.activa ? '#dc2626' : '#9ca3af'};">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#dc2626;">${e.titulo}</strong> 
                    ${e.activa ? '<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">🚨 ACTIVA</span>' : '<span style="color:#6b7280; font-size:11px;">(Cerrada)</span>'}
                </div>
                ${e.activa ? `<button onclick="cerrarEmergencia('${e.id}')" style="background:#dc2626; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Cerrar</button>` : ''}
            </div>
            <small>📅 Inicio: ${new Date(e.fecha_inicio).toLocaleString('es-ES')} | ⚠️ Nivel: ${e.nivel || 'medio'}</small>
        </div>
    `).join('') || '<p style="color:#888; font-size:14px;">No hay emergencias registradas.</p>';
}

// Expuesta globalmente para el botón de la lista dinámica
window.cerrarEmergencia = async function(id) {
    if (!confirm('¿Confirmas que deseas cerrar esta emergencia?')) return;
    const { error } = await supabase.from('emergencias').update({ activa: false, fecha_fin: new Date().toISOString() }).eq('id', id);
    if (error) alert('Error al cerrar: ' + error.message);
    else cargarEmergencias();
};
export async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('contenedor-usuarios-admin');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666;">Cargando lista de usuarios...</p>';
    
    const { data: usuarios, error } = await supabase.from('usuarios').select('*').order('nombre', { ascending: true });
    if (error) return contenedor.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    if (!usuarios || usuarios.length === 0) return contenedor.innerHTML = '<p style="color:#888;">No hay usuarios.</p>';

    let tablaHTML = `
      <table style="width:100%; border-collapse: collapse; margin-top:10px; background:#fff; border:1px solid #ddd;">
        <thead>
          <tr style="background:#f3f4f6; border-bottom:1px solid #ddd; text-align:left;">
            <th style="padding:10px;">Nombre</th>
            <th style="padding:10px;">Teléfono</th>
            <th style="padding:10px;">Cumpleaños</th>
            <th style="padding:10px;">Horas</th>
          </tr>
        </thead>
        <tbody>
    `;
    usuarios.forEach(u => {
      const cumpleStr = (u.cumple_dia && u.cumple_mes) ? `${u.cumple_dia}/${u.cumple_mes}` : '-';
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
    contenedor.innerHTML = tablaHTML;
}

// --- Inicializador de Listeners de los Formularios ---
export function initAdminFormListeners() {
    // Formulario Usuarios
    document.getElementById('form-nuevo-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoUsuario = {
            nombre: document.getElementById('usuario-nombre').value,
            telefono: document.getElementById('usuario-telefono').value || null,
            cumple_dia: document.getElementById('usuario-cumple-dia').value ? parseInt(document.getElementById('usuario-cumple-dia').value, 10) : null,
            cumple_mes: document.getElementById('usuario-cumple-mes').value ? parseInt(document.getElementById('usuario-cumple-mes').value, 10) : null
        };
        const { error } = await supabase.from('usuarios').insert([nuevoUsuario]);
        if (error) alert('Error: ' + error.message);
        else { e.target.reset(); cargarUsuariosAdmin(); }
    });

    // Formulario Operativos
    document.getElementById('form-operativos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const datos = {
            titulo: formData.get('titulo'), lugar: formData.get('lugar'), descripcion: formData.get('descripcion'),
            fecha: formData.get('fecha'), fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
        };
        const { error } = await supabase.from('operativos').insert([datos]);
        if (error) alert('Error: ' + error.message);
        else { e.target.reset(); cargarOperativos(); }
    });

    // Formulario Preventivos
    document.getElementById('form-preventivos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const datos = {
            titulo: formData.get('titulo'), lugar: formData.get('lugar'), descripcion: formData.get('descripcion'),
            fecha: formData.get('fecha'), fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
        };
        const { error } = await supabase.from('preventivos').insert([datos]);
        if (error) alert('Error: ' + error.message);
        else { e.target.reset(); cargarPreventivos(); }
    });

    // Formulario Emergencias
    document.getElementById('form-emergencias')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const datos = {
            titulo: formData.get('titulo'), nivel: formData.get('nivel') || 'medio', activa: true,
            fecha_inicio: new Date().toISOString()
        };
        const { error } = await supabase.from('emergencias').insert([datos]);
        if (error) alert('Error: ' + error.message);
        else { e.target.reset(); cargarEmergencias(); }
    });
}
