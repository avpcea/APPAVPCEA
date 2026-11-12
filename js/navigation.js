// =========================================================================
// ARCHIVO: navigation.js (PARTE 1A: AUDIO E INTERCEPTOR CENTRAL DE PANTALLAS)
// =========================================================================
import { db as supabase } from './supabase-config.js';
import { initProfileScreen } from './profile.js';

let ac = null, os = null;

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

    // 🌟 INTERCEPTOR 1: Renderizado asíncrono de la Ficha Personal
    if (screenId === 'perfil') {
        const currentUserId = window.usuario_id;
        if (currentUserId) {
            currentScreen.innerHTML = `<div style="padding:20px; font-family:sans-serif;"><div id="profile-subscriptions-container"></div></div>`;
            initProfileScreen(currentUserId);
        }
    }

    // 🌟 INTERCEPTOR 2: Catálogos públicos reactivos de los Voluntarios
    if (screenId === 'operativos' || screenId === 'preventivos' || screenId === 'emergencias') {
        cargarCatalogoPublicoVoluntarios(screenId);
    }
}
// =========================================================================
// ARCHIVO: navigation.js (PARTE 1B: MOTOR DE RENDERIZADO DEL CATÁLOGO PÚBLICO)
// =========================================================================

/**
 * Descarga y renderiza el catálogo unificado, distinguiendo estrictamente por Tipo + ID,
 * y habilita botones reversibles para apuntarse y borrarse en tiempo real.
 */
async function cargarCatalogoPublicoVoluntarios(screenId) {
    const contenedorPantalla = document.getElementById(screenId);
    if (!contenedorPantalla) return;

    contenedorPantalla.innerHTML = `<p style="padding:20px; font-family:sans-serif; color:#4b5563;">Consultando dispositivos disponibles...</p>`;

    const titulosSeccion = { 'emergencias': '🚨 Emergencias Activas', 'operativos': '🔧 Dispositivos Operativos', 'preventivos': '🛡️ Coberturas Preventivas' };
    const colorSeccion = { 'emergencias': '#dc2626', 'operativos': '#0284c7', 'preventivos': '#b45309' };

    const traductorTipoBD = {
        'operativos': 'OPR',
        'preventivos': 'NRP',
        'emergencias': 'EMR'
    };

    try {
        const uId = window.usuario_id;

        const [eventosRes, misSuscripcionesRes] = await Promise.all([
            fetch(`${supabase.functionsUrl}/admin-list-elements-ts?admin_id=${uId}`),
            supabase.from('suscripciones').select('evento_id, tipo').eq('usuario_id', uId)
        ]);

        if (!eventosRes.ok) throw new Error('Error al conectar con el microservicio.');
        if (misSuscripcionesRes.error) throw new Error(`Error en tabla suscripciones: ${misSuscripcionesRes.error.message}`);

        const { data } = await eventosRes.json();
        const listaGlobal = data || [];
        const misSuscripciones = misSuscripcionesRes.data || [];

        const elementosFiltrados = listaGlobal.filter(item => String(item.tipo).toLowerCase() === screenId);

        let html = `
            <div style="padding:20px; font-family:sans-serif;">
                <h2 style="color:${colorSeccion[screenId]}; margin-bottom:20px;">${titulosSeccion[screenId]}</h2>
                <div id="lista-publica-${screenId}" style="display:flex; flex-direction:column; gap:15px;"></div>
            </div>
        `;
        contenedorPantalla.innerHTML = html;
        const listaCardsContainer = document.getElementById(`lista-publica-${screenId}`);

        if (elementosFiltrados.length === 0) {
            listaCardsContainer.innerHTML = `<p style="color:#6b7280; font-size:14px; padding:10px; background:#f9fafb; border:1px dashed #d1d5db; border-radius:6px;">No constan servicios programados en esta sección actualmente.</p>`;
            return;
        }

        elementosFiltrados.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `background:#fff; padding:15px; border-radius:8px; border:1px solid #e5e7eb; border-left:5px solid ${colorSeccion[screenId]}; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;`;

            const titulo = item.titulo || item.nombre || 'Servicio sin título';
            const metadata = item.lugar ? `📍 ${item.lugar} — 📅 ${item.fecha || ''}` : `📅 ${item.fecha || ''}`;

            const codigoCortoEsperado = traductorTipoBD[String(item.tipo).toLowerCase()];
            const yaInscrito = misSuscripciones.some(s => {
                const mismoId = String(s.evento_id) === String(item.id);
                const mismoTipo = String(s.tipo).toUpperCase() === String(codigoCortoEsperado);
                return mismoId && mismoTipo;
            });

            let textoBoton = "✍️ Apuntarme";
            let estiloBoton = `background:${colorSeccion[screenId]}; color:#fff; cursor:pointer;`;
            if (yaInscrito) {
                textoBoton = "❌ Darse de baja";
                estiloBoton = `background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;`;
            }

            card.innerHTML = `
                <div style="flex:1; padding-right:15px;">
                    <h4 style="margin:0 0 5px 0; color:#111827; font-size:16px;">${escapeHTML(titulo)}</h4>
                    <p style="margin:0 0 6px 0; color:#4b5563; font-size:13px;">${metadata}</p>
                    <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.4;">${item.descripcion || 'Sin descripción adicional.'}</p>
                </div>
                <button class="btn-autounirse" data-id="${item.id}" data-tipo="${item.tipo}" data-estado="${yaInscrito ? 'inscrito' : 'libre'}"
                        style="padding:8px 14px; border:none; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; ${estiloBoton}">
                    ${textoBoton}
                </button>
            `;

            card.querySelector('.btn-autounirse').addEventListener('click', async (e) => {
                e.preventDefault();
                const btn = e.target;
                const estadoActual = btn.getAttribute('data-estado');
                btn.disabled = true;
                btn.innerText = "Procesando...";

                if (estadoActual === 'libre') {
                    const exito = await ejecutarAutoInscripcion(item.id, item.tipo);
                    if (exito) {
                        btn.setAttribute('data-estado', 'inscrito');
                        btn.style.cssText = `padding:8px 14px; border:none; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;`;
                        btn.innerText = "❌ Darse de baja";
                    } else {
                        btn.innerText = "✍️ Apuntarme";
                    }
                } else {
                    const exitoBaja = await ejecutarBajaDirectaPostgres(item.id, codigoCortoEsperado);
                    if (exitoBaja) {
                        btn.setAttribute('data-estado', 'libre');
                        btn.style.cssText = `padding:8px 14px; border:none; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; background:${colorSeccion[screenId]}; color:#fff; cursor:pointer;`;
                        btn.innerText = "✍️ Apuntarme";
                    } else {
                        btn.innerText = "❌ Darse de baja";
                    }
                }
                btn.disabled = false;
            });

            listaCardsContainer.appendChild(card);
        });

    } catch (err) {
        contenedorPantalla.innerHTML = `<p style="padding:20px; font-family:sans-serif; color:#dc2626;">Error al cargar el calendario: ${err.message}</p>`;
    }
}
// =========================================================================
// ARCHIVO: navigation.js (PARTE 1C: OPERACIONES ASÍNCRONAS E INICIALIZACIÓN)
// =========================================================================

