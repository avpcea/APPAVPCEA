// =========================================================================
// APP AVPCEA - MOTOR INTEGRAL CONSOLIDADO (BLOQUE A DE B)
// =========================================================================

// 1. CONEXIÓN ESTÁTICA CON EL CLIENTE DE SUPABASE
import { createClient } from "https://esm.sh" ;

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BASE_FN = `${SUPABASE_URL}/functions/v1`;

// Contextos de Audio para la alarma electrónica de emergencias
let ecgAudioContext = null;
let ecgOscillator = null;

// Sistema de control defensivo anti-duplicados
const cargando = {
  operativos: false,
  preventivos: false,
  emergencias: false
};

// =========================================================================
// RENDERS DE EVENTOS ACTIVOS (OCULTANDO CERRADOS AUTOMÁTICAMENTE)
// =========================================================================

export async function cargarOperativos() {
  if (cargando.operativos) return;
  cargando.operativos = true;

  const cont = document.getElementById("lista-operativos");
  if (!cont) { cargando.operativos = false; return; }
  cont.innerHTML = "<p>Cargando operativos...</p>";

  const { data: operativos, error } = await supabase
    .from("operativos")
    .select("*")
    .is("fecha_fin", null)
    .order("fecha_inicio", { ascending: false });

  if (error) {
    cont.innerHTML = "<p>Error al cargar operativos.</p>";
    cargando.operativos = false;
    return;
  }

  cont.innerHTML = "";
  if (!operativos || operativos.length === 0) {
    cont.innerHTML = "<p>No hay operativos activos en este momento.</p>";
  } else {
    for (const op of operativos) {
      const suscrito = await estaSuscrito("operativos", op.id);
      const fechaInicioStr = op.fecha_inicio ? op.fecha_inicio.substring(0, 16).replace('T', ' ') : "—";

      cont.innerHTML += `
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px; font-family:sans-serif;">
          <h3><a href="#/evento/operativos/${op.id}" style="color:#2b6cb0; text-decoration:none;">${op.titulo} ↗</a></h3>
          <p><strong>Lugar:</strong> ${op.lugar || "—"}</p>
          <p><strong>Fecha de evento:</strong> ${op.fecha || "—"}</p>
          <p><strong>Fecha inicio:</strong> ${fechaInicioStr}</p>
          <p>${op.descripcion || "Sin observaciones"}</p>
          <button class="btn-primary" style="margin-top:8px;" onclick="window.toggleSuscripcion('operativos', '${op.id}')">
            ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
          </button>
        </div>
      `;
    }
  }
  cargando.operativos = false;
}

export async function cargarPreventivos() {
  if (cargando.preventivos) return;
  cargando.preventivos = true;

  const cont = document.getElementById("lista-preventivos");
  if (!cont) { cargando.preventivos = false; return; }
  cont.innerHTML = "<p>Cargando preventivos...</p>";

  const { data: preventivos, error } = await supabase
    .from("preventivos")
    .select("*")
    .is("fecha_fin", null)
    .order("fecha_inicio", { ascending: false });

  if (error) {
    cont.innerHTML = "<p>Error al cargar preventivos.</p>";
    cargando.preventivos = false;
    return;
  }

  cont.innerHTML = "";
  if (!preventivos || preventivos.length === 0) {
    cont.innerHTML = "<p>No hay preventivos activos en este momento.</p>";
  } else {
    for (const p of preventivos) {
      const suscrito = await estaSuscrito("preventivos", p.id);
      const fechaInicioStr = p.fecha_inicio ? p.fecha_inicio.substring(0, 16).replace('T', ' ') : "—";

      cont.innerHTML += `
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px; font-family:sans-serif;">
          <h3><a href="#/evento/preventivos/${p.id}" style="color:#2b6cb0; text-decoration:none;">${p.titulo} ↗</a></h3>
          <p><strong>Lugar:</strong> ${p.lugar || "—"}</p>
          <p><strong>Fecha de evento:</strong> ${p.fecha || "—"}</p>
          <p><strong>Fecha inicio:</strong> ${fechaInicioStr}</p>
          <p>${p.descripcion || "Sin observaciones"}</p>
          <button class="btn-primary" style="margin-top:8px;" onclick="window.toggleSuscripcion('preventivos', '${p.id}')">
            ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
          </button>
        </div>
      `;
    }
  }
  cargando.preventivos = false;
}

