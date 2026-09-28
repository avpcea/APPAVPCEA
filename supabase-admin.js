// =========================================================================
// PARTE 1: IMPORTACIONES Y CARGA DINÁMICA DE VISTAS ADMINISTRATIVAS
// =========================================================================
import { supabase, BASE_FN } from "./app.js";

// Inicialización segura cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  initAdminEventListeners();
});

// ===============================
// LISTADO GENERAL ADMIN (ACTUALIZADO)
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  if (!cont) return;
  cont.innerHTML = "<p>Cargando listados de administración...</p>";

  const [operativos, preventivos] = await Promise.all([
    supabase.from("operativos").select("*").order("fecha", { ascending: false }),
    supabase.from("preventivos").select("*").order("fecha", { ascending: false })
  ]);

  cont.innerHTML = "";

  // ===============================
  // OPERATIVOS (CON COLUMNA LUGAR UNIFICADA)
  // ===============================
  cont.innerHTML += `<h3>Operativos</h3>`;
  if (operativos.data && operativos.data.length > 0) {
    operativos.data.forEach(op => {
      const estaCerrado = op.fecha_fin !== null;
      cont.innerHTML += `
        <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'}; margin-bottom: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
          <strong>Título:</strong> ${op.titulo}<br>
          <strong>Lugar:</strong> ${op.lugar || "—"}<br>
          <strong>Fecha:</strong> ${op.fecha}<br>
          <strong>Observaciones:</strong> ${op.descripcion || "Sin observaciones"}<br>
          <small style="color: #666;">Horas totales calculadas: ${op.duracion_horas || 0}</small><br>
          
          ${!estaCerrado ? `
            <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="ejecutarCierreEvento('\${op.id}', 'operativos')">
              Cerrar y Contar Horas
            </button>
          ` : `<span style="color:green; font-weight:bold; font-size:12px; display:inline-block; margin-top:8px;">✓ Cerrado</span>`}
          <button class="btn-secondary" style="margin-top:8px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('operativos', '${op.id}')">
            Eliminar
          </button>
        </div>
      `;
    });
  } else {
    cont.innerHTML += `<p>No hay operativos registrados.</p>`;
  }

  // ===============================
  // PREVENTIVOS (CON NUEVO ORDEN DE CAMPOS)
  // ===============================
  cont.innerHTML += `<h3>Preventivos</h3>`;
  if (preventivos.data && preventivos.data.length > 0) {
    preventivos.data.forEach(pr => {
      const estaCerrado = pr.fecha_fin !== null;
      cont.innerHTML += `
        <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'}; margin-bottom: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
          <strong>Título:</strong> ${pr.titulo}<br>
          <strong>Lugar:</strong> ${pr.lugar || "—"}<br>
          <strong>Fecha:</strong> ${pr.fecha}<br>
          <strong>Observaciones:</strong> ${pr.descripcion || "Sin observaciones"}<br>
          <small style="color: #666;">Horas totales calculadas: ${pr.duracion_horas || 0}</small><br>
          
          ${!estaCerrado ? `
            <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="ejecutarCierreEvento('\${pr.id}', 'preventivos')">
              Cerrar y Contar Horas
            </button>
          ` : `<span style="color:green; font-weight:bold; font-size:12px; display:inline-block; margin-top:8px;">✓ Cerrado</span>`}
          <button class="btn-secondary" style="margin-top:8px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('preventivos', '${pr.id}')">
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
  if (!cont) return;
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

// =========================================================================
// PARTE 2: CENTRALIZACIÓN DE LISTENERS (PREVIENE FALLOS DE ELEMENTOS NULOS)
// =========================================================================
function initAdminEventListeners() {
  
  // 1. CREAR USUARIO (Edge Function Segura)
  const btnCrearUsuario = document.getElementById("btn-crear-usuario");
  if (btnCrearUsuario) {
    btnCrearUsuario.addEventListener("click", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("usr-nombre")?.value.trim();
      const telefono = document.getElementById("usr-telefono")?.value.trim();
      const rol = document.getElementById("usr-rol")?.value;

      if (!nombre || !telefono || !rol) {
        return alert("Por favor, rellena el nombre, teléfono y rol del usuario.");
      }

      try {
        btnCrearUsuario.disabled = true;
        btnCrearUsuario.innerText = "Creando...";

        const response = await fetch(`${BASE_FN}/admin-create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono, rol })
        });

        if (response.ok) {
          alert(`Usuario ${nombre} creado correctamente.`);
          document.getElementById("usr-nombre").value = "";
          document.getElementById("usr-telefono").value = "";
          document.getElementById("usr-rol").value = "voluntario";
          
          if (typeof cargarUsuariosAdmin === 'function') await cargarUsuariosAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + (err.error || "No se pudo crear el usuario"));
        }
      } catch (error) {
        console.error("Error al crear usuario:", error);
        alert("Error de conexión al crear el usuario.");
      } finally {
        btnCrearUsuario.disabled = false;
        btnCrearUsuario.innerText = "Crear Usuario";
      }
    });
  }

  // 2. CREAR OPERATIVO (Columna Lugar Unificada)
  const btnCrearOperativo = document.getElementById("btn-crear-operativo");
  if (btnCrearOperativo) {
    btnCrearOperativo.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("op-titulo")?.value.trim();
      const lugar = document.getElementById("op-lugar")?.value.trim();
      const descripcion = document.getElementById("op-descripcion")?.value.trim();
      const fechaInicioInput = document.getElementById("op-fecha-inicio")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo) return alert("Introduce un título.");
      if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

      try {
        btnCrearOperativo.disabled = true;
        const fechaISO = new Date(fechaInicioInput).toISOString();
        const fechaSoloDate = fechaISO.split('T')[0];

        const response = await fetch(`${BASE_FN}/admin-create-element`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "operativos",
            admin_id,
            values: {
              titulo,
              lugar,
              descripcion,
              fecha: fechaSoloDate,
              fecha_inicio: fechaISO,
              creado_en: new Date().toISOString()
            }
          })
        });

        if (response.ok) {
          alert("Operativo creado correctamente.");
          document.getElementById("op-titulo").value = "";
          document.getElementById("op-lugar").value = "";
          document.getElementById("op-descripcion").value = "";
          document.getElementById("op-fecha-inicio").value = "";
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red al crear el operativo.");
      } finally {
        btnCrearOperativo.disabled = false;
      }
    });
  }

  // 3. CREAR PREVENTIVO (Columna Lugar Unificada)
  const btnCrearPreventivo = document.getElementById("btn-crear-preventivo");
  if (btnCrearPreventivo) {
    btnCrearPreventivo.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("pr-titulo")?.value.trim();
      const lugar = document.getElementById("pr-lugar")?.value.trim();
      const descripcion = document.getElementById("pr-descripcion")?.value.trim();
      const fechaInicioInput = document.getElementById("pr-fecha-inicio")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo) return alert("Introduce un título.");
      if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

      try {
        btnCrearPreventivo.disabled = true;
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
              lugar,
              descripcion,
              fecha: fechaSoloDate,
              fecha_inicio: fechaISO,
              creado_en: new Date().toISOString()
            }
          })
        });

        if (response.ok) {
          alert("Preventivo creado correctamente.");
          document.getElementById("pr-titulo").value = "";
          document.getElementById("pr-lugar").value = "";
          document.getElementById("pr-descripcion").value = "";
          document.getElementById("pr-fecha-inicio").value = "";
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red al crear el preventivo.");
      } finally {
        btnCrearPreventivo.disabled = false;
      }
    });
  }

  // 4. CREAR EMERGENCIA (Estructura Simplificada)
  const btnCrearEmergencia = document.getElementById("btn-crear-emergencia");
  if (btnCrearEmergencia) {
    btnCrearEmergencia.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("em-titulo")?.value.trim();
      const nivel = document.getElementById("em-nivel")?.value;
      const fechaInicioInput = document.getElementById("em-fecha-inicio")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo) return alert("Introduce un título de la emergencia.");
      if (!nivel) return alert("Selecciona un nivel de gravedad.");
      if (!fechaInicioInput) return alert("Introduce la fecha y hora de inicio.");

      try {
        btnCrearEmergencia.disabled = true;
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
              fecha_inicio: fechaISO,
              activa: true,
              creado_en: new Date().toISOString()
            }
          })
        });

        if (response.ok) {
          alert("Emergencia reportada y activa correctamente.");
          document.getElementById("em-titulo").value = "";
          document.getElementById("em-nivel").value = "baja";
          document.getElementById("em-fecha-inicio").value = "";
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red al reportar la emergencia.");
      } finally {
        btnCrearEmergencia.disabled = false;
      }
    });
  }
}
