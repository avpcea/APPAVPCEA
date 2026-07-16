document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-acceder").addEventListener("click", async () => {
    showScreen("operativos");
  });
});


// ===============================
// SUPABASE CLIENTE
// ===============================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524"; // <-- IMPORTANTE

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BASE_FN = `${SUPABASE_URL}/functions/v1`;


// ===============================
// TOKEN DE AUTORIZACIÓN
// ===============================
const TOKEN_SECRETO = "v3";
const tokenGuardado = localStorage.getItem("avpcea_token");

window.AVPCEA_AUTORIZADO = false;

if (tokenGuardado === TOKEN_SECRETO) {
  window.AVPCEA_AUTORIZADO = true;
} else {
  const codigo = prompt("Introduce el código de autorización:");
  if (codigo === TOKEN_SECRETO) {
    localStorage.setItem("avpcea_token", TOKEN_SECRETO);
    alert("Dispositivo autorizado.");
    window.AVPCEA_AUTORIZADO = true;
  }
}


// ===============================
// GENERAR usuario_id
// ===============================
let usuario_id = localStorage.getItem("usuario_id");

if (!usuario_id || usuario_id.trim() === "") {
  usuario_id = crypto.randomUUID();
  localStorage.setItem("usuario_id", usuario_id);
}


// ===============================
// ASEGURAR USUARIO
// ===============================
export async function asegurarUsuario() {
  const usuario_id = localStorage.getItem("usuario_id");

  const { data } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", usuario_id)
    .maybeSingle();

  if (!data) {
    alert(
      "Hola.\n\n" +
      "Se va a proceder a crear automáticamente un usuario con el que se calcularán las horas de los eventos en los que se participe.\n\n" +
      "Por favor, introduce tu Nombre y un Apellido.\n\n" +
      "Gracias."
    );

    const nombre = prompt("Introduce tu nombre y apellido:");

    if (!nombre || nombre.trim() === "") {
      alert("Debes introducir un nombre y apellido para continuar.");
      return;
    }

    const { error } = await supabase
      .from("usuarios")
      .insert([{ id: usuario_id, nombre: nombre.trim() }]);

    if (error) {
      alert("ERROR creando usuario: " + error.message);
      console.error(error);
      return;
    }

    alert("Usuario registrado correctamente.");
  }
}


// ===============================
// CARGA PREVENTIVOS
// ===============================
export async function cargarPreventivos() {
  const cont = document.getElementById("lista-preventivos");
  cont.innerHTML = ""; // limpiar SIEMPRE antes de empezar
  cont.innerHTML = "<p>Cargando preventivos...</p>";

  const { data: preventivos, error } = await supabase
    .from("preventivos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    cont.innerHTML = "<p>Error al cargar preventivos.</p>";
    return;
  }

  cont.innerHTML = "";

  for (const p of preventivos) {
    const suscrito = await estaSuscrito("NRP", p.id);

    cont.innerHTML += `
      <div class="card">
        <h3>${p.titulo}</h3>
        <p><strong>Fecha:</strong> ${p.fecha}</p>
        <p><strong>Lugar:</strong> ${p.lugar}</p>
        <p>${p.descripcion || ""}</p>

        <button class="btn-primary" onclick="toggleSuscripcion('NRP', ${p.id})">
          ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
        </button>
      </div>
    `;
  }
}


// ===============================
// CARGA OPERATIVOS
// ===============================
export async function cargarOperativos() {
  const cont = document.getElementById("lista-operativos");
  cont.innerHTML = ""; // limpiar SIEMPRE antes de empezar
  cont.innerHTML = "<p>Cargando operativos...</p>";

  const { data: operativos, error } = await supabase
    .from("operativos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    cont.innerHTML = "<p>Error al cargar operativos.</p>";
    return;
  }

  cont.innerHTML = "";

  for (const op of operativos) {
    const suscrito = await estaSuscrito("OPR", op.id);

    cont.innerHTML += `
      <div class="card">
        <h3>${op.titulo}</h3>
        <p><strong>Entidad:</strong> ${op.entidad || "—"}</p>
        <p><strong>Fecha:</strong> ${op.fecha}</p>
        <p>${op.descripcion || ""}</p>

        <button class="btn-primary" onclick="toggleSuscripcion('OPR', ${op.id})">
          ${suscrito ? "Cancelar suscripción" : "Suscribirme"}
        </button>
      </div>
    `;
  }
}


// ===============================
// CARGA EMERGENCIAS
// ===============================
export async function cargarEmergencias() {
  const cont = document.getElementById("lista-emergencias");
  cont.innerHTML = ""; // limpiar SIEMPRE antes de empezar

  cont.innerHTML = `
    <div class="card">
      <h3>Sin emergencias activas</h3>
      <p>Actualmente no hay emergencias registradas.</p>
    </div>
  `;
}


// ===============================
// SUSCRIPCIONES
// ===============================
export async function estaSuscrito(tipo, evento_id) {
  const usuario_id = localStorage.getItem("usuario_id");

  const { data } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("usuario_id", usuario_id)
    .eq("tipo", tipo)
    .eq("evento_id", evento_id)
    .maybeSingle();

  return !!data;
}