// =========================================================================
// SISTEMA DE ALARMA ELECTRÓNICA INTERACTIVA (EMERGENCIAS)
// =========================================================================
export function activarPitidoEmergencia() {
  if (ecgOscillator) return;
  try {
    ecgAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    ecgOscillator = ecgAudioContext.createOscillator();
    const gainNode = ecgAudioContext.createGain();

    ecgOscillator.type = 'sine';
    ecgOscillator.frequency.setValueAtTime(880, ecgAudioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, ecgAudioContext.currentTime);

    ecgOscillator.connect(gainNode);
    gainNode.connect(ecgAudioContext.destination);
    ecgOscillator.start();
  } catch (e) {
    console.warn("Audio bloqueado automáticamente por seguridad.");
  }
}

export function detenerPitidoEmergencia() {
  if (ecgOscillator) {
    try {
      ecgOscillator.stop();
      ecgOscillator.disconnect();
      if (ecgAudioContext && ecgAudioContext.state !== 'closed') ecgAudioContext.close();
    } catch (e) {}
    ecgOscillator = null;
    ecgAudioContext = null;
  }
}

export async function cargarEmergencias() {
  if (cargando.emergencias) return;
  cargando.emergencias = true;

  const cont = document.getElementById("lista-emergencias");
  if (!cont) { cargando.emergencias = false; return; }
  cont.innerHTML = "<p>Cargando emergencias...</p>";

  const { data: emergencias, error } = await supabase
    .from("emergencias")
    .select("*")
    .eq("activa", true)
    .order("fecha_inicio", { ascending: false });

  if (error) {
    cont.innerHTML = "<p>Error al cargar emergencias.</p>";
    cargando.emergencias = false;
    return;
  }

  if (!emergencias || emergencias.length === 0) {
    cont.innerHTML = `
      <div class="card" style="padding:15px; border:1px solid #eee; border-radius:4px; font-family:sans-serif;">
        <h3>Sin emergencias activas</h3>
        <p>Actualmente no hay emergencias registradas.</p>
      </div>
    `;
    detenerPitidoEmergencia();
    cargando.emergencias = false;
    return;
  }

  cont.innerHTML = "";
  activarPitidoEmergencia();

  emergencias.forEach(emg => {
    cont.innerHTML += `
      <div class="card" style="border:2px solid #ff4d4d; background:#fff5f5; padding:15px; margin-bottom:12px; border-radius:4px; font-family:sans-serif;">
        <h3 style="color:#d32f2f; margin-top:0;">🚨 EMERGENCIA CRÍTICA</h3>
        <p><strong>Lugar:</strong> ${emg.lugar || "—"}</p>
        <p><strong>Descripción:</strong> ${emg.descripcion || "Sin detalles"}</p>
        <p><strong>Inicio:</strong> ${emg.fecha_inicio ? emg.fecha_inicio.substring(0, 16).replace('T', ' ') : "—"}</p>
        <div style="margin-top:12px; display:flex; gap:10px;">
          <button class="btn-success" style="padding:8px 16px; background:#38a169; color:#fff; border:none; border-radius:4px; cursor:pointer;" onclick="window.responderAAlerta('${emg.id}', 'aceptar')">
            Aceptar y Acudir
          </button>
          <button class="btn-danger" style="padding:8px 16px; background:#e53e3e; color:#fff; border:none; border-radius:4px; cursor:pointer;" onclick="window.responderAAlerta('${emg.id}', 'declinar')">
            Declinar
          </button>
        </div>
      </div>
    `;
  });
  cargando.emergencias = false;
}

