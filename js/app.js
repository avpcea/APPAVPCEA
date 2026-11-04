// =========================================================================
// ARCHIVO: app.js (PARTE 1 MODIFICADA: TOKEN GLOBAL DINÁMICO DESDE SUPABASE)
// =========================================================================
import { db as supabase } from './supabase-config.js';
import { initNavigation, showScreen } from './navigation.js';

const APP_VERSION_ACTUAL = "2.1.0"; // Versión física local actual del frontend

document.addEventListener("DOMContentLoaded", async () => {
    // 1. CONTROL DE VERSIÓN AUTOMATIZADO
    const versionValida = await verificarVersionApp();
    if (!versionValida) return; 

    // 2. COMPROBACIÓN DEL FILTRO 1: Token Global de Acceso (Persiste por pestaña)
    const tokenValidado = sessionStorage.getItem("token_global_aprobado");
    if (!tokenValidado) {
        // Consultamos el token fresco directamente desde la base de datos
        await solicitarTokenGlobalDinamico();
        return;
    }

    // 3. COMPROBACIÓN DEL FILTRO 2: Identificación de Voluntario Dinámica
    const usuarioIdGuardado = localStorage.getItem("usuario_id");
    
    if (usuarioIdGuardado) {
        window.usuario_id = usuarioIdGuardado;
        initNavigation();
        showScreen('home-screen'); 
    } else {
        solicitarIdentificacionVoluntario();
    }
});

/**
 * Consulta los parámetros del sistema para alertar sobre nuevas versiones
 */
async function verificarVersionApp() {
    try {
        const { data, error } = await supabase
            .from('configuraciones')
            .select('valor')
            .eq('clave', 'version_minima')
            .single();

        if (error) throw error;

        if (data && data.valor !== APP_VERSION_ACTUAL) {
            document.body.innerHTML = `
                <div style="padding:40px; text-align:center; font-family:sans-serif; background:#fef2f2; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <h2 style="color:#dc2626; margin-bottom:10px;">🔄 Actualización Requerida</h2>
                    <p style="color:#4b5563; max-width:400px; line-height:1.5;">Estás usando la versión v${APP_VERSION_ACTUAL}. Existe una versión crítica más reciente (v${data.valor}). Limpia la caché de tu navegador para actualizar de inmediato.</p>
                </div>
            `;
            localStorage.clear();
            return false;
        }
        return true;
    } catch (err) {
        console.warn("No se pudo verificar la versión contra Supabase, continuando:", err.message);
        return true; 
    }
}

/**
 * Descarga el token vigente de la base de datos y despliega la pasarela visual
 */
async function solicitarTokenGlobalDinamico() {
    let tokenRemoto = "";
    
    try {
        const { data, error } = await supabase
            .from('configuraciones')
            .select('valor')
            .eq('clave', 'token_global_acceso')
            .single();
            
        if (error) throw error;
        tokenRemoto = data?.valor;
    } catch (err) {
        console.error("Error crítico: No se pudo obtener el token de autorización remota.", err);
        document.body.innerHTML = `<p style="padding:20px; font-family:sans-serif; color:#dc2626; text-align:center;">Fallo de enlace de seguridad con Supabase. Contacte con Sistemas.</p>`;
        return;
    }

    document.body.innerHTML = `
        <div id="filtro-token" style="padding:30px; font-family:sans-serif; text-align:center; margin-top:15vh;">
            <h2 style="color:#1f2937;">Acceso al Ecosistema AVPCEA</h2>
            <p style="color:#6b7280; font-size:14px; margin-bottom:20px;">Introduce el token general de autorización de la agrupación.</p>
            <input type="password" id="input-token-global" placeholder="Token General de Acceso" style="padding:10px; border:1px solid #ccc; border-radius:4px; width:260px; text-align:center; margin-bottom:15px; font-size:16px;"><br>
            <button id="btn-validar-token" style="padding:10px 20px; background:#1f2937; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Validar Token</button>
            <p id="error-token" style="color:#dc2626; font-size:13px; margin-top:10px; display:none;">Token incorrecto. Acceso denegado.</p>
        </div>
    `;

    document.getElementById('btn-validar-token').addEventListener('click', () => {
        const input = document.getElementById('input-token-global').value.trim();
        
        // Validación contra el registro en tiempo real de la base de datos
        if (input === tokenRemoto) {
            sessionStorage.setItem("token_global_aprobado", "true");
            location.reload(); 
        } else {
            document.getElementById('error-token').style.display = 'block';
        }
    });
}
// =========================================================================
// ARCHIVO: app.js (PARTE 2: INTERFAZ DE IDENTIFICACIÓN DINÁMICA DE VOLUNTARIOS)
// =========================================================================

