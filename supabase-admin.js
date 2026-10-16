// =========================================================================
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 1 DE 4)
// =========================================================================
import { supabase, BASE_FN } from "./app.js";

async function inicializarAdminCompleto() {
  initAdminEventListeners();
  await cargarListadoAdmin();
  await cargarUsuariosAdmin();
  // El listado de horas de voluntarios se cargará desde la función dedicada en la Parte 3
  if (typeof cargarListadoHorasVoluntarios === "function") {
    await cargarListadoHorasVoluntarios();
  }
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
    // CORRECTO: Conserva la hora exacta escrita por el usuario adaptándola al estándar ISO con su desfase local real
    const desfaseMinutos = fechaParseada.getTimezoneOffset();
    const fechaCompensada = new Date(fechaParseada.getTime() - (desfaseMinutos * 60000));
    fechaFinISO = fechaCompensada.toISOString().replace('Z', ''); // Removemos la Z para que no asuma UTC puro
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
      if (typeof cargarListadoHorasVoluntarios === "function") {
        await cargarListadoHorasVoluntarios(); // Refresca la tabla de contabilidad de horas en admin
      }
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
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 2 DE 4)
// =========================================================================

// ===============================
// LISTADO GENERAL ADMIN (CORREGIDO Y ACTUALIZADO)
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  if (!cont) return;
  cont.innerHTML = "<p>Cargando listados de administración...</p>";

  try {
    const [operativos, preventivos] = await Promise.all([
      supabase.from("operativos").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("preventivos").select("*").order("fecha_inicio", { ascending: false })
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
            <strong>Fecha de evento:</strong> ${op.fecha || "—"}<br>
            <strong>Fecha inicio:</strong> ${op.fecha_inicio ? op.fecha_inicio.substring(0, 16).replace('T', ' ') : "—"}<br>
            ${estaCerrado ? `<strong>Fecha fin:</strong> \${op.fecha_fin.substring(0, 16).replace('T', ' ')}<br>` : ''}
            <strong>Observaciones:</strong> ${op.descripcion || "Sin observaciones"}<br>
            <small style="color: #666;">Horas totales: ${op.duracion_horas || 0}</small><br>
            
            ${!estaCerrado ? `
              <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="window.ejecutarCierreEvento('\${op.id}', 'operativos')">
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
            <strong>Fecha de evento:</strong> ${pr.fecha || "—"}<br>
            <strong>Fecha inicio:</strong> ${pr.fecha_inicio ? pr.fecha_inicio.substring(0, 16).replace('T', ' ') : "—"}<br>
            ${estaCerrado ? `<strong>Fecha fin:</strong> \${pr.fecha_fin.substring(0, 16).replace('T', ' ')}<br>` : ''}
            <strong>Observaciones:</strong> ${pr.descripcion || "Sin observaciones"}<br>
            <small style="color: #666;">Horas totales: ${pr.duracion_horas || 0}</small><br>
            
            ${!estaCerrado ? `
              <button class="btn-danger" style="margin-top:8px; padding:4px 8px; font-size:12px;" onclick="window.ejecutarCierreEvento('\${pr.id}', 'preventivos')">
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
            <strong>${emg.lugar}</strong> - ${emg.descripcion || "Sin descripción"}<br>
            ${emg.fecha_inicio ? `<small>Inicio: \${emg.fecha_inicio.substring(0, 16).replace('T', ' ')}</small><br>` : ''}
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
            <strong>${emg.lugar}</strong> - ${emg.descripcion || "Sin descripción"}<br>
            <small>Fin: ${emg.fecha_fin ? emg.fecha_fin.substring(0, 16).replace('T', ' ') : "—"}</small><br>
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
      .select("id, nombre, telefono, cumple_mes, cumple_dia, horas, dispositivos(rol)")
      .order("nombre", { ascending: true });

    if (error) throw error;
    cont.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
      cont.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:14px;">
                  <thead>
                    <tr style="background:#f4f4f4; border-bottom:2px solid #ccc; text-align:left;">
                      <th style="padding:8px;">Nombre</th>
                      <th style="padding:8px;">Cumpleaños</th>
                      <th style="padding:8px;">Rol</th>
                      <th style="padding:8px; text-align:center;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>`;
    usuarios.forEach(usr => {
      const rolReal = usr.dispositivos?.rol || "Sin dispositivo";
      const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? `${String(usr.cumple_dia).padStart(2, '0')}/${String(usr.cumple_mes).padStart(2, '0')}` : "—";
      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px; font-weight:bold;">${usr.nombre}</td>
          <td style="padding:8px;">${cumpleStr}</td>
          <td style="padding:8px;">${rolReal.toUpperCase()}</td>
          <td style="padding:8px; text-align:center;">
            <button class="btn-primary" style="padding:2px 6px; font-size:12px; margin-right:4px;" onclick="window.abrirModalEdicionUsuario('${usr.id}')">
              Editar
            </button>
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
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 3 DE 4)
// =========================================================================
function initAdminEventListeners() {
  
  // 1. CREAR USUARIO CON CUMPLEAÑOS HOMOGENEIZADO Y SALDO INICIAL
  const btnCrearUsuario = document.getElementById("btn-crear-usuario");
  if (btnCrearUsuario) {
    btnCrearUsuario.addEventListener("click", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("usr-nombre")?.value.trim();
      const telefono = document.getElementById("usr-telefono")?.value.trim();
      const rol = document.getElementById("usr-rol")?.value;
      const fechaNacimientoInput = document.getElementById("usr-fecha-nacimiento")?.value;
      const horasInicialesInput = document.getElementById("usr-horas-iniciales")?.value;
      
      let admin_id = localStorage.getItem("usuario_id");
      if (!admin_id) {
        const { data: sessionData } = await supabase.auth.getSession();
        admin_id = sessionData?.session?.user?.id;
      }

      if (!admin_id) {
        return alert("Error de sesión: No se ha detectado tu ID de Administrador. Por favor, recarga la página.");
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
          if (typeof cargarListadoHorasVoluntarios === "function") {
            await cargarListadoHorasVoluntarios();
          }
        } else {
          const err = await response.json();
          alert("Error al crear usuario: " + err.error);
        }
      } catch (error) {
        alert("Error de conexión al crear usuario.");
      } finally {
        btnCrearUsuario.disabled = false;
      }
    });
  }

  // 2. CREAR OPERATIVO (CORREGIDO CON NOMENCLATURAS EXPLICITAS DE FECHA)
  const btnCrearOperativo = document.getElementById("btn-crear-operativo");
  if (btnCrearOperativo) {
    btnCrearOperativo.addEventListener("click", async (e) => {
      e.preventDefault();
      const titulo = document.getElementById("op-titulo")?.value.trim();
      const lugar = document.getElementById("op-lugar")?.value.trim();
      const descripcion = document.getElementById("op-descripcion")?.value.trim();
      const fechaInput = document.getElementById("op-fecha")?.value;
      const admin_id = localStorage.getItem("usuario_id");

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha de evento.");

      try {
        btnCrearOperativo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
        const fechaSoloDate = fechaISO.substring(0, 10); // Regla Crítica 3: YYYY-MM-DD para columna DATE

        const response = await fetch(`${BASE_FN}/admin-create-element-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "operativos",
            admin_id,
            values: { titulo, lugar, descripcion, fecha: fechaSoloDate, fecha_inicio: fechaISO }
          })
        });

        if (response.ok) {
          alert("¡Fecha de evento y operativo guardados correctamente!");
          document.getElementById("op-titulo").value = "";
          document.getElementById("op-lugar").value = "";
          document.getElementById("op-descripcion").value = "";
          document.getElementById("op-fecha").value = "";
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error al procesar la creación del operativo.");
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

      if (!titulo || !fechaInput) return alert("Introduce Título y Fecha de evento.");

      try {
        btnCrearPreventivo.disabled = true;
        const fechaISO = new Date(fechaInput).toISOString();
        const fechaSoloDate = fechaISO.substring(0, 10);

        const response = await fetch(`${BASE_FN}/admin-create-element-ts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "preventivos",
            admin_id,
            values: { titulo, lugar, descripcion, fecha: fechaSoloDate, fecha_inicio: fechaISO }
          })
        });

        if (response.ok) {
          alert("Preventivo creado con éxito.");
          document.getElementById("prev-titulo").value = "";
          document.getElementById("prev-lugar").value = "";
          document.getElementById("prev-descripcion").value = "";
          document.getElementById("prev-fecha").value = "";
          await cargarListadoAdmin();
        } else {
          const err = await response.json();
          alert("Error: " + err.error);
        }
      } catch (error) {
        alert("Error al procesar la creación del preventivo.");
      } finally {
        btnCrearPreventivo.disabled = false;
      }
    });
  }

  // 4. CREAR EMERGENCIA (CORREGIDO CON SELECTORES DE TU INTERFAZ NATURALEZA)
  const btnCrearEmergencia = document.getElementById("btn-crear-emergencia");
  if (btnCrearEmergencia) {
    btnCrearEmergencia.addEventListener("click", async (e) => {
      e.preventDefault();
      const lugarInput = document.getElementById("em-lugar") || document.getElementById("input-lugar-emergencia");
      const descInput = document.getElementById("em-descripcion") || document.getElementById("input-desc-emergencia");
      
      let admin_id = localStorage.getItem("usuario_id");
      if (!admin_id) {
        const { data: s } = await supabase.auth.getSession();
        admin_id = s?.session?.user?.id;
      }

      if (!lugarInput?.value.trim() || !descInput?.value.trim()) {
        return alert("Introduce el lugar y la descripción detallada de la emergencia.");
      }

      try {
        btnCrearEmergencia.disabled = true;
        const token = (await supabase.auth.getSession()).data.session?.access_token || "";

        const response = await fetch(`${BASE_FN}/emergencia-ts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apiKey': supabase.supabaseKey,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            lugar: lugarInput.value.trim(),
            descripcion: descInput.value.trim(),
            admin_id: admin_id
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert("🚨 ¡Alerta de Emergencia enviada a todos los terminales!");
          lugarInput.value = "";
          descInput.value = "";
          await cargarListadoAdmin();
        } else {
          throw new Error(result.error || `Servidor respondió con código ${response.status}`);
        }
      } catch (error) {
        console.error("Fallo detallado en enviarEmergencia:", error);
        alert(`Error al procesar la emergencia: ${error.message}`);
      } finally {
        btnCrearEmergencia.disabled = false;
      }
    });
  }
}


// =========================================================================
// APP AVPCEA - PANEL DE ADMINISTRACIÓN (PARTE 4 de 4)
// =========================================================================

// LISTADO EXTENDIDO PARA VER LAS HORAS DE CADA VOLUNTARIO SEGREGADAS
export async function cargarListadoHorasVoluntarios() {
  const cont = document.getElementById("admin-contabilidad-horas");
  if (!cont) return;

  try {
    const { data: registros, error } = await supabase
      .from("horas")
      .select("usuario_id, tipo, horas, anio, usuarios(nombre)")
      .order("anio", { ascending: false });

    if (error) throw error;

    if (!registros || registros.length === 0) {
      cont.innerHTML = "<p>No hay desgloses de horas registrados este año.</p>";
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:14px; text-align:left;">
                  <thead>
                    <tr style="background:#e8f4fd; border-bottom:2px solid #bce0fd; color:#2b6cb0;">
                      <th style="padding:8px;">Voluntario</th>
                      <th style="padding:8px;">Tipo Servicio</th>
                      <th style="padding:8px;">Horas</th>
                      <th style="padding:8px;">Año</th>
                    </tr>
                  </thead>
                  <tbody>`;
    
    registros.forEach(reg => {
      const nombreVoluntario = reg.usuarios?.nombre || "Voluntario eliminado";
      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px; font-weight:bold;">${nombreVoluntario}</td>
          <td style="padding:8px;"><span class="badge-tipo" style="padding:2px 6px; background:#e2e8f0; border-radius:4px; font-size:12px;">${reg.tipo}</span></td>
          <td style="padding:8px; color:#2b6cb0; font-weight:bold;">${parseFloat(reg.horas).toFixed(2)} hs</td>
          <td style="padding:8px;">${reg.anio}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    cont.innerHTML = html;
  } catch (err) {
    console.error("Error cargando contabilidad de horas:", err);
  }
}

// PANEL INTERACTIVO DE EDICIÓN DE VOLUNTARIOS (EXPUESTO A WINDOW)
window.abrirModalEdicionUsuario = async function(id) {
  try {
    const { data: usr, error } = await supabase.from("usuarios").select("*").eq("id", id).single();
    if (error) throw error;

    const nuevoNombre = prompt("Modificar nombre y apellidos:", usr.nombre);
    if (nuevoNombre === null) return;
    const nuevoTelefono = prompt("Modificar número de teléfono:", usr.telefono);
    if (nuevoTelefono === null) return;
    
    // Formateamos visualmente el cumpleaños actual guardado en la base de datos
    const cumpleActual = (usr.cumple_dia && usr.cumple_mes) ? 
      `${String(usr.cumple_dia).padStart(2, '0')}/${String(usr.cumple_mes).padStart(2, '0')}` : "no definido";
      
    const nuevoCumple = prompt("Modificar cumpleaños (Formato: DD/MM) - Actual: " + cumpleActual, cumpleActual);
    if (nuevoCumple === null) return;

    const datosActualizados = {
      nombre: nuevoNombre.trim(),
      telefono: nuevoTelefono.trim()
    };

    // Procesamos defensivamente la cadena de texto ingresada por el administrador
    if (nuevoCumple.includes("/")) {
      const partes = nuevoCumple.split("/");
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      
      if (!isNaN(dia) && !isNaN(mes) && dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        datosActualizados.cumple_dia = dia;
        datosActualizados.cumple_mes = mes;
      } else {
        alert("Formato de día o mes inválido. No se ha modificado la fecha de cumpleaños.");
      }
    }

    const { error: updateError } = await supabase.from("usuarios").update(datosActualizados).eq("id", id);
    if (updateError) throw updateError;

    alert("Datos del voluntario actualizados con éxito.");
    
    // Sincronización instantánea de las listas del panel de control
    await cargarUsuariosAdmin();
    await cargarListadoHorasVoluntarios();

  } catch (err) {
    alert("Error al editar voluntario: " + err.message);
  }
};
