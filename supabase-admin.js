// ===============================
// IMPORTAR SUPABASE Y CONFIGURACIÓN DESDE app.js
// ===============================
import { supabase, BASE_FN } from "./app.js";

// ===============================
// LISTADO GENERAL ADMIN
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  cont.innerHTML = "<p>Cargando listados de administración...</p>";

  const [operativos, preventivos] = await Promise.all([
    supabase.from("operativos").select("*").order("fecha", { ascending: false }),
    supabase.from("preventivos").select("*").order("fecha", { ascending: false })
  ]);

  cont.innerHTML = "";

  // ===============================
  // OPERATIVOS
  // ===============================
  cont.innerHTML += `<h3>Operativos</h3>`;
  if (operativos.data && operativos.data.length > 0) {
    operativos.data.forEach(op => {
      const estaCerrado = op.fecha_fin !== null;
      cont.innerHTML += `
        <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'};">
          <strong>${op.titulo}</strong><br>
          ${op.descripcion || "Sin descripción"}<br>
          <small>Fecha: ${op.fecha} | Horas: ${op.duracion_horas || 0}</small><br>
          ${!estaCerrado ? `
            <button class="btn-danger" style="margin-top:5px; padding:4px 8px; font-size:12px;" onclick="ejecutarCierreEvento('\${op.id}', 'operativos')">
              Cerrar y Contar Horas
            </button>
          ` : `<span style="color:green; font-weight:bold; font-size:12px;">✓ Cerrado</span>`}
          <button class="btn-secondary" style="margin-top:5px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('operativos', '${op.id}')">
            Eliminar
          </button>
        </div>
      `;
    });
  } else {
    cont.innerHTML += `<p>No hay operativos registrados.</p>`;
  }

  // ===============================
  // PREVENTIVOS
  // ===============================
  cont.innerHTML += `<h3>Preventivos</h3>`;
  if (preventivos.data && preventivos.data.length > 0) {
    preventivos.data.forEach(pr => {
      const estaCerrado = pr.fecha_fin !== null;
      cont.innerHTML += `
        <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'};">
          <strong>${pr.titulo}</strong><br>
          ${pr.descripcion || "Sin descripción"}<br>
          <small>Lugar: ${pr.lugar || "—"} | Horas: ${pr.duracion_horas || 0}</small><br>
          ${!estaCerrado ? `
            <button class="btn-danger" style="margin-top:5px; padding:4px 8px; font-size:12px;" onclick="ejecutarCierreEvento('\${pr.id}', 'preventivos')">
              Cerrar y Contar Horas
            </button>
          ` : `<span style="color:green; font-weight:bold; font-size:12px;">✓ Cerrado</span>`}
          <button class="btn-secondary" style="margin-top:5px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('preventivos', '${pr.id}')">
            Eliminar
          </button>
        </div>
      `;
    });
  } else {
    cont.innerHTML += `<p>No hay preventivos registrados.</p>`;
  }

  // ===============================
  // EMERGENCIAS
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

  const [activas, finalizadas] = await Promise.all([
    supabase.from("emergencias").select("*").eq("activa", true).order("fecha_inicio", { ascending: false }),
    supabase.from("emergencias").select("*").eq("activa", false).order("fecha_fin", { ascending: false })
  ]);

  cont.innerHTML = "";

  // ACTIVAS
  cont.innerHTML += `<h4>Emergencias activas</h4>`;
  if (!activas.data || activas.data.length === 0) {
    cont.innerHTML += `<p>No hay emergencias activas.</p>`;
  } else {
    activas.data.forEach(emg => {
      cont.innerHTML += `
        <div class="card">
          <strong>${emg.titulo}</strong><br>
          Nivel: ${emg.nivel.toUpperCase()}<br>
          Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>

          <button class="btn-danger" style="margin-top:5px;" onclick="ejecutarCierreEvento('${emg.id}', 'emergencias')">
            Cerrar emergencia
          </button>
        </div>
      `;
    });
  }

  // FINALIZADAS
  cont.innerHTML += `<h4 style="margin-top:20px;">Emergencias finalizadas</h4>`;
  if (!finalizadas.data || finalizadas.data.length === 0) {
    cont.innerHTML += `<p>No hay emergencias finalizadas.</p>`;
  } else {
    finalizadas.data.forEach(emg => {
      cont.innerHTML += `
        <div class="card" style="opacity:0.7;">
          <strong>${emg.titulo}</strong><br>
          Nivel: ${emg.nivel.toUpperCase()}<br>
          Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>
          Fin: ${new Date(emg.fecha_fin).toLocaleString()}<br>
          <button class="btn-secondary" style="margin-top:5px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('emergencias', '${emg.id}')">
            Eliminar registro
          </button>
        </div>
      `;
    });
  }
}

// ===============================
// ACCIONES UTILIZANDO EDGE FUNCTIONS SEBURAS
// ===============================
document.getElementById("btn-crear-operativo").addEventListener("click", async () => {
  const titulo = document.getElementById("op-titulo").value.trim();
  const descripcion = document.getElementById("op-descripcion").value.trim();
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");

  const response = await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "operativos",
      admin_id,
      values: {
        titulo,
        descripcion,
        fecha: new Date().toISOString().split('T')[0], // AAAA-MM-DD
        fecha_inicio: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Operativo creado mediante Edge Function de forma segura.");
    cargarListadoAdmin();
  } else {
    const err = await response.json();
    alert("Error: " + err.error);
  }
});

document.getElementById("btn-crear-preventivo").addEventListener("click", async () => {
  const titulo = document.getElementById("pr-titulo").value.trim();
  const descripcion = document.getElementById("pr-descripcion").value.trim();
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");

  const response = await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "preventivos",
      admin_id,
      values: {
        titulo,
        descripcion,
        fecha: new Date().toISOString().split('T')[0],
        fecha_inicio: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Preventivo creado mediante Edge Function de forma segura.");
    cargarListadoAdmin();
  } else {
    const err = await response.json();
    alert("Error: " + err.error);
  }
});

document.getElementById("btn-crear-emergencia").addEventListener("click", async () => {
  const titulo = document.getElementById("em-titulo").value.trim();
  const nivel = document.getElementById("em-nivel").value;
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");

  const response = await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "emergencias",
      admin_id,
      values: {
        titulo,
        nivel,
        activa: true,
        fecha_inicio: new Date().toISOString(),
        ultima_actualizacion: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Emergencia creada mediante Edge Function de forma segura.");
    cargarListadoAdmin();
  } else {
    const err = await response.json();
    alert("Error: " + err.error);
  }
});

// ===============================
// GESTIÓN DE USUARIOS (CON JOIN DE ROL)
// ===============================
export async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios");
  cont.innerHTML = "<p>Cargando usuarios...</p>";

  // Hacemos un join pidiendo el id de la tabla dispositivos para pintar el rol real
  const { data: usuarios, error } = await supabase
    .from("usuarios")
    .select(`
      id,
      nombre,
      telefono,
      dispositivos ( rol )
    `);

  if (error) {
    cont.innerHTML = "<p>Error al cargar usuarios.</p>";
    return;
  }

  cont.innerHTML = "";

  usuarios.forEach(u => {
    // Si el join devuelve datos, extraemos el rol, si no 'normal'
    const rolAsignado = u.dispositivos?.rol || "normal";
    cont.innerHTML += `
      <div class="card">
        <strong>${u.nombre}</strong><br>
        Tel: ${u.telefono || "—"}<br>
        Rol: <span class="badge" style="font-weight:bold; color:${rolAsignado === 'admin' ? 'red' : 'blue'}">${rolAsignado.toUpperCase()}</span>
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
