// =========================================================================
// ARCHIVO: js/navigation.js (BLOQUE 1: AUDIO, ENRUTADOR Y CARGA PÚBLICA)
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
    if (screenId === 'admin') {
        const adminBtn = document.querySelector('.bottom-nav .nav-btn[data-screen="admin"]');
        if (adminBtn && adminBtn.style.display === 'none') {
            console.warn("Intento de acceso no autorizado al panel de administración.");
            return;
        }
    }
    const screens = document.querySelectorAll('.app-screen'); 
    screens.forEach(screen => {
        screen.style.display = 'none'; 
        screen.classList.remove('screen-active');
    });

    const currentScreen = document.getElementById(screenId);
    if (currentScreen) {
        currentScreen.style.display = 'block'; 
        currentScreen.classList.add('screen-active');
    }

    if (screenId === 'perfil') {
        const currentUserId = window.usuario_id;
        if (currentUserId) {
            currentScreen.innerHTML = `<div style="padding:20px; font-family:sans-serif;"><div id="profile-subscriptions-container"></div></div>`;
            initProfileScreen(currentUserId);
        }
    }

    if (screenId === 'servicios' || screenId === 'emergencias') {
        cargarCatalogoPublicoVoluntarios(screenId);
    }
}

async function cargarCatalogoPublicoVoluntarios(screenId) {
    const contenedorPantalla = document.getElementById(screenId);
    if (!contenedorPantalla) return;

    contenedorPantalla.innerHTML = `<p style="padding:20px; font-family:sans-serif; color:#4b5563;">Consultando dispositivos disponibles...</p>`;

    try {
        const uId = window.usuario_id;
        const resSus = await supabase.from('suscripciones').select('evento_id, tipo').eq('usuario_id', uId);
        if (resSus.error) throw new Error(`Error en suscripciones: ${resSus.error.message}`);

        let elementos = [];
        if (screenId === 'servicios') {
            const [resOpr, resNrp] = await Promise.all([
                supabase.from('operativos').select('*').order('id', { ascending: false }),
                supabase.from('preventivos').select('*').order('id', { ascending: false })
            ]);
            if (resOpr.error) throw new Error(`Error operativos: ${resOpr.error.message}`);
            if (resNrp.error) throw new Error(`Error preventivos: ${resNrp.error.message}`);

            const oprs = (resOpr.data || []).map(i => ({ ...i, _tipo: 'OPR', _tabla: 'operativos', _color: '#0284c7', _badge: '🔧 OPERATIVO' }));
            const nrps = (resNrp.data || []).map(i => ({ ...i, _tipo: 'NRP', _tabla: 'preventivos', _color: '#b45309', _badge: '🛡️ PREVENTIVO' }));
            elementos = [...oprs, ...nrps].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        } else {
            const resEmr = await supabase.from('emergencias').select('*').order('id', { ascending: false });
            if (resEmr.error) throw new Error(`Error emergencias: ${resEmr.error.message}`);
            elementos = (resEmr.data || []).map(i => ({ ...i, _tipo: 'EMR', _tabla: 'emergencias', _color: '#dc2626', _badge: '🚨 EMERGENCIA' }));
        }

        renderizarListaPublica(contenedorPantalla, screenId, elementos, resSus.data || []);
    } catch (err) {
        contenedorPantalla.innerHTML = `<p style="padding:20px; font-family:sans-serif; color:#dc2626;">Error: ${err.message}</p>`;
    }
}
// =========================================================================
// ARCHIVO: js/navigation.js (BLOQUE 2: RENDERIZADO TARJETAS E INSCRIPCIÓN)
// =========================================================================
function renderizarListaPublica(contenedorPantalla, screenId, elementos, misSuscripciones) {
    const tituloCabecera = screenId === 'emergencias' ? '🚨 Emergencias Activas' : '📋 Servicios Programados';
    const colorCabecera = screenId === 'emergencias' ? '#dc2626' : '#1f2937';

    contenedorPantalla.innerHTML = `
        <div style="padding:20px; font-family:sans-serif;">
            <h2 style="color:${colorCabecera}; margin-bottom:20px;">${tituloCabecera}</h2>
            <div id="lista-publica-${screenId}" style="display:flex; flex-direction:column; gap:15px;"></div>
        </div>
    `;
    const listaCards = document.getElementById(`lista-publica-${screenId}`);

    if (elementos.length === 0) {
        listaCards.innerHTML = `<p style="color:#6b7280; font-size:14px; padding:10px; background:#f9fafb; border:1px dashed #d1d5db; border-radius:6px;">No constan servicios programados en esta sección actualmente.</p>`;
        return;
    }

    elementos.forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = `background:#fff; padding:15px; border-radius:8px; border:1px solid #e5e7eb; border-left:5px solid ${item._color}; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;`;

        const titulo = item.titulo || item.nombre || 'Servicio sin título';
        const metadata = item.lugar ? `📍 ${escapeHTML(item.lugar)} — 📅 ${item.fecha || ''}` : `📅 ${item.fecha || ''}`;

        const yaInscrito = misSuscripciones.some(s => 
            String(s.evento_id) === String(item.id) && 
            String(s.tipo).trim().toUpperCase() === item._tipo
        );

        const textoBoton = yaInscrito ? "❌ Darse de baja" : "✍️ Apuntarme";
        const estiloBoton = yaInscrito 
            ? `background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;`
            : `background:${item._color}; color:#fff; border:none; cursor:pointer;`;

        card.innerHTML = `
            <div style="flex:1; padding-right:15px;">
                <span style="display:inline-block; font-size:11px; font-weight:bold; color:${item._color}; background:#f3f4f6; padding:2px 6px; border-radius:4px; margin-bottom:6px;">${item._badge}</span>
                <h4 style="margin:0 0 5px 0; color:#111827; font-size:16px;">${escapeHTML(titulo)}</h4>
                <p style="margin:0 0 6px 0; color:#4b5563; font-size:13px;">${metadata}</p>
                <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.4;">${escapeHTML(item.descripcion) || 'Sin descripción adicional.'}</p>
            </div>
            <button class="btn-autounirse" data-estado="${yaInscrito ? 'inscrito' : 'libre'}"
                    style="padding:8px 14px; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; ${estiloBoton}">
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
                const exito = await ejecutarAutoInscripcion(item.id, item._tabla);
                if (exito) {
                    btn.setAttribute('data-estado', 'inscrito');
                    btn.style.cssText = `padding:8px 14px; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;`;
                    btn.innerText = "❌ Darse de baja";
                } else {
                    btn.innerText = "✍️ Apuntarme";
                }
            } else {
                const exitoBaja = await ejecutarBajaDirectaPostgres(item.id, item._tipo);
                if (exitoBaja) {
                    btn.setAttribute('data-estado', 'libre');
                    btn.style.cssText = `padding:8px 14px; border-radius:4px; font-weight:bold; font-size:13px; white-space:nowrap; background:${item._color}; color:#fff; border:none; cursor:pointer;`;
                    btn.innerText = "✍️ Apuntarme";
                } else {
                    btn.innerText = "❌ Darse de baja";
                }
            }
            btn.disabled = false;
        });

        listaCards.appendChild(card);
    });
}


