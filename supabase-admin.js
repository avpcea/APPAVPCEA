// ===============================
// IMPORTAR SUPABASE DESDE app.js
// ===============================
import { supabase } from "./app.js";


// ===============================
// LISTADO GENERAL ADMIN
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  cont.innerHTML = "<p>Cargando...</p>";

  // Operativos y preventivos siguen usando "fecha"
  const [operativos, preventivos] = await Promise.all([
    supabase.from("operativos").select("*").order("fecha", { ascending: false }),
    supabase.from("preventivos").select("*").order("fecha", { ascending: false })
  ]);

  cont.innerHTML = "";

  // ===============================
  // OPERATIVOS
  // ===============================
  cont.innerHTML += `<h3>Operativos</h3>`;
  if (operativos.data) {
    operativos.data.forEach(op => {
      cont.innerHTML += `
        <div class="card">
          <strong>${op.titulo}</strong><br>
          ${op.descripcion || ""}
        </div>
      `;
    });
  }

  // ===============================
  // PREVENTIVOS
  // ===============================
  cont.innerHTML += `<h3>Preventivos</h3>`;
  if (preventivos.data) {
    preventivos.data.forEach(pr => {
      cont.innerHTML += `
        <div class="card">
          <strong>${pr.titulo}</strong><br>
          ${pr.descripcion || ""}
        </div>
      `;
    });
  }

  // ===============================
  // EMERGENCIAS (NUEVO SISTEMA)
  // ===============================
  cont.innerHTML += `<h3>Emergencias</h3>`;
  cont.innerHTML += `<div id="admin-emergencias"></div>`;

  cargarEmergenciasAdmin();
}


// ===============================
// EMERGENCIAS ADMIN (ACTIVAS + FINALIZADAS)
// ===============================
async function cargarEmergenciasAdmin() {
  const cont = document.getElementById("admin-emergencias");
  cont.innerHTML = "<p>Cargando emergencias...</p>";

  const { data: activas } = await supabase
    .from("emergencias")
    .select("*")
    .eq("activa", true)
    .order("fecha_inicio", { ascending: false });

  const { data: finalizadas } = await supabase
    .from("emergencias")
    .select("*")
    .eq("activa", false)
    .order("fecha_fin", { ascending: false });

  cont.innerHTML = "";

  // ACTIVAS
  cont.innerHTML += `<h4>Emergencias activas</h4>`;
  if (!activas || activas.length === 0) {
    cont.innerHTML += `<p>No hay emergencias activas.</p>`;
  } else {
    activas.forEach(emg => {
      cont.innerHTML += `
        <div class="card">
          <strong>${emg.titulo}</strong><br>
          Nivel: ${emg.nivel}<br>
          Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>
          Horas: ${emg.horas}<br>

          <button class="btn-danger" onclick="cerrarEmergencia('${emg.id}')">
            Cerrar emergencia
          </button>
        </div>
      `;
    });
  }

  // FINALIZADAS
  cont.innerHTML += `<h4 style="margin-top:20px;">Emergencias finalizadas</h4>`;
  if (!finalizadas || finalizadas.length === 0) {
    cont.innerHTML += `<p>No hay emergencias finalizadas.</p>`;
  } else {
    finalizadas.forEach(emg => {
      cont.innerHTML += `
        <div class="card">
          <strong>${emg.titulo}</strong><br>
          Nivel: ${emg.nivel}<br>
          Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>
          Fin: ${new Date(emg.fecha_fin).toLocaleString()}<br>
          Horas: ${emg.horas}<br>

          <button class="btn-primary" onclick="reabrirEmergencia('${emg.id}')">
            Reabrir emergencia
          </button>
        </div>
      `;
    });
  }
}


// ===============================
// CREAR OPERATIVO
// ===============================
document.getElementById("btn-crear-operativo").addEventListener("click", async () => {
  const titulo = document.getElementById("op-titulo").value.trim();
  const descripcion = document.getElementById("op-descripcion").value.trim();

  if (!titulo) return alert("Introduce un título.");

  await supabase.from("operativos").insert([{ titulo, descripcion }]);
  alert("Operativo creado.");
  cargarListadoAdmin();
});


// ===============================
// CREAR PREVENTIVO
// ===============================
document.getElementById("btn-crear-preventivo").addEventListener("click", async () => {
  const titulo = document.getElementById("pr-titulo").value.trim();
  const descripcion = document.getElementById("pr-descripcion").value.trim();

  if (!titulo) return alert("Introduce un título.");

  await supabase.from("preventivos").insert([{ titulo, descripcion }]);
  alert("Preventivo creado.");
  cargarListadoAdmin();
});


// ===============================
// CREAR EMERGENCIA (NUEVO SISTEMA)
// ===============================
document.getElementById("btn-crear-emergencia").addEventListener("click", async () => {
  const titulo = document.getElementById("em-titulo").value.trim();
  const nivel = document.getElementById("em-nivel").value;
  const horas = parseInt(document.getElementById("em-horas").value, 10);

  if (!titulo) return alert("Introduce un título.");
  if (isNaN(horas)) return alert("Introduce horas válidas.");

  await supabase.from("emergencias").insert([
    {
      id: crypto.randomUUID(),
      titulo,
      nivel,
      horas,
      activa: true,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
      ultima_actualizacion: new Date().toISOString()
    }
  ]);

  alert("Emergencia creada.");
  cargarListadoAdmin();
});


// ===============================
// GESTIÓN DE USUARIOS
// ===============================
export async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios");
  cont.innerHTML = "<p>Cargando usuarios...</p>";

  const { data: usuarios } = await supabase.from("usuarios").select("*");

  cont.innerHTML = "";

  usuarios.forEach(u => {
    cont.innerHTML += `
      <div class="card">
        <strong>${u.nombre}</strong><br>
        Tel: ${u.telefono || "—"}<br>
        Rol: ${u.rol || "usuario"}
      </div>
    `;
  });
}


// ===============================
// EXPONER FUNCIONES AL DOM
// ===============================
window.cargarListadoAdmin = cargarListadoAdmin;
window.cargarUsuariosAdmin = cargarUsuariosAdmin;
window.cargarEmergenciasAdmin = cargarEmergenciasAdmin;