/**
 * Función puente que impacta la Edge Function de suscripciones usando el usuario logueado
 */
async function ejecutarAutoInscripcion(elementoId, tipoOriginal) {
    const voluntarioId = window.usuario_id;
    let tipoCompleto = "operativos";
    const tNorm = String(tipoOriginal).toLowerCase();
    if (tNorm === "preventivos" || tNorm === "nrp") tipoCompleto = "preventivos";
    if (tNorm === "emergencias" || tNorm === "emr") tipoCompleto = "emergencias";

    const apiKeySegura = supabase.supabaseKey || "";

    try {
        const res = await fetch(`${supabase.functionsUrl}/admin-create-suscripcion-ts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKeySegura}`
            },
            body: JSON.stringify({
                usuario_id: voluntarioId,
                evento_id: String(elementoId),
                tipo: tipoCompleto
            })
        });

        return res.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * Ejecuta el borrado directo de la suscripción cruzando de forma estricta ID + Tipo Corto físico
 */
async function ejecutarBajaDirectaPostgres(elementoId, codigoCortoTipo) {
    const voluntarioId = window.usuario_id;
    try {
        const { error } = await supabase
            .from('suscripciones')
            .delete()
            .eq('usuario_id', voluntarioId)
            .eq('evento_id', String(elementoId))
            .eq('tipo', codigoCortoTipo);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error al procesar baja en Postgres:", err.message);
        alert(`No se pudo procesar la baja: ${err.message}`);
        return false;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Inicializador de la barra de navegación inferior automatizada con Admin
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
                
                // Si el voluntario entra a la pestaña Admin, autoejecutamos el esqueleto y sus cargas Edge
                if (targetScreen === 'admin') {
                    cargarListadoAdmin();
                }

                if (callbacks[targetScreen]) callbacks[targetScreen]();
            }
        });
    });
}
