// =========================================================================
// PARTE 1: IMPORTACIONES, EXPOSICIÓN GLOBAL Y RENDERIZADO DE CONTENIDOS
// =========================================================================
import { supabase, BASE_FN } from "./app.js";

// Hook de inicialización inmediata al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
  console.log("AVPCEA Admin: Inicializando interfaz administrativa...");
  
  // 1. Vinculamos los interceptores de eventos
  initAdminEventListeners();
  
  // 2. Forzamos la carga inicial automática de los listados para que no aparezcan vacíos
  await cargarListadoAdmin();
  if (typeof cargarUsuariosAdmin === 'function') {
    await cargarUsuariosAdmin();
  }
});

// COMPONENTE CRÍTICO: Exponer funciones al objeto Window para que los botones 'onclick' nativos funcionen
window.ejecutarCierreEvento = async function(id, tipo) {
  if (!confirm(`¿Estás seguro de que deseas cerrar este registro de ${tipo}?`)) return;
  try {
    const admin_id = localStorage.getItem("usuario_id");
    const response = await fetch(`${BASE_FN}/admin-close-element`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tipo, admin_id, fecha_fin: new Date().toISOString() })
    });
    if (response.ok) {
      alert("Registro cerrado correctamente y horas contabilizadas.");
      await cargarListadoAdmin();
    } else {
      const err = await response.json();
      alert("Error al cerrar: " + err.error);
    }
  } catch (error) {
    console.error(error);
    alert("Error de red al procesar el cierre.");
  }
};

window.ejecutarEliminacionElemento = async function(tipo, id) {
  if (!confirm(`¿Estás seguro de eliminar definitivamente este registro de ${tipo}?`)) return;
  try {
    const { error } = await supabase.from(tipo).delete().eq("id", id);
    if (error) throw error;
    alert("Registro eliminado con éxito.");
    await cargarListadoAdmin();
  } catch (error) {
    console.error(error);
    alert(`Error al eliminar: ${error.message}`);
  }
};

// ===============================
// LISTADO GENERAL ADMIN
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  if (!cont) return;
  cont.innerHTML = "<p>Cargando listados de administración...</p>";

  try {
    const [operativos, preventivos] = await Promise.all([
      supabase.from("operativos").select("*").order("fecha", { ascending: false }),
      supabase.from("preventivos").select("*").order("fecha", { ascending: false })
    ]);

    cont.innerHTML = "";

    // OPERATIVOS
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

    // PREVENTIVOS
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

    cont.innerHTML += `<h3>Emergencias</h3>`;
    cont.innerHTML += `<div id="admin-emergencias"></div>`;
    await cargarEmergenciasAdmin();

  } catch (err) {
    console.error("Error al renderizar paneles generales:", err);
    cont.innerHTML = "<p style='color:red;'>Error al cargar los listados.</p>";
  }
}