window.responderAAlerta = async function(emergenciaId, accion) {
  detenerPitidoEmergencia();
  if (accion === 'aceptar') {
    const uid = localStorage.getItem("usuario_id");
    const { error } = await supabase.from("suscripciones").insert([
      { usuario_id: uid, evento_id: String(emergenciaId), tipo: "EMG" }
    ]);
    if (error) alert("Error: " + error.message);
    else alert("Suscripción registrada.");
  } else {
    alert("Has declinado la asistencia.");
  }
  await cargarEmergencias();
  await cargarFichaVoluntario();
};

export async function estaSuscrito(tipo_evento, evento_id) {
  const uid = localStorage.getItem("usuario_id");
  const tipoCodigo = tipo_evento === "operativos" ? "OPR" : "NRP";
  const { data } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("usuario_id", uid)
    .eq("tipo", tipoCodigo) 
    .eq("evento_id", String(evento_id)) 
    .maybeSingle();
  return !!data;
}

window.toggleSuscripcion = async function(tipo_evento, evento_id) {
  const uid = localStorage.getItem("usuario_id");
  const suscrito = await estaSuscrito(tipo_evento, evento_id);
  const tipoCodigo = tipo_evento === "operativos" ? "OPR" : "NRP";

  if (!suscrito) {
    const respuesta = await fetch(`${BASE_FN}/admin-create-suscripcion-ts`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apiKey": supabase.supabaseKey,
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
      },
      body: JSON.stringify({
        usuario_id: uid,
        evento_id: isNaN(Number(evento_id)) ? evento_id : Number(evento_id), 
        tipo: tipo_evento, 
        admin_id: uid 
      })
    });
    if (!respuesta.ok) return alert("Error al suscribirse.");
    alert("Suscripción realizada.");
  } else {
    const { error } = await supabase
      .from("suscripciones")
      .delete()
      .eq("usuario_id", uid)
      .eq("tipo", tipoCodigo)
      .eq("evento_id", String(evento_id));
    if (error) return alert("Error al cancelar.");
    alert("Suscripción cancelada.");
  }

  if (tipo_evento === "preventivos") cargarPreventivos();
  if (tipo_evento === "operativos") cargarOperativos();
  await cargarFichaVoluntario();
};

export async function registrarDispositivo() {
  const uid = localStorage.getItem("usuario_id");
  if (!uid) return;
  const { data } = await supabase.from("dispositivos").select("*").eq("id", uid).maybeSingle();
  if (!data) {
    await supabase.from("dispositivos").insert([{ id: uid, rol: "normal" }]);
  }
}

export async function esAdmin() {
  const uid = localStorage.getItem("usuario_id");
  if (!uid) return false;
  const { data } = await supabase.from("dispositivos").select("rol").eq("id", uid).maybeSingle();
  return data && data.rol === "admin";
}

