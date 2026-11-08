// =========================================================================
// ARCHIVO: profile.js (PARTE 1: VISUALIZACIÓN Y CAMBIO DE TOKEN INDIVIDUAL)
// =========================================================================
import { db as supabase } from './supabase-config.js';
import { cerrarSesionVoluntario } from './app.js';

const TIPO_MAP_TEXTO = {
    'operativos': 'Operativo', 'preventivos': 'Preventivo', 'emergencias': 'Emergencia',
    'OPR': 'Operativo', 'NRP': 'Preventivo', 'EMR': 'Emergencia'
};

export async function initProfileScreen(usuarioId) {
    const profileContainer = document.getElementById('profile-subscriptions-container');
    if (!profileContainer) return;

    profileContainer.innerHTML = `<p class="loading-text" style="font-family:sans-serif; color:#4b5563;">Cargando tus datos y eventos suscritos...</p>`;

    try {
        // Traemos los metadatos y el código de voluntario activo
        const [usuarioRes, suscripcionesRes, eventosRes] = await Promise.all([
            supabase.from('usuarios').select('nombre, telefono, cumple_dia, cumple_mes, codigo_voluntario').eq('id', usuarioId).single(),
            supabase.from('suscripciones').select('evento_id, tipo').eq('usuario_id', usuarioId),
            fetch(`${supabase.functionsUrl}/admin-list-elements-ts?admin_id=${usuarioId}`)
        ]);

        if (usuarioRes.error) throw new Error(`Error al cargar perfil: ${usuarioRes.error.message}`);
        if (suscripcionesRes.error) throw new Error(`Error al cargar suscripciones: ${suscripcionesRes.error.message}`);
        if (!eventosRes.ok) throw new Error('Error al conectar con el microservicio de eventos.');

        const usuario = usuarioRes.data;
        // 🛠️ REPARACIÓN DE SINTAXIS: Se añade el array de contingencia [] antes del punto y coma
        const listaSuscripciones = suscripcionesRes.data || [];
        const { data } = await eventosRes.json();
        const listaEventos = data || [];

        // RENDERIZADO INTERACTIVO: Añadimos el botón de Modificar Código
        const headerHTML = `
            <div class="profile-card-header" style="background:#f3f4f6; padding:20px; border-radius:8px; margin-bottom:25px; font-family:sans-serif; border:1px solid #e5e7eb; position:relative;">
                <button id="btn-logout-voluntario" style="position:absolute; top:15px; right:15px; padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">
                    🚪 Salir
                </button>

                <h3 style="margin:0 0 10px 0; color:#1f2937;">👤 Ficha de Voluntario</h3>
                <p style="margin:4px 0; color:#4b5563;"><strong>Nombre:</strong> ${escapeHTML(usuario.nombre)}</p>
                <p style="margin:4px 0; color:#4b5563;"><strong>Teléfono:</strong> ${escapeHTML(usuario.telefono || 'No registrado')}</p>
                <p style="margin:4px 0; color:#4b5563;"><strong>Cumpleaños:</strong> ${usuario.cumple_dia && usuario.cumple_mes ? `${usuario.cumple_dia}/${usuario.cumple_mes}` : 'No definido'}</p>
                
                <!-- SECCIÓN DEL TOKEN INDIVIDUAL EDITABLE -->
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
                </div>
            </div>
            <h3 style="font-family:sans-serif; color:#1f2937; margin-bottom:15px;">📅 Mis Dispositivos y Eventos Suscritos</h3>
            <div id="profile-events-inner-list"></div>
        `;
        profileContainer.innerHTML = headerHTML;

        // LISTENER 1: CIERRE DE SESIÓN PROTEGIDO CON CORTA-PROPAGACIÓN
        document.getElementById('btn-logout-voluntario')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
                cerrarSesionVoluntario();
            }
        });

        // LISTENER 2: ACCIÓN REACTIVA PARA ACTUALIZAR EL TOKEN INDIVIDUAL
        document.getElementById('btn-cambiar-token-individual')?.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const actualToken = usuario.codigo_voluntario || "";
            const nuevoToken = prompt("Introduce tu nuevo Token Individual de acceso (Ej: V-104 o un PIN único):", actualToken);
            
            if (nuevoToken === null) return; 
            
            const tokenLimpio = nuevoToken.trim().toUpperCase();
            if (!tokenLimpio) {
                alert("El token de acceso no puede quedarse en blanco.");
                return;
            }

            if (tokenLimpio === actualToken) return; 

            try {
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ codigo_voluntario: tokenLimpio })
                    .eq('id', usuarioId);

                if (updateError) {
                    if (updateError.code === '23505') {
                        throw new Error("Este token ya está siendo utilizado por otro compañero. Por favor, introduce uno diferente.");
                    }
                    throw updateError;
                }

                document.getElementById('lbl-token-individual').innerText = tokenLimpio;
                usuario.codigo_voluntario = tokenLimpio;
                alert("Tu token individual de acceso se ha modificado correctamente.");

            } catch (err) {
                alert(`Fallo al actualizar credencial: ${err.message}`);
            }
        });

        const eventosSuscritos = listaEventos.filter(evento => {
            return listaSuscripciones.some(suscripcion => String(suscripcion.evento_id) === String(evento.id));
        });

        const listInnerContainer = document.getElementById('profile-events-inner-list');
        renderListaTarjetas(listInnerContainer, eventosSuscritos);

    } catch (error) {
        console.error('Excepción en ProfileModule:', error);
        profileContainer.innerHTML = `<p style="color:#dc2626; padding:20px;">Error al cargar tu ficha personal.</p>`;
    }
}




/**
 * Renderiza la colección de tarjetas de eventos suscritos en el contenedor del DOM
 * @param {HTMLElement} container - Contenedor interno exclusivo de la lista
 * @param {Array} eventos - Listado filtrado de eventos a los que se encuentra suscrito
 */
function renderListaTarjetas(container, eventos) {
    if (!container) return;
    container.innerHTML = ''; // Limpiar loaders previos

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
    gridLayout.style.display = 'flex';
    gridLayout.style.flexDirection = 'column';
    gridLayout.style.gap = '15px';
    gridLayout.style.fontFamily = 'sans-serif';

    eventos.forEach(evento => {
        const tarjeta = document.createElement('div');
        
        // Mapeo dinámico de estilos de borde por tipo de evento físico relacional
        let borderStyle = '4px solid #9ca3af'; // Por defecto
        if (evento.tipo === 'emergencias' || evento.tipo === 'EMR') borderStyle = '4px solid #dc2626'; // Emergencias
        if (evento.tipo === 'operativos' || evento.tipo === 'OPR') borderStyle = '4px solid #0284c7'; // Operativos
        if (evento.tipo === 'preventivos' || evento.tipo === 'NRP') borderStyle = '4px solid #b45309'; // Preventivos

        tarjeta.style.background = '#fff';
        tarjeta.style.padding = '15px';
        tarjeta.style.borderRadius = '6px';
        tarjeta.style.border = '1px solid #e5e7eb';
        tarjeta.style.borderLeft = borderStyle;
        tarjeta.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

        const tipoTexto = TIPO_MAP_TEXTO[evento.tipo] || evento.tipo;
        
        // 🛠️ REPARACIÓN DEFENSIVA: Si la columna física es 'titulo' en vez de 'nombre', se mapea correctamente
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

/**
 * Helper utilitario para evitar inyecciones XSS al renderizar texto dinámico introducido por usuarios
 * @param {string} str - Cadena de texto a sanitizar
 * @returns {string} Cadena de texto segura para insertar en HTML
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
