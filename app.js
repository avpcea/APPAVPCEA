// 1. CONEXIÓN ESTÁTICA CON SUPABASE
import { createClient } from "https://esm.sh";

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BASE_FN = `${SUPABASE_URL}/functions/v1`;

let ecgAudioContext = null;
let ecgOscillator = null;
const cargando = { operativos: false, preventivos: false, emergencias: false };

// 2. RENDERS DE EVENTOS (OCULTANDO CERRADOS AUTOMÁTICAMENTE)
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

  if (error) { cont.innerHTML = "<p>Error.</p>"; cargando.operativos = false; return; }

  cont.innerHTML = "";
  if (!operativos || operativos.length === 0) {
    cont.innerHTML = "<p>No hay operativos activos.</p>";
  } else {
    for (const op of operativos) {
      const suscrito = await estaSuscrito("operativos", op.id);
      const fechaStr = op.fecha_inicio ? op.fecha_inicio.substring(0, 16).replace('T', ' ') : "—";
      cont.innerHTML += `
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px;">
          <h3><a href="#/evento/operativos/${op.id}" style="color:#2b6cb0; text-decoration:none;">${op.titulo} ↗</a></h3>
          <p><strong>Lugar:</strong> ${op.lugar || "—"}</p>
          <p><strong>Fecha de evento:</strong> ${op.fecha || "—"}</p>
          <p><strong>Fecha inicio:</strong> ${fechaStr}</p>
          <p>${op.descripcion || "Sin observaciones"}</p>
          <button class="btn-primary" style="margin-top:8px;" onclick="window.toggleSuscripcion('operativos', '${op.id}')">
            ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
          </button>
        </div>`;
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

  if (error) { cont.innerHTML = "<p>Error.</p>"; cargando.preventivos = false; return; }

  cont.innerHTML = "";
  if (!preventivos || preventivos.length === 0) {
    cont.innerHTML = "<p>No hay preventivos activos.</p>";
  } else {
    for (const p of preventivos) {
      const suscrito = await estaSuscrito("preventivos", p.id);
      const fechaStr = p.fecha_inicio ? p.fecha_inicio.substring(0, 16).replace('T', ' ') : "—";
      cont.innerHTML += `
        <div class="card" style="margin-bottom:12px; padding:12px; border:1px solid #eee; border-radius:4px;">
          <h3><a href="#/evento/preventivos/${p.id}" style="color:#2b6cb0; text-decoration:none;">${p.titulo} ↗</a></h3>
          <p><strong>Lugar:</strong> ${p.lugar || "—"}</p>
          <p><strong>Fecha de evento:</strong> ${p.fecha || "—"}</p>
          <p><strong>Fecha inicio:</strong> ${fechaStr}</p>
          <p>${p.descripcion || "Sin observaciones"}</p>
          <button class="btn-primary" style="margin-top:8px;" onclick="window.toggleSuscripcion('preventivos', '${p.id}')">
            ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
          </button>
        </div>`;
    }
  }
  cargando.preventivos = false;
}

// 3. SISTEMA DE ALARMA DE EMERGENCIA CON PITIDO CONTINUO
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
  } catch (e) {}
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

  const { data: emergencias } = await supabase.from("emergencias").select("*").eq("activa", true);
  if (!emergencias || emergencias.length === 0) {
    cont.innerHTML = "<p>Sin emergencias activas.</p>";
    detenerPitidoEmergencia();
    cargando.emergencias = false;
    return;
  }

  cont.innerHTML = "";
  activarPitidoEmergencia();
  emergencias.forEach(emg => {
    cont.innerHTML += `
      <div class="card" style="border:2px solid red; background:#fff5f5; padding:15px; margin-bottom:12px;">
        <h3>🚨 EMERGENCIA CRÍTICA</h3>
        <p><strong>Lugar:</strong> ${emg.lugar || "—"}</p>
        <p><strong>Descripción:</strong> ${emg.descripcion || "—"}</p>
        <button onclick="window.responderAAlerta('${emg.id}', 'aceptar')">Aceptar y Acudir</button>
        <button onclick="window.responderAAlerta('${emg.id}', 'declinar')">Declinar</button>
      </div>`;
  });
  cargando.emergencias = false;
}

window.responderAAlerta = async function(emergenciaId, accion) {
  detenerPitidoEmergencia();
  if (accion === 'aceptar') {
    const uid = localStorage.getItem("usuario_id");
    await supabase.from("suscripciones").insert([{ usuario_id: uid, evento_id: String(emergenciaId), tipo: "EMG" }]);
    alert("Suscripción registrada.");
  }
  await cargarEmergencias();
  await cargarFichaVoluntario();
};

