// profile.js - Gestión nativa de la ficha personal del voluntario
import { supabase } from './supabase-config.js';

// Mapeo inverso para presentación visual en el frontend
const TIPO_MAP_TEXTO = {
    'OPR': 'Operativo',
    'NRP': 'Preventivo',
    'EMR': 'Emergencia' // Manteniendo consistencia por si escala la BD
};

/**
 * Inicializa y renderiza la pantalla de perfil del voluntario activo
 * @param {string} usuarioId - Recuperado de la variable de sesión activa
 */
export async function initProfileScreen(usuarioId) {
    const profileContainer = document.getElementById('profile-subscriptions-container');
    if (!profileContainer) return;

    // 1. Estado de carga (Visual skeleton nativo)
    profileContainer.innerHTML = `<p class="loading-text">Cargando tus eventos suscritos...</p>`;

    try {
        // 2. Consumo en paralelo de microservicios mediante queries optimizadas
        // Usamos admin-list-users-ts pasándole el id para aislar sus datos/suscripciones
        // y admin-list-elements-ts para el catálogo de eventos disponibles
        const [suscripcionesRes, elementosRes] = await Promise.all([
            fetch(`${supabase.functionsUrl}/admin-list-users-ts?usuario_id=${usuarioId}`),
            fetch(`${supabase.functionsUrl}/admin-list-elements-ts`)
        ]);

        if (!suscripcionesRes.ok || !elementosRes.ok) {
            throw new Error('Error en la comunicación con las Edge Functions.');
        }

        const resSuscripciones = await suscripcionesRes.json();
        const resElementos = await elementosRes.json();

        // 3. Extracción y cruce de datos reactivo en cliente
        // Extraemos las suscripciones del voluntario y los elementos globales
        const listaSuscripciones = resSuscripciones.suscripciones || [];
        const listaElementos = resElementos.elementos || [];

        // Filtramos la lista global de elementos usando coincidencia estricta de strings por 'evento_id'
        const eventosSuscritos = listaElementos.filter(elemento => {
            return listaSuscripciones.some(suscripcion => 
                String(suscripcion.evento_id) === String(elemento.id)
            );
        });

        // 4. Renderizado Final en el DOM
        renderEventosSuscritos(profileContainer, eventosSuscritos);

    } catch (error) {
        console.error('Error en ProfileModule:', error);
        profileContainer.innerHTML = `
            <div class="error-container">
                <p>Error al cargar el listado de eventos de tu ficha personal.</p>
                <button id="btn-retry-profile" class="btn-retry">Reintentar</button>
            </div>
        `;
        
        document.getElementById('btn-retry-profile')?.addEventListener('click', () => {
            initProfileScreen(usuarioId);
        });
    }
}

/**
 * Renderiza los elementos vinculados en formato de tarjetas legibles e inyección segura
 */
function renderEventosSuscritos(container, eventos) {
    container.innerHTML = ''; // Limpiar loader

    if (eventos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No constas como inscrito en ningún evento actualmente.</p>
                <p class="subtitle">Puedes apuntarte a nuevos dispositivos desde el panel de control.</p>
            </div>
        `;
        return;
    }

    const listElement = document.createElement('div');
    listElement.className = 'profile-events-grid';

    eventos.forEach(evento => {
        const card = document.createElement('div');
        // Aseguramos clase CSS basada en el tipo físico de la BD ('OPR', 'NRP')
        card.className = `event-profile-card border-${evento.tipo.toLowerCase()}`;
        
        const tipoLegible = TIPO_MAP_TEXTO[evento.tipo] || evento.tipo;

        card.innerHTML = `
            <div class="card-badge-container">
                <span class="badge badge-${evento.tipo.toLowerCase()}">${tipoLegible}</span>
            </div>
            <h4 class="profile-event-title">${escapeHTML(evento.nombre)}</h4>
            <p class="profile-event-date">📅 ${evento.fecha || 'Fecha no definida'}</p>
            <p class="profile-event-desc">${escapeHTML(evento.descripcion || 'Sin descripción disponible.')}</p>
        `;

        listElement.appendChild(card);
    });

    container.appendChild(listElement);
}

// Sanitización contra ataques XSS para strings cargados por usuarios/coordinadores
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
