// js/admin.js
import { db as supabase } from './supabase-config.js';

// --- 1. CARGA DINÁMICA DE DATOS MEDIANTE EDGE FUNCTIONS ---

export async function cargarEmergencias() {
    const contenedor = document.getElementById('contenedor-listado-emergencias');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    try {
        // Invocamos la función centralizada de elementos filtrando por tipo o consumiendo su salida
        const { data, error } = await supabase.functions.invoke('admin-list-elements-ts', {
            body: { tipo: 'emergencias' }
        });
        
        if (error) throw error;
        
        const lista = data || [];
        contenedor.innerHTML = lista.map(e => `
            <div style="padding: 10px; border-bottom: 1px solid #eee; background: ${e.activa ? '#fef2f2' : '#fff'}; margin-bottom:5px; border-radius:4px; border-left: 4px solid ${e.activa ? '#dc2626' : '#9ca3af'};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#dc2626;">${e.titulo}</strong> 
                        ${e.activa ? '<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:5px;">🚨 ACTIVA</span>' : '<span style="color:#6b7280; font-size:11px;">(Cerrada)</span>'}
                    </div>
                    ${e.activa ? `<button onclick="cerrarEmergenciaActiva('${e.id}')" style="background:#dc2626; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">Cerrar</button>` : ''}
                </div>
                <small>📅 Inicio: ${e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleString('es-ES') : 'S/F'} | ⚠️ Nivel: ${e.nivel || 'medio'}</small>
            </div>
        `).join('') || '<p style="color:#888; font-size:14px;">No hay emergencias registradas.</p>';
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
        contenedor.innerHTML = lista.map(o => `
            <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px;">
                <strong style="color:#0284c7;">${o.titulo}</strong><br>
                <small>📅 ${o.fecha ? new Date(o.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${o.lugar || 'No asignado'} | ⏱️ ${o.duracion_horas || 0} hrs</small>
            </div>
        `).join('') || '<p style="color:#888; font-size:14px;">No hay operativos registrados.</p>';
    } catch (err) {
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`;
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
        contenedor.innerHTML = lista.map(p => `
            <div style="padding: 10px; border-bottom: 1px solid #eee; background:#fff; margin-bottom:5px; border-radius:4px;">
                <strong style="color:#b45309;">${p.titulo}</strong><br>
                <small>📅 ${p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : 'S/F'} | 📍 ${p.lugar || 'No asignado'} | ⏱️ ${p.duracion_horas || 0} hrs</small>
            </div>
        `).join('') || '<p style="color:#888; font-size:14px;">No hay preventivos registrados.</p>';
    } catch (err) {
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`;
    }
}

// Expuesta globalmente para interactuar con los botones renderizados dinámicamente
window.cerrarEmergenciaActiva = async function(id) {
    if (!confirm('¿Seguro que deseas dar por finalizada esta emergencia?')) return;
    try {
        const { error } = await supabase.functions.invoke('emergencia-ts', {
            body: { accion: 'close', id: id }
        });
        if (error) throw error;
        alert('Emergencia cerrada con éxito.');
        cargarEmergencias();
    } catch (err) {
        alert('Error en Edge Function: ' + err.message);
    }
};
export async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('contenedor-usuarios-admin');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color:#666; font-size:14px;">🔄 Conectando con Edge...</p>';
    
    try {
        const { data: usuarios, error } = await supabase.functions.invoke('admin-list-users-ts');
        
        if (error) throw error;
        if (!usuarios || usuarios.length === 0) {
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
    } catch (err) {
        contenedor.innerHTML = `<p style="color:red; font-size:13px;">⚠️ Error Edge: ${err.message}</p>`;
    }
}

// --- 2. MANEJADORES DE SUTMIT ORQUESTADOS POR EDGE FUNCTIONS ---

export function initAdminFormListeners() {
    // A. Formulario de Emergencias (Arriba del todo)
    document.getElementById('form-emergencias')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        try {
            const { error } = await supabase.functions.invoke('emergencia-ts', {
                body: { 
                    accion: 'create',
                    titulo: formData.get('titulo'),
                    nivel: formData.get('nivel')
                }
            });
            if (error) throw error;
            e.target.reset();
            await cargarEmergencias();
        } catch (err) {
            alert('Error al desplegar: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    // B. Formulario de Nuevos Usuarios / Voluntarios
    document.getElementById('form-nuevo-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const diaValor = document.getElementById('usuario-cumple-dia').value;
        const mesValor = document.getElementById('usuario-cumple-mes').value;
        const btn = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        try {
            const { error } = await supabase.functions.invoke('admin-create-user-ts', {
                body: {
                    nombre: document.getElementById('usuario-nombre').value,
                    telefono: document.getElementById('usuario-telefono').value || null,
                    cumple_dia: diaValor ? parseInt(diaValor, 10) : null,
                    cumple_mes: mesValor ? parseInt(mesValor, 10) : null
                }
            });
            if (error) throw error;
            e.target.reset();
            await cargarUsuariosAdmin();
        } catch (err) {
            alert('Error al guardar usuario: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    // C. Formulario de Operativos
    document.getElementById('form-operativos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        try {
            const { error } = await supabase.functions.invoke('admin-create-element-ts', {
                body: {
                    tipo: 'operativos',
                    titulo: formData.get('titulo'),
                    lugar: formData.get('lugar'),
                    fecha: formData.get('fecha')
                }
            });
            if (error) throw error;
            e.target.reset();
            await cargarOperativos();
        } catch (err) {
            alert('Error al crear operativo: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    // D. Formulario de Preventivos
    document.getElementById('form-preventivos')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const btn = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        try {
            const { error } = await supabase.functions.invoke('admin-create-element-ts', {
                body: {
                    tipo: 'preventivos',
                    titulo: formData.get('titulo'),
                    lugar: formData.get('lugar'),
                    fecha: formData.get('fecha')
                }
            });
            if (error) throw error;
            e.target.reset();
            await cargarPreventivos();
        } catch (err) {
            alert('Error al crear preventivo: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });
}
