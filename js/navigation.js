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



// --- ⚙️ ORQUESTACIÓN MODULAR DEL PANEL DE ADMINISTRACIÓN ---

export async function cargarListadoAdmin() {
    const adminScreen = document.getElementById('admin') || document.querySelector('.screen-active') || document.getElementById('app');
    if (!adminScreen) return;

    // Pintamos el esqueleto HTML con el orden estructurado solicitado
    adminScreen.innerHTML = `
      <h2 style="margin-bottom:20px; font-family:sans-serif; color:#1f2937;">Panel de Control AVPCEA</h2>
      
      <div style="display: flex; flex-direction: column; gap: 25px; width:100%; font-family:sans-serif;">
      
        <!-- 🚨 1. EMERGENCIAS (MÁXIMA PRIORIDAD) -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #fca5a5; border-top: 4px solid #dc2626; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#dc2626; margin-bottom:15px;">🚨 Gestión de Emergencias Activas</h3>
            <form id="form-emergencias" style="display:flex; gap:10px; align-items:flex-end; margin-bottom:15px; flex-wrap:wrap;">
                <div style="flex:2; min-width:200px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">Título del Incidente:</label>
                    <input type="text" name="titulo" required placeholder="Ej. Incendio Forestal Sector Norte" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">Gravedad:</label>
                    <select name="nivel" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px; height:35px;">
                        <option value="bajo">Bajo</option>
                        <option value="medio" selected>Medio</option>
                        <option value="alto">Alto</option>
                    </select>
                </div>
                <button type="submit" style="padding:9px 15px; background:#dc2626; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:35px;">Desplegar Alerta</button>
            </form>
            <div id="contenedor-listado-emergencias" style="max-height:220px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <!-- 👥 2. GESTIÓN DE VOLUNTARIOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top: 4px solid #059669; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#059669; margin-bottom:15px;">👥 Registro de Voluntarios</h3>
            <form id="form-nuevo-usuario" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <div style="flex:2; min-width:180px;">
                    <input type="text" id="usuario-nombre" placeholder="Nombre completo del voluntario" required style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex:1; min-width:100px;">
                    <input type="text" id="usuario-codigo" placeholder="Cód. Voluntario (Ej: V-104)" required style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <input type="text" id="usuario-telefono" placeholder="Teléfono" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <input type="number" id="usuario-cumple-dia" placeholder="Día DD" min="1" max="31" style="width:65px; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                    <span style="font-weight:bold; color:#6b7280;">/</span>
                    <input type="number" id="usuario-cumple-mes" placeholder="Mes MM" min="1" max="12" style="width:65px; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <button type="submit" style="padding:9px 15px; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:35px;">Registrar</button>
            </form>
            <div id="contenedor-usuarios-admin" style="border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;"></div>
        </div>

        <!-- 🔧 3. DISPOSITIVOS OPERATIVOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top: 4px solid #0284c7; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#0284c7; margin-bottom:15px;">🔧 Configurar Dispositivos Operativos</h3>
            <form id="form-operativos" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:15px;">
                <input type="text" name="titulo" placeholder="Título del dispositivo" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="text" name="lugar" placeholder="Ubicación / Base" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="date" name="fecha" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button type="submit" style="background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:36px;">Crear Operativo</button>
            </form>
            <div id="contenedor-listado-operativos" style="max-height:180px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <!-- 🛡️ 4. SERVICIOS PREVENTIVOS -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top: 4px solid #b45309; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#b45309; margin-bottom:15px;">🛡️ Coberturas y Servicios Preventivos</h3>
            <form id="form-preventivos" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:15px;">
                <input type="text" name="titulo" placeholder="Título del servicio" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="text" name="lugar" placeholder="Lugar del evento" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="date" name="fecha" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button type="submit" style="background:#b45309; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:36px;">Crear Preventivo</button>
            </form>
            <div id="contenedor-listado-preventivos" style="max-height:180px; overflow-y:auto; background:#f9f9f9; padding:10px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <!-- ⚙️ 5. PARÁMETROS CRÍTICOS DEL SISTEMA (EXCLUSIVO JEFATURA) -->
        <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top: 4px solid #4b5563; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#4b5563; margin-bottom:15px;">⚙️ Configuración del Ecosistema Remoto</h3>
            <form id="form-configuraciones-globales" style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">🔑 Nuevo Token Global de Acceso:</label>
                    <input type="text" id="cfg-token-global" required placeholder="Cargando token actual..." style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">🔄 Versión Mínima App:</label>
                    <input type="text" id="cfg-version-minima" required placeholder="Ej: 2.1.0" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <button type="submit" style="padding:9px 15px; background:#4b5563; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:35px;">Guardar Parámetros</button>
            </form>
        </div>

      </div>
    `;

    // Inyección asíncrona: cargamos listeners de admin.js
    const adminModule = await import('./admin.js');
    adminModule.initAdminFormListeners();
    adminModule.cargarUsuariosAdmin();
    await adminModule.cargarTodosLosEventosEdge();
    adminModule.cargarConfiguracionesGlobalesForm(); // 🚀 Carga inicial del formulario técnico
}

export async function cargarUsuariosAdmin() {
    const adminModule = await import('./admin.js');
    adminModule.cargarUsuariosAdmin();
}
