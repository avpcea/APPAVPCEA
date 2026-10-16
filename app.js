// =========================================================================
// APP AVPCEA - CONFIGURACIÓN CENTRAL Y MÓDULOS DEL FRONTEND (PARTE 1 DE 3)
// =========================================================================

// 1. IMPORTACIÓN E INICIALIZACIÓN DEL CLIENTE (Estático en la raíz)
import { createClient } from "https://esm.sh" ;

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BASE_FN = `${SUPABASE_URL}/functions/v1`;

// 2. SISTEMA DE CONTROL DEFENSIVO ANTI-DUPLICADOS (Se queda aquí, intacto)
const cargando = {
  operativos: false,
  preventivos: false,
  emergencias: false
};

// =========================================================================
// RENDERS PÚBLICOS DE EVENTOS
// =========================================================================
export async function cargarOperativos() {
  if (cargando.operativos) return;
  cargando.operativos = true;

  const cont = document.getElementById("lista-operativos");
  if (!cont) {
    cargando.operativos = false;
    return;
  }
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
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px;">
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


// ===============================
// RENDERS PÚBLICOS DE EVENTOS
// ===============================

export async function cargarOperativos() {
  if (cargando.operativos) return;
  cargando.operativos = true;

  const cont = document.getElementById("lista-operativos");
  if (!cont) {
    cargando.operativos = false;
    return;
  }
  cont.innerHTML = "<p>Cargando operativos...</p>";

  // SOLUCIÓN: Los operativos cerrados desaparecen automáticamente usando .is("fecha_fin", null)
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
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px;">
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
  if (!cont) {
    cargando.preventivos = false;
    return;
  }
  cont.innerHTML = "<p>Cargando preventivos...</p>";

  // SOLUCIÓN: Los preventivos cerrados desaparecen automáticamente usando .is("fecha_fin", null)
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
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px;">
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
// APP AVPCEA - CONFIGURACIÓN CENTRAL Y MÓDULOS DEL FRONTEND (PARTE 2 DE 3)
// =========================================================================

// Variables globales del contexto de Audio para el pitido continuo
let ecgAudioContext = null;
let ecgOscillator = null;

// ===============================
// SISTEMA DE ALARMA ELECTRÓNICA INTERACTIVA (EMERGENCIAS)
// ===============================
export function activarPitidoEmergencia() {
  if (ecgOscillator) return;
  try {
    ecgAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    ecgOscillator = ecgAudioContext.createOscillator();
    const gainNode = ecgAudioContext.createGain();

    ecgOscillator.type = 'sine';
    ecgOscillator.frequency.setValueAtTime(880, ecgAudioContext.currentTime); // Tono agudo electrónico
    gainNode.gain.setValueAtTime(0.4, ecgAudioContext.currentTime);

    ecgOscillator.connect(gainNode);
    gainNode.connect(ecgAudioContext.destination);
    ecgOscillator.start();
    console.log("🚨 Pitido continuo de emergencia activado.");
  } catch (e) {
    console.warn("Audio bloqueado automáticamente por el navegador. Esperando interacción.", e);
  }
}

export function detenerPitidoEmergencia() {
  if (ecgOscillator) {
    try {
      ecgOscillator.stop();
      ecgOscillator.disconnect();
      if (ecgAudioContext && ecgAudioContext.state !== 'closed') {
        ecgAudioContext.close();
      }
    } catch (e) {
      console.error("Error al silenciar el audio:", e);
    }
    ecgOscillator = null;
    ecgAudioContext = null;
    console.log("🔊 Pitido continuo silenciado.");
  }
}

// ===============================
// CARGA EMERGENCIAS
// ===============================
export async function cargarEmergencias() {
  if (cargando.emergencias) return;
  cargando.emergencias = true;

  const cont = document.getElementById("lista-emergencias");
  if (!cont) {
    cargando.emergencias = false;
    return;
  }
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
      <div class="card" style="padding:15px; border:1px solid #eee; border-radius:4px;">
        <h3>Sin emergencias activas</h3>
        <p>Actualmente no hay emergencias que requieran tu asistencia.</p>
      </div>
    `;
    detenerPitidoEmergencia(); // Si no quedan emergencias activas, apagamos el zumbador
    cargando.emergencias = false;
    return;
  }

  cont.innerHTML = "";
  
  // ACTIVACIÓN DEL PITIDO: Al detectarse al menos una emergencia activa en la cola
  activarPitidoEmergencia();

  emergencias.forEach(emg => {
    cont.innerHTML += `
      <div class="card" style="border:2px solid #ff4d4d; background:#fff5f5; padding:15px; margin-bottom:12px; border-radius:4px;">
        <h3 style="color:#d32f2f; margin-top:0;">🚨 EMERGENCIA CRÍTICA</h3>
        <p><strong>Lugar:</strong> ${emg.lugar || "—"}</p>
        <p><strong>Descripción:</strong> ${emg.descripcion || "Sin detalles adicionales"}</p>
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

// Lógica reactiva expuesta a window para apagar la alarma del voluntario
window.responderAAlerta = async function(emergenciaId, accion) {
  detenerPitidoEmergencia();
  
  if (accion === 'aceptar') {
    const uid = localStorage.getItem("usuario_id");
    const { error } = await supabase.from("suscripciones").insert([
      { usuario_id: uid, evento_id: String(emergenciaId), tipo: "EMG" }
    ]);
    if (error) {
      alert("Error al suscribirse a la emergencia: " + error.message);
    } else {
      alert("Suscripción registrada. Desplázate al lugar indicado.");
    }
  } else {
    alert("Has declinado la asistencia a la emergencia.");
  }
  await cargarEmergencias();
  if (typeof cargarFichaVoluntario === "function") await cargarFichaVoluntario();
};

// ===============================
// CONTROL DE SUSCRIPCIONES
// ===============================
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

// =========================================================================
// APP AVPCEA - CONFIGURACIÓN CENTRAL Y MÓDULOS DEL FRONTEND (PARTE 3 de 3)
// =========================================================================

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

    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      alert("Error al suscribirse: " + (resultado.error || "Error desconocido"));
      return;
    }
    alert("Suscripción realizada con éxito.");
  } else {
    const { error } = await supabase
      .from("suscripciones")
      .delete()
      .eq("usuario_id", uid)
      .eq("tipo", tipoCodigo)
      .eq("evento_id", String(evento_id));

    if (error) {
      alert("Error al cancelar la suscripción: " + error.message);
      return;
    }
    alert("Suscripción cancelada.");
  }

  if (tipo_evento === "preventivos") cargarPreventivos();
  if (tipo_evento === "operativos") cargarOperativos();
  await cargarFichaVoluntario(); // Refresca las suscripciones en la ficha personal
};

