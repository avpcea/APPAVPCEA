// =========================================================================
// ARCHIVO: profile.js (BLOQUE 1: FICHA PERSONAL Y HORAS ANUALES)
// =========================================================================
import { db as supabase } from './supabase-config.js';
import { cerrarSesionVoluntario } from './app.js';
import { registrarPushMovil } from './emergencias.js';


const TIPO_MAP_TEXTO = {
    'operativos': 'Operativo', 'preventivos': 'Preventivo', 'emergencias': 'Emergencia',
    'OPR': 'Operativo', 'NRP': 'Preventivo', 'EMR': 'Emergencia'
};

export async function initProfileScreen(usuarioId) {
    const profileContainer = document.getElementById('profile-subscriptions-container');
    if (!profileContainer) return;

    profileContainer.innerHTML = `<p class="loading-text" style="font-family:sans-serif; color:#4b5563;">Cargando tus datos, horas y eventos suscritos...</p>`;

    try {
        const anioActual = new Date().getFullYear();

        const [usuarioRes, suscripcionesRes, horasRes, oprRes, nrpRes, emrRes] = await Promise.all([
            supabase.from('usuarios').select('nombre, telefono, cumple_dia, cumple_mes, codigo_voluntario').eq('id', usuarioId).single(),
            supabase.from('suscripciones').select('evento_id, tipo').eq('usuario_id', usuarioId),
            supabase.from('horas').select('*').eq('usuario_id', usuarioId),
            supabase.from('operativos').select('*'),
            supabase.from('preventivos').select('*'),
            supabase.from('emergencias').select('*')
        ]);

        if (usuarioRes.error) throw new Error(`Error al cargar perfil: ${usuarioRes.error.message}`);
        if (suscripcionesRes.error) throw new Error(`Error al cargar suscripciones: ${suscripcionesRes.error.message}`);

        const usuario = usuarioRes.data;
        const listaSuscripciones = suscripcionesRes.data || [];
        const registrosHoras = horasRes.data || [];

        // Sumamos las horas correspondientes al año actual (usando columna "año" o fallback por "fecha")
        const totalHorasAnuales = registrosHoras
            .filter(r => {
                const anioReg = r['año'] || (r.fecha ? new Date(r.fecha).getFullYear() : null);
                return Number(anioReg) === anioActual;
            })
            .reduce((acc, r) => acc + (parseFloat(r.horas) || 0), 0);

        const horasFormateadas = Number.isInteger(totalHorasAnuales) ? totalHorasAnuales : totalHorasAnuales.toFixed(2);

        const listaEventos = [
            ...(oprRes.data || []).map(item => ({ ...item, tipo: 'OPR' })),
            ...(nrpRes.data || []).map(item => ({ ...item, tipo: 'NRP' })),
            ...(emrRes.data || []).map(item => ({ ...item, tipo: 'EMR' }))
        ];

        profileContainer.innerHTML = `
            <div class="profile-card-header" style="background:#f3f4f6; padding:20px; border-radius:8px; margin-bottom:25px; font-family:sans-serif; border:1px solid #e5e7eb; position:relative;">
                <button id="btn-logout-voluntario" style="position:absolute; top:15px; right:15px; padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">
                    🚪 Salir
                </button>

                <h3 style="margin:0 0 10px 0; color:#1f2937;">👤 Ficha de Voluntario</h3>
                <p style="margin:4px 0; color:#4b5563;"><strong>Nombre:</strong> ${escapeHTML(usuario.nombre)}</p>
                <p style="margin:4px 0; color:#4b5563;"><strong>Teléfono:</strong> ${escapeHTML(usuario.telefono || 'No registrado')}</p>
                <p style="margin:4px 0; color:#4b5563;"><strong>Cumpleaños:</strong> ${usuario.cumple_dia && usuario.cumple_mes ? `${usuario.cumple_dia}/${usuario.cumple_mes}` : 'No definido'}</p>
                <p style="margin:8px 0 4px 0; color:#1f2937;">
                    <strong>⏱️ Horas Acumuladas (${anioActual}):</strong> 
                    <span style="background:#dcfce7; color:#166534; padding:3px 10px; border-radius:12px; font-weight:bold; font-size:14px;">
                        ${horasFormateadas} h
                    </span>
                </p>
                
                <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #d1d5db; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <p style="margin:0; color:#4b5563;">
                        <strong>🔑 Mi Token Individual:</strong> 
                        <span id="lbl-token-individual" style="font-family:monospace; background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:14px;">
                            ${escapeHTML(usuario.codigo_voluntario || 'SIN ASIGNAR')}
                        </span>
                    </p>
                    <button id="btn-cambiar-token-individual" style="padding:4px 10px; background:#1f2937; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
                        ✏️ Cambiar Token
                    </button>
                    <button id="btn-activar-push" style="padding:4px 10px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
                        🔔 Activar Alertas Móvil
                    </button>

                </div>
            </div>
            <h3 style="font-family:sans-serif; color:#1f2937; margin-bottom:15px;">📅 Mis Dispositivos y Eventos Suscritos</h3>
            <div id="profile-events-inner-list"></div>
        `;

        configurarBotonesPerfil(usuarioId, usuario);

        const eventosSuscritos = listaEventos.filter(evento =>
            listaSuscripciones.some(s => String(s.evento_id) === String(evento.id) && String(s.tipo).trim().toUpperCase() === evento.tipo)
        );

        renderListaTarjetas(document.getElementById('profile-events-inner-list'), eventosSuscritos);
    } catch (error) {
        console.error('Excepción en ProfileModule:', error);
        profileContainer.innerHTML = `<p style="color:#dc2626; padding:20px; font-family:sans-serif;">Error al cargar tu ficha personal: ${error.message}</p>`;
    }
}
// =========================================================================
// ARCHIVO: profile.js (BLOQUE 2: EVENTOS DE BOTONES Y TARJETAS SUSCRITAS)
// =========================================================================
function configurarBotonesPerfil(usuarioId, usuario) {
    document.getElementById('btn-logout-voluntario')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            cerrarSesionVoluntario();
        }
    });

    document.getElementById('btn-cambiar-token-individual')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const actualToken = usuario.codigo_voluntario || "";
        const nuevoToken = prompt("Introduce tu nuevo Token Individual de acceso:", actualToken);
        if (nuevoToken === null) return; 
        
        const tokenLimpio = nuevoToken.trim().toUpperCase();
        if (!tokenLimpio || tokenLimpio === actualToken) return; 

        try {
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ codigo_voluntario: tokenLimpio })
                .eq('id', usuarioId);

            if (updateError) {
                if (updateError.code === '23505') throw new Error("Este token ya está en uso por otro compañero.");
                throw updateError;
            }

            document.getElementById('lbl-token-individual').innerText = tokenLimpio;
            usuario.codigo_voluntario = tokenLimpio;
            alert("Token individual actualizado correctamente.");
        } catch (err) {
            alert(`Fallo al actualizar credencial: ${err.message}`);
        }
    });

    document.getElementById('btn-activar-push')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = e.target;
        btn.disabled = true;
        btn.innerText = "Activando...";

        const res = await registrarPushMovil(usuarioId);
        if (res?.ok) {
            btn.innerText = "✅ Alertas Activas";
            alert("Dispositivo vinculado correctamente en Supabase.");
        } else {
            btn.disabled = false;
            btn.innerText = "🔔 Activar Alertas Móvil";
            alert(`No se pudo activar: ${res?.error || 'Error desconocido'}`);
        }
    });
}

