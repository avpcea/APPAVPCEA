import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

const clienteSupabase = createClient(URL, KEY);
window.supabase = clienteSupabase;
window.supabaseClient = clienteSupabase;

// 🌟 EL NUEVO PUENTE: Forzamos a que la función sea visible globalmente antes de que se declare abajo
window.cargarFichaVoluntario = async function(...args) {
    if (typeof cargarFichaVoluntario === "function") return await cargarFichaVoluntario(...args);
};

const BASE_FN = `${URL}/functions/v1`;


// ==========================================
// CARGA DINÁMICA DESDE SUPABASE
// ==========================================
let ac=null,os=null;const cg={operativos:false,preventivos:false,emergencias:false};
async function cargarOperativos() {
    const contenedor = document.getElementById('operativos');
    try {
        // 🌟 Modificado para usar 'fecha_inicio' que sí existe en tu DDL
        const { data, error } = await supabase
            .from('operativos')
            .select('titulo, lugar, fecha_inicio, descripcion')
            .order('fecha_inicio', { ascending: true });

        if (error) throw error;

        // Si hay registros, renderizamos las tarjetas nativas
        if (data && data.length > 0) {
            let html = `<h3>Próximos Operativos</h3>`;
            
            data.forEach(op => {
                // Formateamos la fecha nativa de Postgres a formato legible en España
                const fecha = new Date(op.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                
                html += `
                    <div class="card" style="border-left: 5px solid #ff6600; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${op.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Fecha/Hora:</strong> ${fecha}</p>
                        ${op.lugar ? `<p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${op.lugar}</p>` : ''}
                        ${op.descripcion ? `<p style="margin: 8px 0 0 0; color: #555; font-size: 0.95rem;">${op.descripcion}</p>` : ''}
                    </div>`;
            });
            
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `
                <h3>Próximos Operativos</h3>
                <p class="placeholder-text">No hay operativos activos asignados en este momento.</p>`;
        }
    } catch (err) {
        console.error("Error al cargar operativos:", err.message);
        contenedor.innerHTML = `<h3 style="text-align: center;">Próximos Operativos</h3>
                                <p style="color: red;">Error al conectar con la base de datos.</p>`;
    }
}

async function cargarPreventivos() {
    const contenedor = document.getElementById('preventivos');
    try {
        // 🌟 Modificado para usar 'fecha_inicio' en lugar de 'inicio'
        const { data, error } = await supabase
            .from('preventivos')
            .select('titulo, lugar, fecha_inicio, descripcion')
            .order('fecha_inicio', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            let html = `<h3>Dispositivos Preventivos</h3>`;
            
            data.forEach(prev => {
                // Formateamos la fecha en formato local de España
                const fecha = new Date(prev.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                
                html += `
                    <div class="card" style="border-left: 5px solid #007bff; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${prev.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Fecha/Hora:</strong> ${fecha}</p>
                        ${prev.lugar ? `<p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${prev.lugar}</p>` : ''}
                        ${prev.descripcion ? `<p style="margin: 8px 0 0 0; color: #555; font-size: 0.95rem;">${prev.descripcion}</p>` : ''}
                    </div>`;
            });
            
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `
                <h3>Dispositivos Preventivos</h3>
                <p class="placeholder-text">Consulta y apúntate a los próximos preventivos de El Arenal.</p>`;
        }
    } catch (err) {
        console.error("Error al cargar preventivos:", err.message);
        contenedor.innerHTML = `<h3 style="text-align: center;">Dispositivos Preventivos</h3>
                                <p style="color: red;">Error al conectar con la base de datos.</p>`;
    }
}

function activarPitidoEmergencia(){
  if(os)return;try{ac=new(window.AudioContext||window.webkitAudioContext)();os=ac.createOscillator();const g=ac.createGain();os.type='sine';os.frequency.setValueAtTime(880,ac.currentTime);g.gain.setValueAtTime(0.4,ac.currentTime);os.connect(g);g.connect(ac.destination);os.start();}catch(e){}
}

function detenerPitidoEmergencia(){
  if(os){try{os.stop();os.disconnect();if(ac&&ac.state!=='closed')ac.close();}catch(e){}os=null;ac=null;}
}

async function cargarEmergencias() {
    const contenedor = document.getElementById('emergencias');
    try {
        // 🌟 Modificado para usar tu estructura real: fecha_inicio y filtrar activas primero
        const { data, error } = await supabase
            .from('emergencias')
            .select('titulo, fecha_inicio, nivel, activa')
            .order('fecha_inicio', { ascending: false }); // Las más recientes arriba

        if (error) throw error;

        // Comprobamos si hay alguna emergencia que esté ACTIVA en el sistema
        const tieneEmergenciaActiva = data && data.some(em => em.activa === true);

        // Control de sonido automático basado en el estado real de la base de datos
        if (tieneEmergenciaActiva) {
            if (typeof activarPitidoEmergencia === 'function') {
                activarPitidoEmergencia();
            }
        } else {
            if (typeof detenerPitidoEmergencia === 'function') {
                detenerPitidoEmergencia();
            }
        }

        // Renderizado del contenido en el DOM
        if (data && data.length > 0) {
            let html = `<h3>Alertas de Emergencia</h3>`;
            
            data.forEach(em => {
                const fecha = new Date(em.fecha_inicio).toLocaleString('es-ES', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                });
                
                // Determinamos el estilo según si está activa o es del pasado
                const badgeActiva = em.activa 
                    ? `<span style="background-color: #dc3545; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; float: right;">ACTIVA</span>` 
                    : `<span style="background-color: #6c757d; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; float: right;">CERRADA</span>`;

                html += `
                    <div class="card" style="border-left: 5px solid #dc3545; margin-bottom: 12px; background-color: ${em.activa ? '#fff5f5' : '#ffffff'};">
                        ${badgeActiva}
                        <h4 style="margin: 0 0 5px 0; color: #dc3545;">🚨 ${em.titulo}</h4>
                        <p style="margin: 4px 0;"><strong>📅 Inicio:</strong> ${fecha}</p>
                        <p style="margin: 4px 0;"><strong>Nivel de Riesgo:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #dc3545;">${em.nivel || 'medio'}</span></p>
                    </div>`;
            });
            
            contenedor.innerHTML = html;
        } else {
            // Si la tabla está totalmente vacía
            contenedor.innerHTML = `
                <div class="card card-danger">
                    <h3>Alertas de Emergencia</h3>
                    <p class="placeholder-text">Sin alertas de última hora de la central.</p>
                </div>`;
        }
    } catch (err) {
        console.error("Error al cargar emergencias:", err.message);
        contenedor.innerHTML = `<h3>Alertas de Emergencia</h3><p style="color: red;">Error al conectar con el centro de alertas.</p>`;
    }
}

async function estaSuscrito(t,id){
  const u=localStorage.getItem("usuario_id"),tc=t==="operativos"?"OPR":"NRP";
  const{data:d}=await supabase.from("suscripciones").select("*").eq("usuario_id",u).eq("tipo",tc).eq("evento_id",String(id)).maybeSingle();return!!d;
}

window.toggleSuscripcion=async function(t,id){
  const u=localStorage.getItem("usuario_id"),sc=await estaSuscrito(t,id),tc=t==="operativos"?"OPR":"NRP";
  if(!sc){
    await fetch(`${BASE_FN}/admin-create-suscripcion-ts`,{method:"POST",headers:{"Content-Type":"application/json","apiKey":supabase.supabaseKey,"Authorization":`Bearer ${(await supabase.auth.getSession()).data.session?.access_token||''}`},body:JSON.stringify({usuario_id:u,evento_id:Number(id),tipo:t,admin_id:u})});
    alert("Suscrito.");
  }else{await supabase.from("suscripciones").delete().eq("usuario_id",u).eq("tipo",tc).eq("evento_id",String(id));alert("Cancelado.");}
  if(t==="preventivos")cargarPreventivos();if(t==="operativos")cargarOperativos();await cargarFichaVoluntario();
};

async function cargarFichaVoluntario() {
    const nombreEL = document.getElementById('voluntario-nombre');
    const telefonoEL = document.getElementById('voluntario-telefono');
    const horasEL = document.getElementById('voluntario-horas');

    try {
        // 1. Leer el usuario_id guardado
        const usuarioId = localStorage.getItem('usuario_id');
        
        if (!usuarioId) {
            console.warn("No se encontró 'usuario_id' en el localStorage.");
            if (nombreEL) nombreEL.textContent = "ID no encontrado / Sin sesión";
            return;
        }

        // 2. Consulta limpia a Supabase apuntando a la tabla correcta: 'usuarios'
        const { data, error } = await supabase
            .from('usuarios') // 🌟 ¡Corregido aquí!
            .select('nombre, telefono, horas')
            .eq('id', usuarioId)
            .single();

        if (error) throw error;

        // 3. Pintar con éxito en el DOM
        if (data) {
            if (nombreEL) nombreEL.textContent = data.nombre || 'Sin nombre';
            if (telefonoEL) telefonoEL.textContent = data.telefono || '-';
            if (horasEL) horasEL.textContent = data.horas || '0';
        }

    } catch (err) {
        console.error("Error al cargar desde Supabase:", err.message);
        if (nombreEL) nombreEL.textContent = "Error de conexión";
    }
}

// 🌟 EL CONEJO DE LA CHISTERA: Exportamos al entorno global
window.cargarFichaVoluntario = cargarFichaVoluntario;

// 🌟 EL CONEJO DE LA CHISTERA: Exportamos la función al entorno global window
// Esto permite que el flujo de arranque la ejecute sin restricciones de módulo
window.cargarFichaVoluntario = cargarFichaVoluntario;

function showScreen(screenId) {
    // Selecciona todas tus vistas/pantallas principales
    const screens = document.querySelectorAll('.app-screen'); 
    
    screens.forEach(screen => {
        // Oculta todas las pantallas
        screen.style.display = 'none'; 
        screen.classList.remove('screen-active');
    });

    // Muestra la pantalla seleccionada
    const currentScreen = document.getElementById(screenId);
    if (currentScreen) {
        currentScreen.style.display = 'block'; // O 'flex' según tu styles.css
        currentScreen.classList.add('screen-active');
        
        // OPTIONAL: Disparar cargas de datos específicas si es necesario
        // ej: if(screenId === 'operativos') cargarOperativosDesdeSupabase();
    } else {
        console.warn(`La pantalla con ID "${screenId}" no existe en el DOM.`);
    }
}

async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");if (!cont) return;cont.innerHTML = "<p>Cargando listados...</p>";
  try {
    const [operativos, preventivos] = await Promise.all([
      supabase.from("operativos").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("preventivos").select("*").order("fecha_inicio", { ascending: false })
    ]);
    cont.innerHTML = "<h3>Operativos</h3>";
    operativos.data?.forEach(op => {
      const estaCerrado = op.fecha_fin !== null;
      let hOp = "<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:"+(estaCerrado ? "0.6":"1")+";'>";
      hOp += "<strong>"+op.titulo+"</strong> - Lugar: "+(op.lugar || "—")+"<br>";
      hOp += "Fecha de evento: "+(op.fecha || "—")+" | Inicio: "+(op.fecha_inicio ? op.fecha_inicio.substring(0,16).replace("T"," "):"—")+"<br>";
      if(estaCerrado) hOp += "Fecha fin: "+op.fecha_fin.substring(0,16).replace("T"," ")+"<br>";
      hOp += estaCerrado ? "✓ Cerrado " : "<button onclick=\"window.ejecutarCierreEvento('"+op.id+"', 'operativos')\">Cerrar</button> ";
      hOp += "<button onclick=\"window.ejecutarEliminacionElemento('operativos', '"+op.id+"')\">Eliminar</button></div>";
      cont.innerHTML += hOp;
    });
    cont.innerHTML += "<h3>Preventivos</h3>";
    preventivos.data?.forEach(pr => {
      const estaCerrado = pr.fecha_fin !== null;
      let hPr = "<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:"+(estaCerrado ? "0.6":"1")+";'>";
      hPr += "<strong>"+pr.titulo+"</strong> - Lugar: "+(pr.lugar || "—")+"<br>";
      hPr += "Fecha de evento: "+(pr.fecha || "—")+" | Inicio: "+(pr.fecha_inicio ? pr.fecha_inicio.substring(0,16).replace("T"," "):"—")+"<br>";
      if(estaCerrado) hPr += "Fecha fin: "+pr.fecha_fin.substring(0,16).replace("T"," ")+"<br>";
      hPr += estaCerrado ? "✓ Cerrado " : "<button onclick=\"window.ejecutarCierreEvento('"+pr.id+"', 'preventivos')\">Cerrar</button> ";
      hPr += "<button onclick=\"window.ejecutarEliminacionElemento('preventivos', '"+pr.id+"')\">Eliminar</button></div>";
      cont.innerHTML += hPr;
    });
  } catch (e) {}
}