// ===============================
// GESTIÓN DE DISPOSITIVOS Y ROL
// ===============================
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

// ===============================
// FICHA DEL VOLUNTARIO DINÁMICA (PÁGINA PRINCIPAL)
// ===============================
export async function cargarFichaVoluntario() {
  const cont = document.getElementById("screen-ficha-voluntario") || document.getElementById("screen-inicio");
  if (!cont) return;

  const uid = localStorage.getItem("usuario_id");
  
  try {
    // 1. Obtener la información del voluntario
    const { data: usr, error: usrErr } = await supabase
      .from("usuarios")
      .select("nombre, telefono, cumple_mes, cumple_dia, horas")
      .eq("id", uid)
      .maybeSingle();

    if (usrErr || !usr) {
      cont.innerHTML = `<p style='padding:20px; text-align:center;'>Error al cargar perfil o tu ID no se encuentra registrado en el sistema.</p>`;
      return;
    }

    // 2. Obtener todas sus suscripciones actuales
    const { data: subs, error: subsErr } = await supabase
      .from("suscripciones")
      .select("evento_id, tipo")
      .eq("usuario_id", uid);

    // Formatear el cumpleaños a partir de las columnas homogeneizadas como enteros
    const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? 
      `${String(usr.cumple_dia).padStart(2, '0')}/${String(usr.cumple_mes).padStart(2, '0')}` : "Sin definir";

    // Imagen por defecto institucional para el avatar del voluntario
    const fotoUrl = "https://unsplash.com";

    let subsHtml = "";
    if (subs && subs.length > 0) {
      subsHtml = "<ul style='padding-left:20px; margin-top:8px;'>";
      subs.forEach(s => {
        const rutaFicha = s.tipo === "EMG" ? "emergencias" : (s.tipo === "OPR" ? "operativos" : "preventivos");
        subsHtml += `<li style='margin-bottom:6px;'>
          <span style='font-weight:bold; color:#2b6cb0;'>[${s.tipo}]</span> 
          <a href='#/evento/${rutaFicha}/${s.evento_id}' style='color:#4a5568; text-decoration:underline;'>Ver detalles del evento ↗</a>
        </li>`;
      });
      subsHtml += "</ul>";
    } else {
      subsHtml = "<p style='color:#718096; font-style:italic; margin-top:8px;'>No estás apuntado a ningún evento actualmente.</p>";
    }

    cont.innerHTML = `
      <div class="ficha-container" style="max-width:500px; margin: 0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="${fotoUrl}" alt="Foto Voluntario" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid #2b6cb0; margin-bottom:10px;" />
          <h2 style="margin:0; color:#2d3748;">${usr.nombre}</h2>
          <span style="background:#edf2f7; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold; color:#4a5568;">Voluntario Activo</span>
        </div>
        
        <div style="border-top:1px solid #edf2f7; padding-top:15px; font-size:14px; color:#4a5568;">
          <p><strong>📞 Teléfono:</strong> ${usr.telefono}</p>
          <p><strong>🎂 Fecha de Nacimiento (Cumpleaños):</strong> ${cumpleStr}</p>
          <p><strong>⏳ Saldo Total Acumulado:</strong> <span style="font-weight:bold; color:#2b6cb0; font-size:16px;">${parseFloat(usr.horas).toFixed(2)} hs</span></p>
        </div>

        <div style="border-top:1px solid #edf2f7; padding-top:15px; margin-top:15px;">
          <h4 style="margin:0 0 5px 0; color:#2d3748;">Mis Suscripciones Activas:</h4>
          ${subsHtml}
        </div>
      </div>
    `;

  } catch (e) {
    console.error("Error al renderizar la ficha:", e);
  }
}