window.ejecutarCierreEvento = async function(id, tipo) {
  const horaFinInput = prompt(`Introduce la fecha y hora de FINALIZACIÓN (AAAA-MM-DD HH:MM) o blanco para hora actual:`);
  if (horaFinInput === null) return;
  let fechaFinISO = horaFinInput.trim() === "" ? new Date().toISOString() : new Date(horaFinInput.replace(' ', 'T')).toISOString();
  try {
    const response = await fetch(`${BASE_FN}/admin-close-element-ts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: isNaN(Number(id)) ? id : Number(id), tipo, admin_id: localStorage.getItem("usuario_id"), fecha_fin: fechaFinISO })
    });
    if (response.ok) { alert("Cerrado correctamente."); await cargarListadoAdmin(); await cargarListadoHorasVoluntarios(); }
    else alert("Error al cerrar.");
  } catch (error) { alert("Error de red."); }
};

window.ejecutarEliminacionElemento = async function(tipo, id) {
  if (!confirm("¿Seguro que deseas eliminar el registro?")) return;
  try {
    const { error } = await supabase.from(tipo).delete().eq("id", isNaN(Number(id)) ? id : Number(id));
    if (error) throw error;
    alert("Eliminado.");
    await cargarListadoAdmin();
  } catch (error) { alert("Error al eliminar."); }
};

export async function cargarFichaVoluntario() {
  const cont = document.getElementById("screen-ficha-voluntario") || document.getElementById("screen-inicio");
  if (!cont) return;

  const uid = localStorage.getItem("usuario_id");
  try {
    const { data: usr, error: usrErr } = await supabase
      .from("usuarios")
      .select("nombre, telefono, cumple_mes, cumple_dia, horas")
      .eq("id", uid)
      .maybeSingle();

    if (usrErr || !usr) {
      cont.innerHTML = `<p style='padding:20px; text-align:center;'>Perfil no enlazado en este terminal.</p>`;
      return;
    }

    const { data: subs, error: subsErr } = await supabase
      .from("suscripciones")
      .select("evento_id, tipo")
      .eq("usuario_id", uid);

    const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? 
      `${String(usr.cumple_dia).padStart(2, '0')}/${String(usr.cumple_mes).padStart(2, '0')}` : "Sin definir";

    const fotoUrl = "https://unsplash.com";

    let subsHtml = "";
    if (subs && subs.length > 0) {
      subsHtml = "<ul style='padding-left:20px; margin-top:8px;'>";
      subs.forEach(s => {
        const rutaFicha = s.tipo === "EMG" ? "emergencias" : (s.tipo === "OPR" ? "operativos" : "preventivos");
        subsHtml += `<li style='margin-bottom:6px;'>
          <span style='font-weight:bold; color:#2b6cb0;'>[${s.tipo}]</span> 
          <a href='#/evento/${rutaFicha}/${s.evento_id}' style='color:#4a5568; text-decoration:underline;'>Ver detalles ↗</a>
        </li>`;
      });
      subsHtml += "</ul>";
    } else {
      subsHtml = "<p style='color:#718096; font-style:italic; margin-top:8px;'>Sin suscripciones activas.</p>";
    }

    cont.innerHTML = `
      <div class="ficha-container" style="max-width:500px; margin: 0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.05); font-family:sans-serif;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="${fotoUrl}" alt="Avatar" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid #2b6cb0; margin-bottom:10px;" />
          <h2 style="margin:0; color:#2d3748;">${usr.nombre}</h2>
          <span style="background:#edf2f7; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold; color:#4a5568;">Voluntario Activo</span>
        </div>
        <div style="border-top:1px solid #edf2f7; padding-top:15px; font-size:14px; color:#4a5568; line-height:1.6;">
          <p><strong>📞 Teléfono:</strong> ${usr.telefono}</p>
          <p><strong>🎂 Cumpleaños:</strong> ${cumpleStr}</p>
          <p><strong>⏳ Horas Totales:</strong> <span style="font-weight:bold; color:#2b6cb0; font-size:16px;">${parseFloat(usr.horas).toFixed(2)} hs</span></p>
        </div>
        <div style="border-top:1px solid #edf2f7; padding-top:15px; margin-top:15px;">
          <h4 style="margin:0 0 5px 0; color:#2d3748;">Mis Suscripciones Activas:</h4>
          ${subsHtml}
        </div>
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}

export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  if (!cont) return;
  cont.innerHTML = "<p>Cargando listados...</p>";
  try {
    const [operativos, preventivos] = await Promise.all([
      supabase.from("operativos").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("preventivos").select("*").order("fecha_inicio", { ascending: false })
    ]);
    cont.innerHTML = "<h3>Operativos</h3>";
    operativos.data?.forEach(op => {
      const estaCerrado = op.fecha_fin !== null;
      cont.innerHTML += `<div class="card" style="margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:${estaCerrado ? '0.6':'1'};">
        <strong>${op.titulo}</strong> - Lugar: ${op.lugar || "—"}<br>
        Fecha de evento: ${op.fecha || "—"} | Inicio: ${op.fecha_inicio ? op.fecha_inicio.substring(0,16).replace('T',' '):"—"}<br>
        ${estaCerrado ? `Fecha fin: \${op.fecha_fin.substring(0,16).replace('T',' ')}<br>` : ''}
        ${!estaCerrado ? `<button onclick="window.ejecutarCierreEvento('\${op.id}', 'operativos')">Cerrar</button>` : '✓ Cerrado'}
        <button onclick="window.ejecutarEliminacionElemento('operativos', '${op.id}')">Eliminar</button>
      </div>`;
    });
    cont.innerHTML += "<h3>Preventivos</h3>";
    preventivos.data?.forEach(pr => {
      const estaCerrado = pr.fecha_fin !== null;
      cont.innerHTML += `<div class="card" style="margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:${estaCerrado ? '0.6':'1'};">
        <strong>${pr.titulo}</strong> - Lugar: ${pr.lugar || "—"}<br>
        Fecha de evento: ${pr.fecha || "—"} | Inicio: ${pr.fecha_inicio ? pr.fecha_inicio.substring(0,16).replace('T',' '):"—"}<br>
        ${estaCerrado ? `Fecha fin: \${pr.fecha_fin.substring(0,16).replace('T',' ')}<br>` : ''}
        ${!estaCerrado ? `<button onclick="window.ejecutarCierreEvento('\${pr.id}', 'preventivos')">Cerrar</button>` : '✓ Cerrado'}
        <button onclick="window.ejecutarEliminacionElemento('preventivos', '${pr.id}')">Eliminar</button>
      </div>`;
    });
  } catch (e) {}
}

export async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios-lista") || document.getElementById("admin-usuarios");
  if (!cont) return;
  try {
    const { data: usuarios } = await supabase.from("usuarios").select("id, nombre, telefono, cumple_mes, cumple_dia, dispositivos(rol)").order("nombre", { ascending: true });
    cont.innerHTML = "";
    usuarios?.forEach(usr => {
      const rolReal = usr.dispositivos?.rol || "normal";
      const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? `${String(usr.cumple_dia).padStart(2,'0')}/${String(usr.cumple_mes).padStart(2,'0')}` : "—";
      cont.innerHTML += `<div style="padding:6px; border-bottom:1px solid #eee;">
        <strong>${usr.nombre}</strong> (${rolReal.toUpperCase()}) - Cumpleaños: ${cumpleStr}
        <button onclick="window.abrirModalEdicionUsuario('${usr.id}')">Editar</button>
        <button onclick="window.ejecutarEliminacionElemento('usuarios', '${usr.id}')">Baja</button>
      </div>`;
    });
  } catch (e) {}
}

