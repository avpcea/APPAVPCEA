// js/navigation.js

// Importamos la conexión segura de tu configuración local
import { db as supabase } from './supabase-config.js';

// Estados locales de la alerta de audio
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

    // Pintamos el esqueleto HTML con el orden estructurado solicitado (Emergencias ARRIBA del todo)
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

      </div>
    `;

    // 🚀 Inyección asíncrona limpia: Importamos el módulo y disparamos sus cargas de Edge Functions
    const adminModule = await import('./admin.js');
    adminModule.initAdminFormListeners();
    adminModule.cargarEmergencias();
    adminModule.cargarUsuariosAdmin();
    adminModule.cargarOperativos();
    adminModule.cargarPreventivos();
}

// Función puente para mantener compatibilidad con modales externos de actualización
export async function cargarUsuariosAdmin() {
    const adminModule = await import('./admin.js');
    adminModule.cargarUsuariosAdmin();
}
