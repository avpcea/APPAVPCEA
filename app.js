// ===============================
// SUPABASE CLIENTE
// ===============================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BASE_FN = `${SUPABASE_URL}/functions/v1`;


// ===============================
// MOSTRAR APP
// ===============================
document.getElementById("app-container").style.display = "block";


// ===============================
// TOKEN DE AUTORIZACIÓN
// ===============================
const TOKEN_SECRETO = "v3";
const tokenGuardado = localStorage.getItem("avpcea_token");

window.AVPCEA_AUTORIZADO = false;

let usuario_id = localStorage.getItem("usuario_id");

if (!usuario_id || usuario_id.trim() === "") {
  usuario_id = crypto.randomUUID();
  localStorage.setItem("usuario_id", usuario_id);
}

if (tokenGuardado === TOKEN_SECRETO) {
  window.AVPCEA_AUTORIZADO = true;
  registrarDispositivo();
} else {
  let autorizado = false;

  while (!autorizado) {
    const codigo = prompt("Introduce el código de autorización:");

    if (codigo === null) {
      alert("Acceso denegado. No se ha introducido código.");
      break;
    }

    if (codigo === TOKEN_SECRETO) {
      localStorage.setItem("avpcea_token", TOKEN_SECRETO);
      alert("Dispositivo autorizado.");
      window.AVPCEA_AUTORIZADO = true;
      autorizado = true;
      registrarDispositivo();
    } else {
      alert("Código incorrecto. Inténtalo de nuevo.");
    }
  }
}

if (!window.AVPCEA_AUTORIZADO) {
  document.body.innerHTML = "<p>Acceso no autorizado.</p>";
  throw new Error("Acceso no autorizado");
}


// ===============================
// SISTEMA ANTI-DUPLICADOS
// ===============================
const cargando = {
  operativos: false,
  preventivos: false,
  emergencias: false
};


// ===============================
// CARGA OPERATIVOS
// ===============================
export async function cargarOperativos() {
  if (cargando.operativos) return;
  cargando.operativos = true;

  const cont = document.getElementById("lista-operativos");
  cont.innerHTML = "<p>Cargando operativos...</p>";

  const { data: operativos, error } = await supabase
    .from("operativos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    cont.innerHTML = "<p>Error al cargar operativos.</p>";
    cargando.operativos = false;
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

  cargando.operativos = false;
}


// ===============================
// CARGA PREVENTIVOS
// ===============================
export async function cargarPreventivos() {
  if (cargando.preventivos) return;
  cargando.preventivos = true;

  const cont = document.getElementById("lista-preventivos");
  cont.innerHTML = "<p>Cargando preventivos...</p>";

  const { data: preventivos, error } = await supabase
    .from("preventivos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    cont.innerHTML = "<p>Error al cargar preventivos.</p>";
    cargando.preventivos = false;
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

  cargando.preventivos = false;
}


// ===============================
// CARGA EMERGENCIAS
// ===============================
export async function cargarEmergencias() {
  if (cargando.emergencias) return;
  cargando.emergencias = true;

  const cont = document.getElementById("lista-emergencias");
  cont.innerHTML = "<p>Cargando emergencias...</p>";

  // Emergencias activas
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

  // Si no hay emergencias activas
  if (!emergencias || emergencias.length === 0) {
    cont.innerHTML = `
      <div class="card">
        <h3>Sin emergencias activas</h3>
        <p>Actualmente no hay emergencias registradas.</p>
      </div>
    `;
    cargando.emergencias = false;
    return;
  }

  // Mostrar emergencias activas
  cont.innerHTML = "";

  for (const emg of emergencias) {

    // Color según nivel
    const nivelColor =
      emg.nivel === "crítico" ? "red" :
      emg.nivel === "alto" ? "orange" :
      emg.nivel === "medio" ? "blue" :
      "green";

    cont.innerHTML += `
      <div class="card">
        <h3>${emg.titulo}</h3>

        <p><strong>Nivel:</strong> 
          <span style="color:${nivelColor}; font-weight:bold;">
            ${emg.nivel.toUpperCase()}
          </span>
        </p>

        <p><strong>Inicio:</strong> ${new Date(emg.fecha_inicio).toLocaleString()}</p>

        <p><strong>Horas asignadas:</strong> ${emg.horas}</p>

        <p><strong>Estado:</strong> Activa</p>
      </div>
    `;
  }

  cargando.emergencias = false;
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

  document.querySelectorAll("#app-screens .screen").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });

  const screen = document.getElementById(
    name === "admin" ? "screen-administracion" : "screen-" + name
  );

  if (screen) {
    screen.classList.add("active");
    screen.style.display = "block";
  }

  if (name === "admin") {
    if (typeof cargarListadoAdmin === "function") cargarListadoAdmin();
    if (typeof cargarUsuariosAdmin === "function") cargarUsuariosAdmin();
  }
}


// ===============================
// NUEVO FLUJO DE REGISTRO POR TELÉFONO
// ===============================
document.getElementById("btn-acceder").addEventListener("click", async () => {

  const telefono = document.getElementById("telefono-bienvenida").value.trim();

  if (!telefono) {
    alert("Introduce tu teléfono para continuar.");
    return;
  }

  const { data: usuarioExistente } = await supabase
    .from("usuarios")
    .select("*")
    .eq("telefono", telefono)
    .maybeSingle();

  let usuario_id;

  if (usuarioExistente) {
    usuario_id = usuarioExistente.id;
    localStorage.setItem("usuario_id", usuario_id);
  } else {
    const nombre = prompt("Introduce tu nombre y apellido:");
    if (!nombre || nombre.trim() === "") {
      alert("Debes introducir un nombre para continuar.");
      return;
    }

    let fecha_nacimiento = prompt("Introduce tu fecha de nacimiento (AAAA-MM-DD):");

    if (!fecha_nacimiento || fecha_nacimiento.trim() === "") {
      alert("Debes introducir tu fecha de nacimiento.");
      return;
    }

    // Validación de formato AAAA-MM-DD
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;

    if (!regexFecha.test(fecha_nacimiento)) {
      alert("La fecha debe tener el formato AAAA-MM-DD.");
      return;
    }

    // Validación de fecha real
    const fechaObj = new Date(fecha_nacimiento);
    if (isNaN(fechaObj.getTime())) {
      alert("La fecha introducida no es válida.");
      return;
    }

    usuario_id = crypto.randomUUID();

    const { error } = await supabase
      .from("usuarios")
      .insert([
        {
          id: usuario_id,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          fecha_nacimiento
        }
      ]);

    if (error) {
      alert("Error creando usuario: " + error.message);
      return;
    }

    localStorage.setItem("usuario_id", usuario_id);
    alert("Usuario registrado correctamente.");
  }

  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("welcome-header").style.display = "none";

  document.getElementById("app-screens").style.display = "block";
  document.getElementById("main-header").style.display = "flex";
  document.querySelector(".bottom-nav").style.display = "flex";

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

  import("https://avpcea.github.io/APPAVPCEA/supabase-admin.js");
});


// ===============================
// EXPONER FUNCIONES AL DOM
// ===============================
window.cargarOperativos = cargarOperativos;
window.cargarPreventivos = cargarPreventivos;
window.cargarEmergencias = cargarEmergencias;
window.toggleSuscripcion = toggleSuscripcion;
window.estaSuscrito = estaSuscrito;
window.showScreen = showScreen;
window.esAdmin = esAdmin;
window.registrarDispositivo = registrarDispositivo;