export async function cargarListadoHorasVoluntarios() {
  const cont = document.getElementById("admin-contabilidad-horas");
  if (!cont) return;
  try {
    const { data: registros } = await supabase.from("horas").select("usuario_id, tipo, horas, anio, usuarios(nombre)").order("anio", { ascending: false });
    cont.innerHTML = "<h4>Desglose de Horas Anuales</h4>";
    registros?.forEach(reg => {
      cont.innerHTML += `<p><strong>${reg.usuarios?.nombre || "Voluntario"}</strong> - ${reg.tipo}: ${parseFloat(reg.horas).toFixed(2)} hs (${reg.anio})</p>`;
    });
  } catch (e) {}
}

window.abrirModalEdicionUsuario = async function(id) {
  try {
    const { data: usr } = await supabase.from("usuarios").select("*").eq("id", id).single();
    const nuevoNombre = prompt("Nombre:", usr.nombre); if (!nuevoNombre) return;
    const nuevoTelefono = prompt("Teléfono:", usr.telefono); if (!nuevoTelefono) return;
    const cumpleActual = (usr.cumple_dia && usr.cumple_mes) ? `${String(usr.cumple_dia).padStart(2,'0')}/${String(usr.cumple_mes).padStart(2,'0')}` : "DD/MM";
    const nuevoCumple = prompt("Cumpleaños (DD/MM):", cumpleActual); if (!nuevoCumple) return;
    
    const datos = { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim() };
    if (nuevoCumple.includes("/")) {
      const p = nuevoCumple.split("/");
      const d = parseInt(p[0], 10), m = parseInt(p[1], 10);
      if (!isNaN(d) && !isNaN(m)) { datos.cumple_dia = d; datos.cumple_mes = m; }
    }
    await supabase.from("usuarios").update(datos).eq("id", id);
    alert("Actualizado."); await cargarUsuariosAdmin(); await cargarListadoHorasVoluntarios();
  } catch (e) {
    console.error("Error al editar usuario:", e);
  }
};

