// =========================================================================
// ARCHIVO: admin.js (PARTE 1: ESCUCHADORES DE FORMULARIOS Y PARÁMETROS JEFATURA)
// =========================================================================
import { db as supabase } from './supabase-config.js';

/**
 * Descarga los parámetros vigentes de Supabase y rellena el formulario de Jefatura
 */
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

/**
 * Inicializa los listeners de los formularios inyectados dinámicamente en el DOM
 */
export function initAdminFormListeners() {
    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    // ⚙️ ACTUALIZACIÓN DE PARÁMETROS CRÍTICOS (JEFATURA)
    const formConfig = document.getElementById('form-configuraciones-globales');
    if (formConfig) {
        formConfig.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formConfig.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            const nuevoToken = document.getElementById('cfg-token-global').value.trim();
            const nuevaVersion = document.getElementById('cfg-version-minima').value.trim();

            try {
                // Actualizamos ambos registros de forma paralela en la tabla configuraciones
                await Promise.all([
                    supabase.from('configuraciones').update({ valor: nuevoToken }).eq('clave', 'token_global_acceso'),
                    supabase.from('configuraciones').update({ valor: nuevaVersion }).eq('clave', 'version_minima')
                ]);

                alert('Parámetros globales del ecosistema actualizados con éxito.');
            } catch (err) {
                alert(`Error al guardar en Supabase: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Guardar Parámetros';
            }
        });
    }

    // 👥 REGISTRO DE VOLUNTARIOS CON CÓDIGO ÚNICO
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
            const cumpleDia = parseInt(document.getElementById('usuario-cumple-dia').value, 10) || null;
            const cumpleMes = parseInt(document.getElementById('usuario-cumple-mes').value, 10) || null;

            try {
                const response = await fetch(`${supabase.functionsUrl}/admin-create-user-ts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        admin_id: adminId,
                        nombre,
                        codigo_voluntario: codigo,
                        telefono,
                        cumple_dia: cumpleDia,
                        cumple_mes: cumpleMes
                    })
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


    // 🚨 REGISTRO DE EMERGENCIAS (MÁXIMA PRIORIDAD)
    const formEmergencias = document.getElementById('form-emergencias');
    if (formEmergencias) {
        formEmergencias.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formEmergencias);
            await crearElementoEdge({
                titulo: formData.get('titulo'),
                tipo: 'EMR',
                meta: { gravedad: formData.get('nivel') }
            }, formEmergencias);
        });
    }

    // 🔧 REGISTRO DE DISPOSITIVOS OPERATIVOS
    const formOperativos = document.getElementById('form-operativos');
    if (formOperativos) {
        formOperativos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formOperativos);
            await crearElementoEdge({
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                fecha: formData.get('fecha'),
                tipo: 'OPR'
            }, formOperativos);
        });
    }

    // 🛡️ REGISTRO DE SERVICIOS PREVENTIVOS
    const formPreventivos = document.getElementById('form-preventivos');
    if (formPreventivos) {
        formPreventivos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formPreventivos);
            await crearElementoEdge({
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                fecha: formData.get('fecha'),
                tipo: 'NRP'
            }, formPreventivos);
        });
    }
}

/**
 * Abstracción genérica para disparar microservicios de creación de elementos físicos
 */
async function crearElementoEdge(payload, formulario) {
    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');
    const btn = formulario.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-create-element-ts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId, ...payload })
        });
        if (!res.ok) throw new Error('Error al impactar el microservicio de elementos.');
        formulario.reset();
        await cargarTodosLosEventosEdge();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
    }
}
// =========================================================================
// ARCHIVO: admin.js (PARTE 2: READ Y CO-SUSCRIPCIÓN EN PANEL DE CONTROL)
// =========================================================================

/**
 * Consulta de forma reactiva el padrón de voluntarios llamando a la Edge Function segura
 */
export async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('contenedor-usuarios-admin');
    if (!contenedor) return;

    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');
    contenedor.innerHTML = `<p style="padding:15px; color:#4b5563;">Consultando microservicio de usuarios...</p>`;

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-list-users-ts?admin_id=${adminId}`);
        if (!res.ok) {
            if (res.status === 403) throw new Error('Acceso denegado: Tu sesión no dispone de rol de Administrador.');
            throw new Error('Error al conectar con el servidor.');
        }

        const { data } = await res.json();
        const usuarios = data || [];

        if (usuarios.length === 0) {
            contenedor.innerHTML = `<p style="padding:15px; color:#6b7280;">No existen voluntarios registrados.</p>`;
            return;
        }

        let html = `
            <table style="width:100%; border-collapse:collapse; font-family:sans-serif; text-align:left; font-size:14px;">
                <thead>
                    <tr style="background:#f3f4f6; border-bottom:1px solid #e5e7eb;">
                        <th style="padding:10px; color:#374151;">Código</th>
                        <th style="padding:10px; color:#374151;">Nombre</th>
                        <th style="padding:10px; color:#374151;">Teléfono</th>
                        <th style="padding:10px; color:#374151;">Cumpleaños</th>
                    </tr>
                </thead>
                <tbody>
        `;

        usuarios.forEach(user => {
            const codVoluntario = user.codigo_voluntario || '<span style="color:#9ca3af; font-size:12px;">Sin código</span>';
            const cumple = user.cumple_dia && user.cumple_mes ? `${user.cumple_dia}/${user.cumple_mes}` : '-';
            
            html += `
                <tr style="border-bottom:1px solid #e5e7eb;">
                    <td style="padding:10px; font-weight:bold; color:#1f2937;">${codVoluntario}</td>
                    <td style="padding:10px; color:#4b5563;">${escapeHTML(user.nombre)}</td>
                    <td style="padding:10px; color:#4b5563;">${escapeHTML(user.telefono || '-')}</td>
                    <td style="padding:10px; color:#4b5563;">${cumple}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        contenedor.innerHTML = html;

    } catch (err) {
        contenedor.innerHTML = `<p style="padding:15px; color:#dc2626; font-weight:bold;">${err.message}</p>`;
    }
}