async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios-lista") || document.getElementById("admin-usuarios");if (!cont) return;
  try {
    const { data: usuarios } = await supabase.from("usuarios").select("id, nombre, telefono, cumple_mes, cumple_dia, dispositivos(rol)").order("nombre", { ascending: true });
    cont.innerHTML = "";
    usuarios?.forEach(usr => {
      const rolReal = usr.dispositivos?.rol || "normal";
      const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? (String(usr.cumple_dia).padStart(2,"0")+"/"+String(usr.cumple_mes).padStart(2,"0")) : "—";
      cont.innerHTML += "<div style='padding:6px; border-bottom:1px solid #eee;'><strong>"+usr.nombre+"</strong> ("+rolReal.toUpperCase()+") - Cumpleaños: "+cumpleStr+" <button onclick=\"window.abrirModalEdicionUsuario('"+usr.id+"')\">Editar</button> <button onclick=\"window.ejecutarEliminacionElemento('usuarios', '"+usr.id+"')\">Baja</button></div>";
    });
  } catch (e) {}
}

async function cargarListadoHorasVoluntarios() {
  const cont = document.getElementById("admin-contabilidad-horas");if (!cont) return;
  try {
    const { data: registros } = await supabase.from("horas").select("usuario_id, tipo, horas, anio, usuarios(nombre)").order("anio", { ascending: false });
    cont.innerHTML = "<h4>Desglose de Horas Anuales</h4>";
    registros?.forEach(reg => {
      cont.innerHTML += "<p><strong>"+(reg.usuarios?.nombre || "Voluntario")+"</strong> - "+reg.tipo+": "+parseFloat(reg.horas).toFixed(2)+" hs ("+reg.anio+")</p>";
    });
  } catch (e) {}
}