// 4. SUSCRIPCIONES Y PERFIL DE VOLUNTARIO (CON CUMPLEMES ENTERO)
export async function estaSuscrito(tipo_evento, evento_id) {
  const uid = localStorage.getItem("usuario_id");
  const tipoCodigo = tipo_evento === "operativos" ? "OPR" : "NRP";
  const { data } = await supabase.from("suscripciones").select("*").eq("usuario_id", uid).eq("tipo", tipoCodigo).eq("evento_id", String(evento_id)).maybeSingle();
  return !!data;
}

window.toggleSuscripcion = async function(tipo_evento, evento_id) {
  const uid = localStorage.getItem("usuario_id");
  const suscrito = await estaSuscrito(tipo_evento, evento_id);
  const tipoCodigo = tipo_evento === "operativos" ? "OPR" : "NRP";

  if (!suscrito) {
    await fetch(`${BASE_FN}/admin-create-suscripcion-ts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apiKey": supabase.supabaseKey, "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}` },
      body: JSON.stringify({ usuario_id: uid, evento_id: Number(evento_id), tipo: tipo_evento, admin_id: uid })
    });
    alert("Suscrito.");
  } else {
    await supabase.from("suscripciones").delete().eq("usuario_id", uid).eq("tipo", tipoCodigo).eq("evento_id", String(evento_id));
    alert("Cancelado.");
  }
  if (tipo_evento === "preventivos") cargarPreventivos();
  if (tipo_evento === "operativos") cargarOperativos();
  await cargarFichaVoluntario();
};

export async function cargarFichaVoluntario() {
  const cont = document.getElementById("screen-ficha-voluntario") || document.getElementById("screen-inicio");
  if (!cont) return;
  const uid = localStorage.getItem("usuario_id");

  const { data: usr } = await supabase.from("usuarios").select("nombre, telephone:telefono, cumple_mes, cumple_dia, horas").eq("id", uid).maybeSingle();
  if (!usr) { cont.innerHTML = "<p>Dispositivo No Enlazado en la Base de Datos.</p>"; return; }

  const { data: subs } = await supabase.from("suscripciones").select("evento_id, tipo").eq("usuario_id", uid);
  const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? `${String(usr.cumple_dia).padStart(2, '0')}/${String(usr.cumple_mes).padStart(2, '0')}` : "Sin definir";

  let subsHtml = "<ul>";
  subs?.forEach(s => { subsHtml += `<li>[${s.tipo}] <a href="#/evento/${s.tipo}/${s.evento_id}">Ver Evento ↗</a></li>`; });
  subsHtml += "</ul>";

  cont.innerHTML = `
    <div style="max-width:450px; margin:20px auto; background:#fff; padding:20px; border-radius:8px; border:1px solid #eee; font-family:sans-serif;">
      <h2 style="margin:0 0 10px 0;">${usr.nombre}</h2>
      <p><strong>📞 Teléfono:</strong> ${usr.telephone || "—"}</p>
      <p><strong>🎂 Cumpleaños:</strong> ${cumpleStr}</p>
      <p><strong>⏳ Saldo Horas:</strong> ${parseFloat(usr.horas || 0).toFixed(2)} hs</p>
      <h4>Suscripciones Activas:</h4>
      ${subs?.length ? subsHtml : '<p>Ninguna</p>'}
    </div>`;
}

// 5. ENRUTADOR DE PANTALLAS (SPA)
export function showScreen(name) {
  if (name === "inicio" || name === "ficha") cargarFichaVoluntario();
  if (name === "preventivos") cargarPreventivos();
  if (name === "operativos") cargarOperativos();
  if (name === "emergencias") cargarEmergencias();

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll("#app-screens .screen").forEach(s => s.style.display = "none");

  const screen = document.getElementById(name === "admin" ? "screen-administracion" : (name === "inicio" ? "screen-ficha-voluntario" : "screen-" + name));
  if (screen) screen.style.display = "block";
}
// 6. INICIALIZADOR DE ARRANQUE AUTOMÁTICO DEFENSIVO
async function inicializarAplicacionVoluntario() {
  const appContainer = document.getElementById("app-container");
  if (appContainer) appContainer.style.display = "block";
  localStorage.setItem("avpcea_token", "v3"); // Forzamos la autorización de desarrollo para saltar prompts
  const uid = localStorage.getItem("usuario_id");
  if (uid && uid.trim() !== "") {
  const welcomeScreen = document.getElementById("welcome-screen");
  const welcomeHeader = document.getElementById("welcome-header");
  if (welcomeScreen) welcomeScreen.style.display = "none";
  if (welcomeHeader) welcomeHeader.style.display = "none";
  showScreen("inicio");
  } else {
  document.body.innerHTML = 'Terminal No EnlazadoFalta usuario_id en localStorage.';
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarAplicacionVoluntario);
else inicializarAplicacionVoluntario();