export async function toggleSuscripcion(tipo, evento_id) {
  const usuario_id = localStorage.getItem("usuario_id");
  const suscrito = await estaSuscrito(tipo, evento_id);

  const tabla = tipo === "NRP" ? "preventivos" :
                tipo === "OPR" ? "operativos" :
                tipo === "EMG" ? "emergencias" : null;

  if (!tabla) {
    alert("Tipo de evento desconocido.");
    return;
  }

  if (!suscrito) {
    await fetch(`${BASE_FN}/admin-create-suscripcion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id,
        evento_id,
        fecha: new Date().toISOString()
      })
    });

    const { data: evento } = await supabase
      .from(tabla)
      .select("duracion_horas")
      .eq("id", evento_id)
      .maybeSingle();

    const horas = evento?.duracion_horas || 0;
    const año = new Date().getFullYear();

    await fetch(`${BASE_FN}/admin-create-horas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id,
        evento_id: String(evento_id),
        tipo,
        horas,
        año
      })
    });

    alert("Suscripción realizada.");
  } else {
    await supabase
      .from("suscripciones")
      .delete()
      .eq("usuario_id", usuario_id)
      .eq("tipo", tipo)
      .eq("evento_id", String(evento_id));

    await supabase
      .from("horas")
      .delete()
      .eq("usuario_id", usuario_id)
      .eq("evento_id", String(evento_id))
      .eq("tipo", tipo);

    alert("Suscripción cancelada.");
  }

  if (tipo === "NRP") cargarPreventivos();
  if (tipo === "OPR") cargarOperativos();
  if (tipo === "EMG") cargarEmergencias();
}


// ===============================
// ROLES
// ===============================
export async function registrarDispositivo() {
  const usuario_id = localStorage.getItem("usuario_id");
  const { data } = await supabase
    .from("dispositivos")
    .select("*")
    .eq("id", usuario_id)
    .maybeSingle();

  if (!data) {
    await supabase.from("dispositivos").insert([
      { id: usuario_id, rol: "normal" }
    ]);
  }
}

export async function esAdmin() {
  const usuario_id = localStorage.getItem("usuario_id");

  const { data } = await supabase
    .from("dispositivos")
    .select("rol")
    .eq("id", usuario_id)
    .maybeSingle();

  return data && data.rol === "admin";
}


// ===============================
// SPA: CAMBIO DE PANTALLAS
// ===============================
export function showScreen(name) {
  if (name === "preventivos") cargarPreventivos();
  if (name === "operativos") cargarOperativos();
  if (name === "emergencias") cargarEmergencias();

  document.querySelector(".header-title").textContent =
    name === "operativos" ? "Operativos" :
    name === "preventivos" ? "Preventivos" :
    name === "emergencias" ? "Emergencias" :
    name === "admin" ? "Administración" : "";

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-screen="${name}"]`);
  if (btn) btn.classList.add("active");

  document.querySelectorAll("#app-screens .screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById("screen-" + name);
  if (screen) screen.classList.add("active");

  if (name === "admin") {
    document.getElementById("admin-screen").style.display = "block";

    if (typeof cargarListadoAdmin === "function") {
      cargarListadoAdmin();
    }
    if (typeof cargarUsuariosAdmin === "function") {
      cargarUsuariosAdmin();
    }
  }
}


// ===============================
// BOTÓN ACCEDER
// ===============================
document.getElementById("btn-acceder").addEventListener("click", async () => {

  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("welcome-header").style.display = "none";

  document.getElementById("app-screens").style.display = "block";
  document.getElementById("main-header").style.display = "flex";
  document.querySelector(".bottom-nav").style.display = "flex";

  await asegurarUsuario();
  showScreen("operativos");
});


// ===============================
// NAVEGACIÓN INFERIOR
// ===============================
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const screen = btn.dataset.screen;
    showScreen(screen);
  });
});


// ===============================
// CARGA DINÁMICA ADMIN
// ===============================
esAdmin().then(admin => {
  if (!admin) return;

  document.getElementById("admin-btn").style.display = "block";

  const script = document.createElement("script");
  script.src = "supabase-admin.js";
  document.body.appendChild(script);
});


// ===============================
// SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(reg => {
    reg.onupdatefound = () => {
      const newWorker = reg.installing;
      newWorker.onstatechange = () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          alert("Nueva versión disponible. Recarga la app.");
        }
      };
    };
  });
}


// ===============================
// EXPONER FUNCIONES AL DOM
// ===============================
window.cargarOperativos = cargarOperativos;
window.cargarPreventivos = cargarPreventivos;
window.cargarEmergencias = cargarEmergencias;
window.toggleSuscripcion = toggleSuscripcion;
window.estaSuscrito = estaSuscrito;
window.showScreen = showScreen;
window.asegurarUsuario = asegurarUsuario;
window.esAdmin = esAdmin;
window.registrarDispositivo = registrarDispositivo;
