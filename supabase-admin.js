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
// ===============================
// CREAR OPERATIVO (REVISADO)
// ===============================
document.getElementById("btn-crear-operativo").addEventListener("click", async () => {
  const titulo = document.getElementById("op-titulo").value.trim();
  const descripcion = document.getElementById("op-descripcion").value.trim(); // Campo Observaciones
  const fechaInicioInput = document.getElementById("op-fecha-inicio").value;   // Campo Fecha y Hora
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");
  if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

  // Convertimos el input datetime-local a ISO nativo
  const fechaISO = new Date(fechaInicioInput).toISOString();
  const fechaSoloDate = fechaISO.split('T')[0]; // Extrae "AAAA-MM-DD" para el campo date obligatorio

  const response = await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "operativos",
      admin_id,
      values: {
        titulo,
        descripcion,       // Mapea a observaciones
        fecha: fechaSoloDate,
        fecha_inicio: fechaISO,
        creado_en: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Operativo creado correctamente.");
    document.getElementById("op-titulo").value = "";
    document.getElementById("op-descripcion").value = "";
    document.getElementById("op-fecha-inicio").value = "";
    cargarListadoAdmin();
  } else {
    const err = await response.json();
    alert("Error: " + err.error);
  }
});

// ===============================
// CREAR PREVENTIVO (REVISADO)
// ===============================
document.getElementById("btn-crear-preventivo").addEventListener("click", async () => {
  const titulo = document.getElementById("pr-titulo").value.trim();
  const descripcion = document.getElementById("pr-descripcion").value.trim(); // Campo Observaciones
  const fechaInicioInput = document.getElementById("pr-fecha-inicio").value;   // Campo Fecha y Hora
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");
  if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

  const fechaISO = new Date(fechaInicioInput).toISOString();
  const fechaSoloDate = fechaISO.split('T')[0];

  const response = await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "preventivos",
      admin_id,
      values: {
        titulo,
        descripcion,       // Mapea a observaciones
        fecha: fechaSoloDate,
        fecha_inicio: fechaISO,
        creado_en: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Preventivo creado correctamente.");
    document.getElementById("pr-titulo").value = "";
    document.getElementById("pr-descripcion").value = "";
    document.getElementById("pr-fecha-inicio").value = "";
    cargarListadoAdmin();
  } else {
    const err = await response.json();
    alert("Error: " + err.error);
  }
});

// ===============================
// CREAR EMERGENCIA (REVISADO - SIN OBSERVACIONES)
// ===============================
document.getElementById("btn-crear-emergencia").addEventListener("click", async () => {
  const titulo = document.getElementById("em-titulo").value.trim();
  const nivel = document.getElementById("em-nivel").value;
  const fechaInicioInput = document.getElementById("em-fecha-inicio").value; // Solo Fecha y Hora
  const admin_id = localStorage.getItem("usuario_id");

  if (!titulo) return alert("Introduce un título.");
  if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

  const fechaISO = new Date(fechaInicioInput).toISOString();

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
        fecha_inicio: fechaISO,
        ultima_actualizacion: new Date().toISOString()
      }
    })
  });

  if (response.ok) {
    alert("Emergencia activada correctamente.");
    document.getElementById("em-titulo").value = "";
    document.getElementById("em-fecha-inicio").value = "";
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


// ===============================
// ACCIONES DE GESTIÓN (INTERCONEXIÓN CON EDGE FUNCTIONS)
// ===============================

/**
 * Invoca a la nueva Edge Function para cerrar un evento
 * y computar las horas automáticamente a todos los suscritos.
 */
async function ejecutarCierreEvento(eventoId, tipoEvento) {
  const confirmacion = confirm(`¿Estás seguro de que deseas cerrar este evento (${tipoEvento}) y calcular las horas de los voluntarios?`);
  if (!confirmacion) return;

  const admin_id = localStorage.getItem("usuario_id");

  try {
    const response = await fetch(`${BASE_FN}/admin-close-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evento_id: eventoId,
        tipo_evento: tipoEvento, // "preventivos", "operativos" o "emergencias"
        admin_id: admin_id
      })
    });

    const resultado = await response.json();

    if (response.ok) {
      alert("Éxito: " + resultado.mensaje);
      cargarListadoAdmin(); // Recarga la interfaz para reflejar los cambios
    } else {
      alert("Error al cerrar el evento: " + (resultado.error || "Error desconocido"));
    }
  } catch (error) {
    console.error(error);
    alert("Error de red al conectar con el servidor.");
  }
}

/**
 * Invoca a la Edge Function blindada para eliminar un evento por completo.
 */
async function ejecutarEliminacionElemento(tipoEvento, idElemento) {
  const confirmacion = confirm(`¡ADVERTENCIA! ¿Estás seguro de que deseas ELIMINAR por completo este registro de ${tipoEvento}? Esto no se puede deshacer.`);
  if (!confirmacion) return;

  const admin_id = localStorage.getItem("usuario_id");

  try {
    const response = await fetch(`${BASE_FN}/admin-delete-element`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: tipoEvento, // "preventivos", "operativos" o "emergencias"
        id: idElemento,
        admin_id: admin_id
      })
    });

    if (response.ok) {
      alert("Registro eliminado correctamente de forma segura.");
      cargarListadoAdmin(); // Recarga la interfaz
    } else {
      const resultado = await response.json();
      alert("Error al eliminar: " + (resultado.error || "Error desconocido"));
    }
  } catch (error) {
    console.error(error);
    alert("Error de red al intentar eliminar el elemento.");
  }
}

// Exponer las funciones al objeto 'window' para que los botones de los strings HTML puedan ejecutarlas
window.ejecutarCierreEvento = ejecutarCierreEvento;
window.ejecutarEliminacionElemento = ejecutarEliminacionElemento;
