// =========================================================================
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 1 DE 3)
// =========================================================================
import { supabase, BASE_FN } from "./app.js";

async function inicializarAdminCompleto() {
  initAdminEventListeners();
  await cargarListadoAdmin();
  await cargarUsuariosAdmin();
}

// Inicialización defensiva dual según Regla Crítica 3
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAdminCompleto);
} else {
  inicializarAdminCompleto();
}

// =========================================================================
// EXPOSICIÓN GLOBAL: FUNCIONES INTERACTIVAS PARA BOTONES HTML
// =========================================================================

// Cierre interactivo solicitando los datos pendientes
window.ejecutarCierreEvento = async function(id, tipo) {
  const horaFinInput = prompt(
    `Introduce la fecha y hora de FINALIZACIÓN para este registro de ${tipo} (Formato: AAAA-MM-DD HH:MM). \nDejar en blanco para usar la hora actual:`
  );
  
  if (horaFinInput === null) return; 

  let fechaFinISO;
  if (horaFinInput.trim() === "") {
    fechaFinISO = new Date().toISOString();
  } else {
    const fechaParseada = new Date(horaFinInput.replace(' ', 'T'));
    if (isNaN(fechaParseada.getTime())) {
      alert("Formato de fecha inválido. Por favor, usa el formato: AAAA-MM-DD HH:MM (Ej: 2026-10-24 20:30)");
      return;
    }
    fechaFinISO = fechaParseada.toISOString();
  }

  try {
    const admin_id = localStorage.getItem("usuario_id");
    const idLimpio = isNaN(Number(id)) ? id : Number(id);

    const response = await fetch(`${BASE_FN}/admin-close-element-ts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idLimpio, tipo, admin_id, fecha_fin: fechaFinISO })
    });

    if (response.ok) {
      alert("Registro cerrado correctamente. Las horas han sido procesadas.");
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
    const idLimpio = isNaN(Number(id)) ? id : Number(id);
    const { error } = await supabase.from(tipo).delete().eq("id", idLimpio);
    if (error) throw error;
    alert("Registro eliminado.");
    await cargarListadoAdmin();
  } catch (error) {
    console.error(error);
    alert(`Error al eliminar: ${error.message}`);
  }
};
// =========================================================================
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 2 DE 3)
// =========================================================================

// ===============================
// LISTADO GENERAL ADMIN (CORREGIDO SIN ESCAPES)
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
          <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'}; margin-bottom:10px; padding:12px; border:1px solid #ddd; border-radius:4px;">
            <strong>Título:</strong> ${op.titulo}<br>
            <strong>Lugar:</strong> ${op.lugar || "—"}<br>
            <strong>Fecha:</strong> ${op.fecha}<br>
            <strong>Observaciones:</strong> ${op.descripcion || "Sin observaciones"}<br>
            <small style="color: #666;">Horas totales: ${op.duracion_horas || 0}</small><br>
            
            ${!estaCerrado ? `
              <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="window.ejecutarCierreEvento('${op.id}', 'operativos')">
                Cerrar y Contar Horas
              </button>
            ` : `<span style="color:green; font-weight:bold; font-size:12px; display:inline-block; margin-top:8px;">✓ Cerrado</span>`}
            <button class="btn-secondary" style="margin-top:8px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="window.ejecutarEliminacionElemento('operativos', '${op.id}')">
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
          <div class="card" style="opacity: ${estaCerrado ? '0.7' : '1'}; margin-bottom:10px; padding:12px; border:1px solid #ddd; border-radius:4px;">
            <strong>Título:</strong> ${pr.titulo}<br>
            <strong>Lugar:</strong> ${pr.lugar || "—"}<br>
            <strong>Fecha:</strong> ${pr.fecha}<br>
            <strong>Observaciones:</strong> ${pr.descripcion || "Sin observaciones"}<br>
            <small style="color: #666;">Horas totales: ${pr.duracion_horas || 0}</small><br>
            
            ${!estaCerrado ? `
              <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="window.ejecutarCierreEvento('${pr.id}', 'preventivos')">
                Cerrar y Contar Horas
              </button>
            ` : `<span style="color:green; font-weight:bold; font-size:12px; display:inline-block; margin-top:8px;">✓ Cerrado</span>`}
            <button class="btn-secondary" style="margin-top:8px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="window.ejecutarEliminacionElemento('preventivos', '${pr.id}')">
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
    console.error(err);
  }
}

// ===============================
// EMERGENCIAS ADMIN
// ===============================
async function cargarEmergenciasAdmin() {
  const cont = document.getElementById("admin-emergencias");
  if (!cont) return;

  try {
    const [activas, finalizadas] = await Promise.all([
      supabase.from("emergencias").select("*").eq("activa", true).order("fecha_inicio", { ascending: false }),
      supabase.from("emergencias").select("*").eq("activa", false).order("fecha_fin", { ascending: false })
    ]);

    cont.innerHTML = "";
    cont.innerHTML += `<h4>Emergencias activas</h4>`;
    if (activas.data && activas.data.length > 0) {
      activas.data.forEach(emg => {
        cont.innerHTML += `
          <div class="card" style="margin-bottom:10px; padding:10px; border:1px solid #ffcccc; background:#fff5f5;">
            <strong>${emg.titulo}</strong> - Nivel: ${String(emg.nivel).toUpperCase()}<br>
            <button class="btn-danger" style="margin-top:5px;" onclick="window.ejecutarCierreEvento('${emg.id}', 'emergencias')">
              Cerrar emergencia
            </button>
          </div>
        `;
      });
    } else {
      cont.innerHTML += `<p>No hay emergencias activas.</p>`;
    }

    cont.innerHTML += `<h4 style="margin-top:20px;">Emergencias finalizadas</h4>`;
    if (finalizadas.data && finalizadas.data.length > 0) {
      finalizadas.data.forEach(emg => {
        cont.innerHTML += `
          <div class="card" style="opacity:0.7; margin-bottom:10px; padding:10px; border:1px solid #ddd;">
            <strong>${emg.titulo}</strong> - Nivel: ${String(emg.nivel).toUpperCase()}<br>
            <button class="btn-secondary" style="margin-top:5px; padding:4px 8px; font-size:12px; background-color:#777;" onclick="window.ejecutarEliminacionElemento('emergencias', '${emg.id}')">
              Eliminar registro
            </button>
          </div>
        `;
      });
    } else {
      cont.innerHTML += `<p>No hay emergencias finalizadas.</p>`;
    }
  } catch (error) {
    console.error(error);
  }
}

// ===============================
// LISTADO DE VOLUNTARIOS
// ===============================
export async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios-lista") || document.getElementById("admin-usuarios");
  if (!cont) return;

  try {
    const { data: usuarios, error } = await supabase
      .from("usuarios")
      .select("id, nombre, telefono, dispositivos(rol)")
      .order("nombre", { ascending: true });

    if (error) throw error;
    cont.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
      cont.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:14px;"><tbody>`;
    usuarios.forEach(usr => {
      const rolReal = usr.dispositivos?.rol || "Sin dispositivo";
      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px; font-weight:bold;">${usr.nombre}</td>
          <td style="padding:8px;">${rolReal.toUpperCase()}</td>
          <td style="padding:8px; text-align:center;">
            <button class="btn-secondary" style="padding:2px 6px; font-size:12px; background:#777;" onclick="window.ejecutarEliminacionElemento('usuarios', '${usr.id}')">
              Baja
            </button>
          </td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    cont.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}
// =========================================================================
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 3 DE 3 - ACTUALIZADA)
// =========================================================================
function initAdminEventListeners() {
  
  // 1. CREAR USUARIO CON FECHA DE NACIMIENTO, HORAS INICIALES Y ADMIN_ID (BLINDADO)
  const btnCrearUsuario = document.getElementById("btn-crear-usuario");
  if (btnCrearUsuario) {
    btnCrearUsuario.addEventListener("click", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("usr-nombre")?.value.trim();
      const telefono = document.getElementById("usr-telefono")?.value.trim();
      const rol = document.getElementById("usr-rol")?.value;
      const fechaNacimientoInput = document.getElementById("usr-fecha-nacimiento")?.value;
      const horasInicialesInput = document.getElementById("usr-horas-iniciales")?.value;
      
      // CAPTURA DEFENSIVA: Si no encuentra el usuario_id en localStorage, busca en la sesión activa de Supabase
      let admin_id = localStorage.getItem("usuario_id");
      if (!admin_id) {
        const { data: sessionData } = await supabase.auth.getSession();
        admin_id = sessionData?.session?.user?.id;
      }

      // Si aun así está vacío, obligamos a detener el flujo para que no rompa la Edge Function
      if (!admin_id) {
        return alert("Error de sesión: No se ha detectado tu ID de Administrador en el dispositivo. Por favor, recarga la página.");
      }

      if (!nombre || !telefono || !rol) return alert("Rellena nombre, teléfono y rol.");

      try {
        btnCrearUsuario.disabled = true;
        
        const payload = { 
          nombre, 
          telefono, 
          rol,
          admin_id,
          horas: horasInicialesInput ? parseFloat(horasInicialesInput) : 0.00
        };

        // Procesamos la fecha del selector y la transformamos directamente a los enteros correspondientes
        if (fechaNacimientoInput) {
          const fechaParseada = new Date(fechaNacimientoInput);
          if (!isNaN(fechaParseada.getTime())) {
            payload.cumple_mes = fechaParseada.getMonth() + 1; 
            payload.cumple_dia = fechaParseada.getDate();
          }
        }


        const response = await fetch(`${BASE_FN}/admin-create-user-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          alert("Usuario creado correctamente con su rol y saldo de horas.");
          document.getElementById("usr-nombre").value = "";
          document.getElementById("usr-telefono").value = "";
          document.getElementById("usr-fecha-nacimiento").value = "";
          document.getElementById("usr-horas-iniciales").value = "0.00";
          await cargarUsuariosAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error de conexión.");
      } finally {
        btnCrearUsuario.disabled = false;
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
      const fechaInput = document.getElementById("op-fecha")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha.");

      try {
        btnCrearOperativo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
        const fechaSoloDate = fechaISO.substring(0, 10); // Regla Crítica 3: Exclusivamente YYYY-MM-DD

        const response = await fetch(`${BASE_FN}/admin-create-element-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "operativos",
            admin_id,
            values: { titulo, lugar, descripcion, fecha: fechaSoloDate, fecha_inicio: fechaISO, creado_en: new Date().toISOString() }
          })
        });

        if (response.ok) {
          alert("Operativo creado.");
          document.getElementById("form-crear-operativo")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error al procesar.");
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

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha.");

      try {
        btnCrearPreventivo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
        const fechaSoloDate = fechaISO.substring(0, 10); // Regla Crítica 3: Exclusivamente YYYY-MM-DD

        const response = await fetch(`${BASE_FN}/admin-create-element-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "preventivos",
            admin_id,
            values: { titulo, lugar, descripcion, fecha: fechaSoloDate, fecha_inicio: fechaISO, creado_en: new Date().toISOString() }
          })
        });

        if (response.ok) {
          alert("Preventivo creado.");
          document.getElementById("form-crear-preventivo")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error al procesar.");
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

      if (!titulo || !nivel || !fechaInput) return alert("Rellene todos los campos.");

      try {
        btnCrearEmergencia.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();

        const response = await fetch(`${BASE_FN}/admin-create-element-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "emergencias",
            admin_id,
            values: { titulo, nivel, fecha_inicio: fechaISO, activa: true, creado_en: new Date().toISOString() }
          })
        });

        if (response.ok) {
          alert("Emergencia reportada.");
          document.getElementById("form-crear-emergencia")?.reset();
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error al procesar.");
      } finally {
        btnCrearEmergencia.disabled = false;
      }
    });
  }
}
