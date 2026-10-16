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