function renderListaTarjetas(container, eventos) {
    if (!container) return;
    container.innerHTML = '';

    if (eventos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 30px; text-align: center; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; font-family: sans-serif;">
                <p style="color: #4b5563; font-weight: 500; margin: 0 0 5px 0;">No figuras inscrito en ningún dispositivo actualmente.</p>
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">Puedes apuntarte a nuevos operativos y coberturas desde el panel principal.</p>
            </div>
        `;
        return;
    }

    const gridLayout = document.createElement('div');
    gridLayout.style.cssText = 'display: flex; flex-direction: column; gap: 15px; font-family: sans-serif;';

    eventos.forEach(evento => {
        const tarjeta = document.createElement('div');
        let borderStyle = '4px solid #9ca3af';
        if (evento.tipo === 'emergencias' || evento.tipo === 'EMR') borderStyle = '4px solid #dc2626';
        if (evento.tipo === 'operativos' || evento.tipo === 'OPR') borderStyle = '4px solid #0284c7';
        if (evento.tipo === 'preventivos' || evento.tipo === 'NRP') borderStyle = '4px solid #b45309';

        tarjeta.style.cssText = `background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; border-left: ${borderStyle}; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`;

        const tipoTexto = TIPO_MAP_TEXTO[evento.tipo] || evento.tipo;
        const tituloSuscripcion = evento.nombre || evento.titulo || 'Elemento sin título';
        const fechaSuscripcion = evento.fecha || 'Sin fecha asignada';

        tarjeta.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${escapeHTML(tituloSuscripcion)}</h4>
                <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 12px; background: #f3f4f6; color: #374151;">
                    ${tipoTexto}
                </span>
            </div>
            <p style="margin: 0 0 6px 0; color: #4b5563; font-size: 13px;"><strong>📅 Fecha:</strong> ${fechaSuscripcion}</p>
            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.4;">${escapeHTML(evento.descripcion || 'Sin descripción disponible.')}</p>
        `;

        gridLayout.appendChild(tarjeta);
    });

    container.appendChild(gridLayout);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