// =========================================================================
// ARCHIVO: js/navigation.js (BLOQUE 3: INSCRIPCIÓN, BAJA Y NAVEGACIÓN)
// =========================================================================
async function ejecutarAutoInscripcion(elementoId, tablaDestino) {
    const voluntarioId = window.usuario_id;
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
                tipo: tablaDestino
            })
        });
        return res.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
}

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
        alert(`No se pudo procesar la baja: ${err.message}`);
        return false;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export async function initNavigation(callbacks = {}) {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
    const adminBtn = document.querySelector('.bottom-nav .nav-btn[data-screen="admin"]');
    
    if (adminBtn) adminBtn.style.display = 'none';

    const uId = window.usuario_id;
    let esAdmin = false;

    if (uId) {
        try {
            const { data } = await supabase
                .from('dispositivos')
                .select('rol')
                .eq('id', uId)
                .maybeSingle();

            if (data && data.rol === 'admin') {
                esAdmin = true;
                if (adminBtn) adminBtn.style.display = '';
            }
        } catch (err) {
            console.warn("No se pudo verificar el rol de administrador:", err);
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetScreen = button.getAttribute('data-screen');
            
            if (targetScreen === 'admin' && !esAdmin) {
                alert("Acceso denegado: No tienes permisos de administrador.");
                return;
            }

            if (targetScreen) {
                showScreen(targetScreen);
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                if (targetScreen === 'admin') cargarListadoAdmin();
                if (callbacks[targetScreen]) callbacks[targetScreen]();
            }
        });
    });
}
// =========================================================================
// ARCHIVO: js/navigation.js (BLOQUE 4: PANEL DE ADMINISTRACIÓN UNIFICADO)
// =========================================================================
export async function cargarListadoAdmin() {
    const adminScreen = document.getElementById('admin') || document.querySelector('.screen-active') || document.getElementById('app');
    if (!adminScreen) return;

    adminScreen.innerHTML = `
      <div style="font-family:sans-serif; width:100%;">
        <h2 style="margin-bottom:15px; color:#1f2937;">Panel de Control AVPCEA</h2>
        
        <div id="admin-subtabs" style="display:flex; flex-direction:column; gap:8px; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:20px;">
            <div style="display:flex; gap:6px; width:100%;">
                <button class="admin-tab-btn active" data-tab="tab-emergencias" style="flex:1; padding:10px 6px; border:none; border-radius:6px; background:#dc2626; color:#fff; font-weight:bold; cursor:pointer; font-size:13px;">🚨 Emergencias</button>
                <button class="admin-tab-btn" data-tab="tab-servicios" style="flex:1; padding:10px 6px; border:none; border-radius:6px; background:#f3f4f6; color:#374151; font-weight:bold; cursor:pointer; font-size:13px;">📋 Servicios (OPR/NRP)</button>
            </div>
            <div style="display:flex; gap:6px; width:100%;">
                <button class="admin-tab-btn" data-tab="tab-voluntarios" style="flex:1; padding:10px 6px; border:none; border-radius:6px; background:#f3f4f6; color:#374151; font-weight:bold; cursor:pointer; font-size:13px;">👥 Voluntarios</button>
                <button class="admin-tab-btn" data-tab="tab-sistema" style="flex:1; padding:10px 6px; border:none; border-radius:6px; background:#f3f4f6; color:#374151; font-weight:bold; cursor:pointer; font-size:13px;">⚙️ Sistema</button>
            </div>
        </div>

        <div id="tab-emergencias" class="admin-tab-content" style="display:block; background:#fff; padding:20px; border-radius:8px; border:1px solid #fca5a5; border-top:4px solid #dc2626;">
            <h3 style="margin-top:0; color:#dc2626; margin-bottom:15px;">🚨 Gestión de Emergencias Activas</h3>
            <form id="form-emergencias" style="display:flex; gap:10px; align-items:flex-end; margin-bottom:20px; flex-wrap:wrap;">
                <div style="flex:2; min-width:200px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">Título del Incidente:</label>
                    <input type="text" name="titulo" required placeholder="Ej. Incendio Forestal Sector Norte" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">Gravedad:</label>
                    <select name="nivel" style="width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px; height:35px;">
                        <option value="bajo">Bajo</option><option value="medio" selected>Medio</option><option value="alto">Alto</option>
                    </select>
                </div>
                <button type="submit" style="padding:9px 15px; background:#dc2626; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:35px;">Desplegar Alerta</button>
            </form>
            <div id="contenedor-listado-emergencias" style="background:#f9f9f9; padding:12px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <div id="tab-servicios" class="admin-tab-content" style="display:none; background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top:4px solid #0284c7;">
            <h3 style="margin-top:0; color:#1f2937; margin-bottom:15px;">📋 Gestión de Servicios (Operativos y Preventivos)</h3>
            <form id="form-servicios-unificado" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:20px;">
                <select name="tipo_servicio" required onchange="this.closest('.admin-tab-content').style.borderTopColor = this.value === 'OPR' ? '#0284c7' : '#b45309'" style="padding:8px; border:1px solid #ccc; border-radius:4px; font-weight:bold;">
                    <option value="OPR">🔧 Operativo (OPR)</option>
                    <option value="NRP">🛡️ Preventivo (NRP)</option>
                </select>
                <input type="text" name="titulo" placeholder="Título del servicio" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="text" name="lugar" placeholder="Ubicación / Lugar" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="date" name="fecha" required style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <textarea name="descripcion" placeholder="Descripción y detalles operativos..." rows="2" style="grid-column: 1 / -1; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"></textarea>
                <button type="submit" style="grid-column: 1 / -1; background:#1f2937; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:38px;">Publicar Servicio</button>
            </form>
            <div id="contenedor-listado-servicios" style="background:#f9f9f9; padding:12px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <div id="tab-voluntarios" class="admin-tab-content" style="display:none; background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top:4px solid #059669;">
            <h3 style="margin-top:0; color:#059669; margin-bottom:15px;">👥 Registro de Voluntarios</h3>
            <form id="form-nuevo-usuario" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <input type="text" id="usuario-nombre" placeholder="Nombre completo" required style="flex:2; min-width:160px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input type="text" id="usuario-codigo" placeholder="Cód. (Ej: V-104)" required style="flex:1; min-width:90px; padding:8px; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;">
                <input type="text" id="usuario-telefono" placeholder="Teléfono" style="flex:1; min-width:110px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button type="submit" style="padding:9px 15px; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Registrar</button>
            </form>
            <div id="contenedor-listado-usuarios" style="background:#f9f9f9; padding:12px; border-radius:6px; border:1px solid #e5e7eb;"></div>
        </div>

        <div id="tab-sistema" class="admin-tab-content" style="display:none; background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; border-top:4px solid #4b5563;">
            <h3 style="margin-top:0; color:#4b5563; margin-bottom:15px;">⚙️ Configuración del Ecosistema Remoto</h3>
            <form id="form-configuraciones-globales" style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">🔑 Nuevo Token Global de Acceso:</label>
                    <input type="text" id="cfg-token-global" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; margin-bottom:4px; font-size:13px; font-weight:bold; color:#4b5563;">🔄 Versión Mínima App:</label>
                    <input type="text" id="cfg-version-minima" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <button type="submit" style="padding:9px 15px; background:#4b5563; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; height:35px;">Guardar Parámetros</button>
            </form>
        </div>
      </div>
    `;

    const coloresTab = { 'tab-emergencias': '#dc2626', 'tab-servicios': '#0284c7', 'tab-voluntarios': '#059669', 'tab-sistema': '#4b5563' };
    const tabButtons = adminScreen.querySelectorAll('.admin-tab-btn');
    const tabContents = adminScreen.querySelectorAll('.admin-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            tabButtons.forEach(b => { b.style.background = '#f3f4f6'; b.style.color = '#374151'; b.classList.remove('active'); });
            tabContents.forEach(content => content.style.display = 'none');
            btn.style.background = coloresTab[targetId] || '#1f2937';
            btn.style.color = '#fff';
            btn.classList.add('active');
            const activePanel = document.getElementById(targetId);
            if (activePanel) activePanel.style.display = 'block';
        });
    });

    const adminModule = await import('./admin.js');
    adminModule.initAdminFormListeners();
    adminModule.cargarUsuariosAdmin();
    await adminModule.cargarTodosLosEventosEdge();
    if (adminModule.cargarConfiguracionesGlobalesForm) adminModule.cargarConfiguracionesGlobalesForm();
}

export async function cargarUsuariosAdmin() {
    const adminModule = await import('./admin.js');
    adminModule.cargarUsuariosAdmin();
}