// ===============================
// SPA: CAMBIO DE PANTALLAS EXTENDIDO
// ===============================
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
      name === "emergencias" ? "Emergencias" :
      name === "admin" ? "Administración" : "";
  }

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-screen="${name}"]`);
  if (btn) btn.classList.add("active");

  document.querySelectorAll("#app-screens .screen").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });

  const screen = document.getElementById(name === "admin" ? "screen-administracion" : (name === "inicio" ? "screen-ficha-voluntario" : "screen-" + name));
  if (screen) {
    screen.classList.add("active");
    screen.style.display = "block";
  }

  if (name === "admin") {
    if (window.cargarListadoAdmin) window.cargarListadoAdmin();
    if (window.cargarUsuariosAdmin) window.cargarUsuariosAdmin();
    if (window.cargarListadoHorasVoluntarios) window.cargarListadoHorasVoluntarios();
  }
}

// ===============================
// MOTOR DE INICIALIZACIÓN AUTOMÁTICA (IDENTIFICACIÓN POR USUARIO_ID)
// ===============================
async function inicializarAplicacionVoluntario() {
  const uid = localStorage.getItem("usuario_id");

  // Entrada transparente si el identificador físico ya está enlazado
  if (uid && uid.trim() !== "") {
    const esAdministrador = await esAdmin();
    if (esAdministrador) {
      // Carga dinámica asíncrona local según Regla Crítica 1
      import("./supabase-admin.js").then(modulo => {
        window.cargarListadoAdmin = modulo.cargarListadoAdmin;
        window.cargarUsuariosAdmin = modulo.cargarUsuariosAdmin;
        window.cargarListadoHorasVoluntarios = modulo.cargarListadoHorasVoluntarios;
      });
    }
    
    const welcomeScreen = document.getElementById("welcome-screen");
    const welcomeHeader = document.getElementById("welcome-header");
    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (welcomeHeader) welcomeHeader.style.display = "none";
    
    showScreen("inicio");
  } else {
    console.log("Terminal nuevo detectado sin enlazado previo.");
    document.body.innerHTML = `<div style="padding:40px; text-align:center; font-family:sans-serif;">
      <h2 style="color:#e53e3e; margin-bottom:10px;">Dispositivo No Enlazado</h2>
      <p style="color:#4a5568; margin-bottom:20px;">Este terminal no dispone de credenciales locales de autenticación enlazadas en localStorage.</p>
      <div style="background:#f7fafc; padding:12px; border-radius:4px; border:1px solid #e2e8f0; display:inline-block;">
        <small style="color:#718096; font-family:monospace; font-size:12px;">Consulte al administrador para vincular su usuario_id.</small>
      </div>
    </div>`;
  }
}

// Inicialización defensiva dual
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAplicacionVoluntario);
} else {
  inicializarAplicacionVoluntario();
}
