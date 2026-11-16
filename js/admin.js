// =========================================================================
// ARCHIVO: admin.js (BLOQUE 1: PARÁMETROS, VOLUNTARIOS Y FORMULARIO UNIFICADO)
// =========================================================================
import { db as supabase } from './supabase-config.js';

export async function cargarConfiguracionesGlobalesForm() {
    const txtToken = document.getElementById('cfg-token-global');
    const txtVersion = document.getElementById('cfg-version-minima');
    if (!txtToken || !txtVersion) return;

    try {
        const { data, error } = await supabase.from('configuraciones').select('*');
        if (error) throw error;
        data.forEach(param => {
            if (param.clave === 'token_global_acceso') txtToken.value = param.valor;
            if (param.clave === 'version_minima') txtVersion.value = param.valor;
        });
    } catch (err) {
        console.error("Error al poblar formulario técnico:", err.message);
    }
}

export function initAdminFormListeners() {
    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    const formConfig = document.getElementById('form-configuraciones-globales');
    if (formConfig) {
        formConfig.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formConfig.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Guardando...';
            try {
                await Promise.all([
                    supabase.from('configuraciones').update({ valor: document.getElementById('cfg-token-global').value.trim() }).eq('clave', 'token_global_acceso'),
                    supabase.from('configuraciones').update({ valor: document.getElementById('cfg-version-minima').value.trim() }).eq('clave', 'version_minima')
                ]);
                alert('Parámetros globales actualizados con éxito.');
            } catch (err) {
                alert(`Error al guardar en Supabase: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Guardar Parámetros';
            }
        });
    }

    const formUsuario = document.getElementById('form-nuevo-usuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formUsuario.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Registrando...';

            const nombre = document.getElementById('usuario-nombre').value.trim();
            const codigo = document.getElementById('usuario-codigo').value.trim().toUpperCase();
            const telefono = document.getElementById('usuario-telefono').value.trim();
            const cumpleDia = parseInt(document.getElementById('usuario-cumple-dia')?.value, 10) || null;
            const cumpleMes = parseInt(document.getElementById('usuario-cumple-mes')?.value, 10) || null;

            try {
                const response = await fetch(`${supabase.functionsUrl}/admin-create-user-ts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_id: adminId, nombre, codigo_voluntario: codigo, telefono, cumple_dia: cumpleDia, cumple_mes: cumpleMes })
                });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error || 'Error en el microservicio.');
                formUsuario.reset();
                alert('Voluntario registrado con éxito.');
                cargarUsuariosAdmin();
            } catch (err) {
                alert(`No se pudo registrar: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Registrar';
            }
        });
    }

    const formEmergencias = document.getElementById('form-emergencias');
    if (formEmergencias) {
        formEmergencias.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(formEmergencias);
            await crearElementoEdge({
                tipo: 'emergencias',
                values: {
                    titulo: fd.get('titulo'),
                    nivel: fd.get('nivel')
                }
            }, formEmergencias);
        });
    }

    const formServicios = document.getElementById('form-servicios-unificado');
    if (formServicios) {
        formServicios.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(formServicios);
            const tablaDestino = fd.get('tipo_servicio') === 'NRP' ? 'preventivos' : 'operativos';
            await crearElementoEdge({
                tipo: tablaDestino,
                values: {
                    titulo: fd.get('titulo'),
                    lugar: fd.get('lugar'),
                    fecha: fd.get('fecha'),
                    descripcion: fd.get('descripcion')
                }
            }, formServicios);
        });
    }
}

// =========================================================================
// ARCHIVO: admin.js (BLOQUE 2: CREACIÓN EDGE, USUARIOS Y EVENTOS UNIFICADOS)
// =========================================================================
    const formEmergencias = document.getElementById('form-emergencias');
    if (formEmergencias) {
        formEmergencias.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(formEmergencias);
            await crearElementoEdge({
                tipo: 'emergencias',
                values: {
                    titulo: fd.get('titulo'),
                    nivel: fd.get('nivel')
                }
            }, formEmergencias);
        });
    }

    const formServicios = document.getElementById('form-servicios-unificado');
    if (formServicios) {
        formServicios.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(formServicios);
            const tablaDestino = fd.get('tipo_servicio') === 'NRP' ? 'preventivos' : 'operativos';
            await crearElementoEdge({
                tipo: tablaDestino,
                values: {
                    titulo: fd.get('titulo'),
                    lugar: fd.get('lugar'),
                    fecha: fd.get('fecha'),
                    descripcion: fd.get('descripcion')
                }
            }, formServicios);
        });
    }
}

export async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('contenedor-usuarios-admin');
    if (!contenedor) return;

    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');
    contenedor.innerHTML = `<p style="padding:15px; color:#4b5563;">Consultando microservicio de usuarios...</p>`;

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-list-users-ts?admin_id=${adminId}`);
        if (!res.ok) {
            if (res.status === 403) throw new Error('Acceso denegado: Sin rol de Administrador.');
            throw new Error('Error al conectar con el servidor.');
        }

        const { data } = await res.json();
        const usuarios = data || [];
        if (usuarios.length === 0) {
            contenedor.innerHTML = `<p style="padding:15px; color:#6b7280;">No existen voluntarios registrados.</p>`;
            return;
        }

        const filas = usuarios.map(user => {
            const cod = user.codigo_voluntario || '<span style="color:#9ca3af; font-size:12px;">Sin código</span>';
            const cumple = user.cumple_dia && user.cumple_mes ? `${user.cumple_dia}/${user.cumple_mes}` : '-';
            return `<tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px; font-weight:bold; color:#1f2937;">${cod}</td>
                <td style="padding:10px; color:#4b5563;">${escapeHTML(user.nombre)}</td>
                <td style="padding:10px; color:#4b5563;">${escapeHTML(user.telefono || '-')}</td>
                <td style="padding:10px; color:#4b5563;">${cumple}</td>
            </tr>`;
        }).join('');

        contenedor.innerHTML = `<table style="width:100%; border-collapse:collapse; font-family:sans-serif; text-align:left; font-size:14px;">
            <thead><tr style="background:#f3f4f6; border-bottom:1px solid #e5e7eb;">
                <th style="padding:10px;">Código</th><th style="padding:10px;">Nombre</th>
                <th style="padding:10px;">Teléfono</th><th style="padding:10px;">Cumpleaños</th>
            </tr></thead><tbody>${filas}</tbody></table>`;
    } catch (err) {
        contenedor.innerHTML = `<p style="padding:15px; color:#dc2626; font-weight:bold;">${err.message}</p>`;
    }
}