// =========================================================================
// SPA Y MOTOR DE INICIALIZACIÓN AUTOMÁTICA CON CONTROL DE TIEMPOS DOM
// =========================================================================
export function showScreen(name) {
  if (name === "inicio" || name === "ficha") cargarFichaVoluntario();
  if (name === "preventivos") cargarPreventivos();
  if (name === "operativos") cargarOperativos();
  if (name === "emergencias") cargarEmergencias();

  const titleCont = document.querySelector(".header-title");
  if (titleCont) {
    titleCont.textContent =
      name === "inicio" || name === "ficha" ? "Mi Ficha Personal" :
      name === "operativos" ? "Operativos" :
      name === "preventivos" ? "Preventivos" :
      name === "emergencias" ? "Emergencias" : "Administración";
  }

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-screen="${name}"]`);
  if (btn) btn.classList.add("active");

  document.querySelectorAll("#app-screens .screen").forEach(s => { s.classList.remove("active"); s.style.display = "none"; });
  const screen = document.getElementById(name === "admin" ? "screen-administracion" : (name === "inicio" ? "screen-ficha-voluntario" : "screen-" + name));
  if (screen) { screen.classList.add("active"); screen.style.display = "block"; }

  if (name === "admin") {
    cargarListadoAdmin();
    cargarUsuariosAdmin();
    cargarListadoHorasVoluntarios();
  }
}

async function inicializarAplicacionVoluntario() {
  const appContainer = document.getElementById("app-container");
  if (appContainer) appContainer.style.display = "block";

  const TOKEN_SECRETO = "v3";
  const tokenGuardado = localStorage.getItem("avpcea_token");
  window.AVPCEA_AUTORIZADO = false;

  if (tokenGuardado === TOKEN_SECRETO) {
    window.AVPCEA_AUTORIZADO = true;
    await registrarDispositivo();
  } else {
    let autorizado = false;
    while (!autorizado) {
      const codigo = prompt("Código de autorización:");
      if (codigo === null) break;
      if (codigo === TOKEN_SECRETO) {
        localStorage.setItem("avpcea_token", TOKEN_SECRETO);
        window.AVPCEA_AUTORIZADO = true;
        autorizado = true;
        await registrarDispositivo();
      } else { alert("Incorrecto."); }
    }
  }

  if (!window.AVPCEA_AUTORIZADO) {
    document.body.innerHTML = "<p style='padding:20px; color:red;'>No autorizado.</p>";
    return;
  }

  // CORRECTO: Quitamos el 'const' redundante si ya tenías la variable declarada arriba en el ámbito
  const uidPersistido = localStorage.getItem("usuario_id");
  if (uidPersistido && uidPersistido.trim() !== "") {
    const welcomeScreen = document.getElementById("welcome-screen");
    const welcomeHeader = document.getElementById("welcome-header");
    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (welcomeHeader) welcomeHeader.style.display = "none";
    showScreen("inicio");
  } else {
    document.body.innerHTML = `<div style="padding:40px; text-align:center; font-family:sans-serif;">
      <h2>Dispositivo No Enlazado</h2>
      <p>Configure sus credenciales en localStorage.</p>
    </div>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAplicacionVoluntario);
} else {
  inicializarAplicacionVoluntario();
}