window.abrirModalEdicionUsuario = async function(id) {
  try {
    const { data: usr } = await supabase.from("usuarios").select("*").eq("id", id).single();
    const nuevoNombre = prompt("Nombre:", usr.nombre); if (!nuevoNombre) return;
    const nuevoTelefono = prompt("Teléfono:", usr.telefono); if (!nuevoTelefono) return;
    const cumpleActual = (usr.cumple_dia && usr.cumple_mes) ? (String(usr.cumple_dia).padStart(2,"0")+"/"+String(usr.cumple_mes).padStart(2,"0")) : "DD/MM";
    const nuevoCumple = prompt("Cumpleaños (DD/MM):", cumpleActual); if (!nuevoCumple) return;
    const datos = { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim() };
    if (nuevoCumple.includes("/")) {
      const p = nuevoCumple.split("/");const d = parseInt(p[0], 10), m = parseInt(p[1], 10);
      if (!isNaN(d) && !isNaN(m)) { datos.cumple_dia = d; datos.cumple_mes = m; }
    }
    await supabase.from("usuarios").update(datos).eq("id", id);
    alert("Actualizado."); await cargarUsuariosAdmin(); await cargarListadoHorasVoluntarios();
  } catch (e) {}
};

async function inicializarAplicacionVoluntario(){
  window.inicializarAplicacionVoluntario = inicializarAplicacionVoluntario;

  const ac=document.getElementById("app-container");if(ac)ac.style.display="block";
  localStorage.setItem("avpcea_token","v3");
  
  // INYECTA TU ID DE VOLUNTARIO DE LA BASE DE DATOS AQUÍ PARA PASAR LA PÁGINA
  localStorage.setItem("usuario_id","2fa1fce4-aad0-439a-a391-3cd3079556c6");

  const u=localStorage.getItem("usuario_id");
  if(u&&u.trim()!==""){const ws=document.getElementById("welcome-screen"),wh=document.getElementById("welcome-header");if(ws)ws.style.display="none";if(wh)wh.style.display="none";showScreen("perfil");}
  else{document.body.innerHTML='<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>Terminal No Enlazado</h2><p>Falta usuario_id.</p></div>';}
}