/**
 * Consulta unificada que descarga todas las emergencias, preventivos e incidentes de la Edge Function
 */
export async function cargarTodosLosEventosEdge() {
    const cEmergencias = document.getElementById('contenedor-listado-emergencias');
    const cOperativos = document.getElementById('contenedor-listado-operativos');
    const cPreventivos = document.getElementById('contenedor-listado-preventivos');

    if (!cEmergencias || !cOperativos || !cPreventivos) return;

    // 1. Inyectamos de forma segura el admin_id para evitar el Bad Request (400)
    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-list-elements-ts?admin_id=${adminId}`);
        if (!res.ok) throw new Error('Error al listar catálogo unificado.');

        // 2. CORRECCIÓN CLAVE: Extraemos la propiedad 'data' que es la que envía el backend real
        const { data } = await res.json();
        const lista = data || [];

        // Limpieza reactiva previa de contenedores
        cEmergencias.innerHTML = '';
        cOperativos.innerHTML = '';
        cPreventivos.innerHTML = '';

        if (lista.length === 0) {
            const vacio = `<p style="color:#9ca3af; font-size:13px; margin:0;">No constan elementos en este módulo.</p>`;
            cEmergencias.innerHTML = vacio;
            cOperativos.innerHTML = vacio;
            cPreventivos.innerHTML = vacio;
            return;
        }

        // Clasificación adaptada a los strings completos que inyecta la función loop de Deno ('emergencias', 'operativos', 'preventivos')
        lista.forEach(item => {
            const divNode = document.createElement('div');
            divNode.style.cssText = "padding:8px 12px; background:#fff; border:1px solid #e5e7eb; border-radius:4px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; font-family:sans-serif;";
            
            let colorTipo = "#4b5563";
            // Normalizamos la validación visual según los nombres físicos de tus tablas
            if (item.tipo === 'emergencias' || item.tipo === 'EMR') colorTipo = "#dc2626";
            if (item.tipo === 'operativos' || item.tipo === 'OPR') colorTipo = "#0284c7";
            if (item.tipo === 'preventivos' || item.tipo === 'NRP') colorTipo = "#b45309";

            divNode.innerHTML = `
                <div>
                    <strong style="color:${colorTipo};">${escapeHTML(item.nombre || item.titulo || 'Sin nombre')}</strong>
                    <span style="font-size:12px; color:#6b7280; margin-left:8px;">${item.fecha || item.meta?.gravedad || item.nivel || ''}</span>
                </div>
                <button class="btn-suscripcion-cross" data-id="${item.id}" data-tipo="${item.tipo}" 
                        style="padding:4px 8px; font-size:11px; background:#1f2937; color:#fff; border:none; border-radius:3px; cursor:pointer;">
                    + Inscribir
                </button>
            `;

            divNode.querySelector('.btn-suscripcion-cross').addEventListener('click', async (e) => {
                const targetId = e.target.getAttribute('data-id');
                const tAbrev = e.target.getAttribute('data-tipo');
                await levantarModalInscripcionRapida(targetId, tAbrev);
            });

            if (item.tipo === 'emergencias' || item.tipo === 'EMR') cEmergencias.appendChild(divNode);
            if (item.tipo === 'operativos' || item.tipo === 'OPR') cOperativos.appendChild(divNode);
            if (item.tipo === 'preventivos' || item.tipo === 'NRP') cPreventivos.appendChild(divNode);
        });

    } catch (err) {
        console.error("Error al actualizar vistas de eventos:", err);
    }
}

/**
 * Lógica auxiliar para inscribir de forma remota a voluntarios en eventos específicos
 */
async function levantarModalInscripcionRapida(elementoId, tipoAbrev) {
    const vId = prompt("Ingrese el UUID del 'usuario_id' del voluntario a inscribir:");
    if (!vId) return;

    let tipoCompleto = "operativos";
    if (tipoAbrev === "preventivos" || tipoAbrev === "NRP") tipoCompleto = "preventivos";
    if (tipoAbrev === "emergencias" || tipoAbrev === "EMR") tipoCompleto = "emergencias";

    const adminId = window.usuario_id || new URLSearchParams(window.location.search).get('admin_id');

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-create-suscripcion-ts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: vId,
                evento_id: elementoId,
                tipo: tipoCompleto,
                admin_id: adminId
            })
        });

        const rJson = await res.json();
        if (!res.ok) throw new Error(rJson.error || "Excepción de red.");
        
        alert("Suscripción procesada de forma correcta.");
    } catch (err) {
        alert(`Fallo en inscripción cruzada: ${err.message}`);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