// ===============================
// EMERGENCIAS ADMIN (ACTIVAS + FINALIZADAS)
// ===============================
async function cargarEmergenciasAdmin() {
  const cont = document.getElementById("admin-emergencias");
  if (!cont) return;
  cont.innerHTML = "<p>Cargando emergencias...</p>";

  try {
    const [activas, finalizadas] = await Promise.all([
      supabase.from("emergencias").select("*").eq("activa", true).order("fecha_inicio", { ascending: false }),
      supabase.from("emergencias").select("*").eq("activa", false).order("fecha_fin", { ascending: false })
    ]);

    cont.innerHTML = "";

    cont.innerHTML += `<h4>Emergencias activas</h4>`;
    if (!activas.data || activas.data.length === 0) {
      cont.innerHTML += `<p>No hay emergencias activas.</p>`;
    } else {
      activas.data.forEach(emg => {
        cont.innerHTML += `
          <div class="card" style="margin-bottom:10px; padding:10px; border:1px solid #ffcccc; background:#fff5f5;">
            <strong>${emg.titulo}</strong><br>
            Nivel: ${String(emg.nivel).toUpperCase()}<br>
            Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>
            <button class="btn-danger" style="margin-top:5px;" onclick="ejecutarCierreEvento('${emg.id}', 'emergencias')">
              Cerrar emergencia
            </button>
          </div>
        `;
      });
    }

    cont.innerHTML += `<h4 style="margin-top:20px;">Emergencias finalizadas</h4>`;
    if (!finalizadas.data || finalizadas.data.length === 0) {
      cont.innerHTML += `<p>No hay emergencias finalizadas.</p>`;
    } else {
      finalizadas.data.forEach(emg => {
        cont.innerHTML += `
          <div class="card" style="opacity:0.7; margin-bottom:10px; padding:10px; border:1px solid #ddd;">
            <strong>${emg.titulo}</strong><br>
            Nivel: ${String(emg.nivel).toUpperCase()}<br>
            Inicio: ${new Date(emg.fecha_inicio).toLocaleString()}<br>
            Fin: ${new Date(emg.fecha_fin).toLocaleString()}<br>
            <button class="btn-secondary" style="margin-top:5px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="ejecutarEliminacionElemento('emergencias', '${emg.id}')">
              Eliminar registro
            </button>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error("Error cargando emergencias:", error);
    cont.innerHTML = "<p>Error al cargar subsección de emergencias.</p>";
  }
}

// =========================================================================
// PARTE 2: CAPTURA DE FORMULARIOS HOMOGÉNEOS Y PROCESAMIENTO EDGE FUNCTIONS
// =========================================================================
function initAdminEventListeners() {
  
  // 1. CREAR USUARIO (Edge Function)
  const btnCrearUsuario = document.getElementById("btn-crear-usuario");
  if (btnCrearUsuario) {
    btnCrearUsuario.addEventListener("click", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("usr-nombre")?.value.trim();
      const telefono = document.getElementById("usr-telefono")?.value.trim();
      const rol = document.getElementById("usr-rol")?.value;
      
      // Captura opcional de campos de cumpleaños si existen en tu UI (Mes y Día)
      const cumpleMes = document.getElementById("usr-cumple-mes")?.value;
      const cumpleDia = document.getElementById("usr-cumple-dia")?.value;

      if (!nombre || !telefono || !rol) {
        return alert("Por favor, rellena el nombre, teléfono y rol del usuario.");
      }

      try {
        btnCrearUsuario.disabled = true;
        btnCrearUsuario.innerText = "Creando...";

        const payload = { nombre, telefono, rol };
        if(cumpleMes && cumpleDia) {
          payload.cumple_mes = parseInt(cumpleMes);
          payload.cumple_dia = parseInt(cumpleDia);
        }

        const response = await fetch(`${BASE_FN}/admin-create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
        console.error(error);
        alert("Error de conexión al crear el usuario.");
      } finally {
        btnCrearUsuario.disabled = false;
        btnCrearUsuario.innerText = "Crear Usuario";
      }
    });
  }

  // 2. CREAR OPERATIVO
  const btnCrearOperativo = document.getElementById("btn-crear-operativo");
  if (btnCrearOperativo) {
    btnCrearOperativo.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("op-titulo")?.value.trim();
      const lugar = document.getElementById("op-lugar")?.value.trim();
      const descripcion = document.getElementById("op-descripcion")?.value.trim();
      // Selector homogeneizado según tu especificación actual
      const fechaInput = document.getElementById("op-fecha")?.value; 
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha/Hora de inicio.");

      try {
        btnCrearOperativo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
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
          document.getElementById("form-crear-operativo")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red.");
      } finally {
        btnCrearOperativo.disabled = false;
      }
    });
  }

  // 3. CREAR PREVENTIVO
  const btnCrearPreventivo = document.getElementById("btn-crear-preventivo");
  if (btnCrearPreventivo) {
    btnCrearPreventivo.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("prev-titulo")?.value.trim();
      const lugar = document.getElementById("prev-lugar")?.value.trim();
      const descripcion = document.getElementById("prev-descripcion")?.value.trim();
      const fechaInput = document.getElementById("prev-fecha")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha/Hora de inicio.");

      try {
        btnCrearPreventivo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
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
          document.getElementById("form-crear-preventivo")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red.");
      } finally {
        btnCrearPreventivo.disabled = false;
      }
    });
  }

  // 4. CREAR EMERGENCIA
  const btnCrearEmergencia = document.getElementById("btn-crear-emergencia");
  if (btnCrearEmergencia) {
    btnCrearEmergencia.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("em-titulo")?.value.trim();
      const nivel = document.getElementById("em-nivel")?.value;
      const fechaInput = document.getElementById("em-fecha")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo || !nivel || !fechaInput) return alert("Rellene todos los campos obligatorios.");

      try {
        btnCrearEmergencia.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();

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
          alert("Emergencia reportada de inmediato.");
          document.getElementById("form-crear-emergencia")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error de red.");
      } finally {
        btnCrearEmergencia.disabled = false;
      }
    });
  }
}