async function arrancarAplicacion() {
    try {
        // 1. Inicializa la lógica nativa original de la app (ID, etc.)
        inicializarAplicacionVoluntario();
        
        // 2. Invoca la carga y renderizado asíncrono de los datos de Supabase
        if (typeof cargarFichaVoluntario === "function") {
            await cargarFichaVoluntario();
        }
    } catch (error) {
        // Único log de seguridad en caso de fallo crítico de red
        console.error("Fallo al inicializar el perfil de voluntario:", error.message);
    }
}

// Lanzamiento directo y seguro al cargar el documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancarAplicacion);
} else {
    arrancarAplicacion();
}

// ==========================================
// CONFIGURACIÓN DE LA NAVEGACIÓN (BOTTOM-NAV)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionar todos los botones de la barra de navegación
    const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');

    // 2. Escuchar el evento de clic/toque en cada botón
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetScreen = button.getAttribute('data-screen');
        
            if (targetScreen) {
                showScreen(targetScreen);
                updateActiveNavButton(button);

                // 🌟 DISPARAR CARGAS AUTOMÁTICAS AL CAMBIAR DE PESTAÑA
                if (targetScreen === 'operativos') cargarOperativos();
                if (targetScreen === 'preventivos') cargarPreventivos();
                if (targetScreen === 'emergencias') cargarEmergencias();
            }
        });
    });

    /**
     * Actualiza la clase activa en la barra de navegación inferior
     * @param {HTMLElement} activeButton - El botón que ha sido pulsado
     */
    function updateActiveNavButton(activeButton) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }
});