/**
 * Renderiza el Filtro 2: Formulario dinámico del Código Único de Voluntario (Reemplazo del teléfono)
 */
function solicitarIdentificacionVoluntario() {
    document.body.innerHTML = `
        <div id="filtro-identificacion" style="padding:30px; font-family:sans-serif; text-align:center; margin-top:15vh;">
            <h2 style="color:#1f2937;">Identificación de Voluntario</h2>
            <p style="color:#6b7280; font-size:14px; margin-bottom:20px;">Introduce tu código personal único de la agrupación para activar tu ficha.</p>
            
            <form id="form-identificar" style="display:inline-block;">
                <input type="text" id="input-codigo-voluntario" required placeholder="Ej: V-104" 
                       style="padding:10px; border:1px solid #ccc; border-radius:4px; width:260px; text-align:center; margin-bottom:15px; font-size:16px; text-transform:uppercase;"><br>
                <button type="submit" id="btn-validar-codigo" 
                        style="padding:10px 20px; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">
                    Acceder a mi Ficha
                </button>
            </form>
            
            <p id="error-identificacion" style="color:#dc2626; font-size:13px; margin-top:15px; display:none; max-width:300px; margin-left:auto; margin-right:auto; line-height:1.4;"></p>
        </div>
    `;

    const form = document.getElementById('form-identificar');
    const errorText = document.getElementById('error-identificacion');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorText.style.display = 'none';
        
        const btn = document.getElementById('btn-validar-codigo');
        btn.disabled = true;
        btn.innerText = "Verificando en Supabase...";

        const codigoIngresado = document.getElementById('input-codigo-voluntario').value.trim().toUpperCase();

        try {
            // Buscamos el ID real del usuario cruzando la columna de tu tabla física usuarios
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('id')
                .eq('codigo_voluntario', codigoIngresado)
                .maybeSingle();

            if (error) throw error;

            if (usuario && usuario.id) {
                // 1. Persistimos el ID de forma dinámica en el almacenamiento local del dispositivo
                localStorage.setItem("usuario_id", usuario.id);
                
                // 2. Seteamos la variable viva global requerida por el ecosistema nativo
                window.usuario_id = usuario.id;

                // 3. Restauramos la estructura original de la app y arrancamos la navegación
                location.reload(); 
            } else {
                btn.disabled = false;
                btn.innerText = "Acceder a mi Ficha";
                errorText.innerText = `El código "${codigoIngresado}" no coincide con ningún voluntario registrado. Verifícalo con Jefatura o Administración.`;
                errorText.style.display = 'block';
            }

        } catch (err) {
            console.error("Error crítico de autenticación:", err);
            btn.disabled = false;
            btn.innerText = "Acceder a mi Ficha";
            errorText.innerText = "Error de red o base de datos. Inténtalo de nuevo.";
            errorText.style.display = 'block';
        }
    });
}

/**
 * Función utilitaria expuesta para forzar un cierre de sesión manual y purgar estados
 */
export function cerrarSesionVoluntario() {
    localStorage.removeItem("usuario_id");
    delete window.usuario_id;
    location.reload();
}