export async function cargarTodosLosEventosEdge() {
    const cEmergencias = document.getElementById('contenedor-listado-emergencias');
    const cServicios = document.getElementById('contenedor-listado-servicios');
    if (!cEmergencias || !cServicios) return;

    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    try {
        const [resEventos, resSus, resUsuarios] = await Promise.all([
            fetch(`${supabase.functionsUrl}/admin-list-elements-ts?admin_id=${adminId}`),
            supabase.from('suscripciones').select('usuario_id, evento_id, tipo'),
            supabase.from('usuarios').select('id, nombre')
        ]);

        if (!resEventos.ok) throw new Error('Error al listar catálogo unificado.');
        const { data } = await resEventos.json();
        renderizarEventosAdmin(cEmergencias, cServicios, data || [], resSus.data || [], resUsuarios.data || []);
    } catch (err) {
        console.error("Error al actualizar vistas de eventos:", err);
    }
}

// =========================================================================
// ARCHIVO: admin.js (BLOQUE 3: RENDERIZADO UNIFICADO E INSCRIPCIÓN CRUZADA)
// =========================================================================
function renderizarEventosAdmin(cEmergencias, cServicios, lista, suscripciones, usuarios) {
    const traductorTipoBD = { 'emergencias': 'EMR', 'operativos': 'OPR', 'preventivos': 'NRP' };
    const estilosPorTipo = {
        'EMR': { color: '#dc2626', badge: '🚨 EMERGENCIA' },
        'OPR': { color: '#0284c7', badge: '🔧 OPERATIVO' },
        'NRP': { color: '#b45309', badge: '🛡️ PREVENTIVO' }
    };

    const mapaNombres = {};
    usuarios.forEach(u => { mapaNombres[u.id] = u.nombre; });

    cEmergencias.innerHTML = '';
    cServicios.innerHTML = '';

    lista.forEach(item => {
        const tipoNorm = String(item.tipo).toLowerCase();
        const codigoCorto = traductorTipoBD[tipoNorm] || item.tipo.toUpperCase();
        const cfg = estilosPorTipo[codigoCorto] || { color: '#4b5563', badge: codigoCorto };

        const divNode = document.createElement('div');
        divNode.style.cssText = `padding:10px 12px; background:#fff; border:1px solid #e5e7eb; border-left:5px solid ${cfg.color}; border-radius:6px; margin-bottom:8px; font-family:sans-serif; box-shadow:0 1px 2px rgba(0,0,0,0.05);`;

        const tituloVisual = item.titulo || item.nombre || 'Dispositivo sin título';
        const metadataVisual = item.lugar ? `${item.lugar} - ${item.fecha || ''}` : `${item.fecha || ''}`;

        const inscritos = suscripciones.filter(s => 
            String(s.evento_id) === String(item.id) && String(s.tipo).trim().toUpperCase() === codigoCorto
        );

        const htmlInscritos = inscritos.length > 0
            ? `<div style="margin-top:4px;">${inscritos.map(s => `<span style="display:inline-block; background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; margin:2px 4px 2px 0;">👤 ${escapeHTML(mapaNombres[s.usuario_id] || 'Desconocido')}</span>`).join('')}</div>`
            : `<span style="font-size:11px; color:#9ca3af; font-style:italic;">Sin voluntarios apuntados aún.</span>`;

        divNode.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1; padding-right:10px;">
                    <span style="display:inline-block; font-size:10px; font-weight:bold; color:${cfg.color}; background:#f3f4f6; padding:2px 6px; border-radius:4px; margin-bottom:4px;">${cfg.badge}</span>
                    <span style="display:block; font-weight:bold; color:${cfg.color}; font-size:14px;">${escapeHTML(tituloVisual)}</span>
                    <span style="display:block; font-size:12px; color:#6b7280;">📍 ${escapeHTML(metadataVisual)}</span>
                    ${item.descripcion ? `<p style="margin:4px 0 0 0; font-size:12px; color:#4b5563;">${escapeHTML(item.descripcion)}</p>` : ''}
                </div>
                <button class="btn-suscripcion-cross" data-id="${item.id}" data-tipo="${item.tipo}" 
                        style="padding:5px 10px; font-size:12px; background:#1f2937; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; white-space:nowrap;">
                    + Inscribir
                </button>
            </div>
            <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #e5e7eb;">
                <span style="font-size:11px; font-weight:bold; color:#4b5563;">Inscritos (${inscritos.length}):</span>
                ${htmlInscritos}
            </div>
        `;

        divNode.querySelector('.btn-suscripcion-cross').addEventListener('click', async (e) => {
            await levantarModalInscripcionRapida(e.target.getAttribute('data-id'), e.target.getAttribute('data-tipo'));
        });

        if (codigoCorto === 'EMR') cEmergencias.appendChild(divNode);
        else cServicios.appendChild(divNode);
    });

    const vacio = `<p style="color:#9ca3af; font-size:13px; margin:0; padding:5px;">No constan elementos activos.</p>`;
    if (!cEmergencias.children.length) cEmergencias.innerHTML = vacio;
    if (!cServicios.children.length) cServicios.innerHTML = vacio;
}

async function levantarModalInscripcionRapida(elementoId, tipoAbrev) {
    const vId = prompt("Ingrese el UUID del 'usuario_id' del voluntario a inscribir:");
    if (!vId) return;

    const mapaTabla = { 'preventivos': 'preventivos', 'NRP': 'preventivos', 'emergencias': 'emergencias', 'EMR': 'emergencias' };
    const tipoCompleto = mapaTabla[tipoAbrev] || 'operativos';
    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-create-suscripcion-ts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: vId, evento_id: elementoId, tipo: tipoCompleto, admin_id: adminId })
        });
        const rJson = await res.json();
        if (!res.ok) throw new Error(rJson.error || "Excepción de red.");
        alert("Suscripción procesada de forma correcta.");
        await cargarTodosLosEventosEdge();
    } catch (err) {
        alert(`Fallo en inscripción cruzada: ${err.message}`);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
