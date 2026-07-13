// ============================================================
// ADMIN: Archivo supabase-admin.js adaptado a Edge Functions
// ============================================================

alert("ADMIN: supabase-admin.js se está ejecutando");

// URL base de tus Edge Functions
const BASE_FN = "https://hptnaoliiychgkxsaksy.supabase.co/functions/v1";

// ============================================================
// CREAR USUARIO
// ============================================================

async function crearUsuario(values) {
  await fetch(`${BASE_FN}/admin-create-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  cargarUsuariosAdmin();
}

// ============================================================
// BOTON CREAR USUARIO
// ============================================================

document.getElementById("btn-crear-usuario").addEventListener("click", async () => {
  const nombre = document.getElementById("usr-nombre").value;
  const telefono = document.getElementById("usr-telefono").value;
  const rol = document.getElementById("usr-rol").value;

  crearUsuario({ nombre, telefono, rol });
});

// ============================================================
// LISTAR USUARIOS
// ============================================================

async function cargarUsuariosAdmin() {
  alert("ADMIN: cargando usuarios desde Edge Function");

  const res = await fetch(`${BASE_FN}/admin-list-users`);
  const json = await res.json();

  const cont = document.getElementById("admin-usuarios");
  cont.innerHTML = "";

  json.data.forEach(u => {
    cont.innerHTML += `
      <div class="card">
        <h4>${u.nombre}</h4>
        <p><strong>Teléfono:</strong> ${u.telefono || "—"}</p>
        <p><strong>Rol:</strong> ${u.rol}</p>

        <button onclick="editarUsuario('${u.id}')">Editar</button>
        <button onclick="cambiarRol('${u.id}')">Cambiar Rol</button>
        <button onclick="borrarUsuario('${u.id}')" class="btn-danger">Eliminar</button>
      </div>
    `;
  });

  alert("ADMIN: usuarios cargados");
}

// ============================================================
// EDITAR USUARIO
// ============================================================

async function editarUsuario(id) {
  const nombre = prompt("Nuevo nombre:");
  const telefono = prompt("Nuevo teléfono:");
  if (!nombre) return;

  alert("ADMIN: enviando actualización de usuario");

  await fetch(`${BASE_FN}/admin-update-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      values: { nombre, telefono }
    })
  });

  cargarUsuariosAdmin();
}

// ============================================================
// CAMBIAR ROL USUARIO
// ============================================================

async function cambiarRol(id) {
  const nuevoRol = prompt("Nuevo rol (usuario/admin/coordinador):");
  if (!nuevoRol) return;

  alert("ADMIN: cambiando rol");

  await fetch(`${BASE_FN}/admin-update-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      values: { rol: nuevoRol }
    })
  });

  cargarUsuariosAdmin();
}

// ============================================================
// BORRAR USUARIO
// ============================================================

async function borrarUsuario(id) {
  if (!confirm("¿Eliminar usuario?")) return;

  alert("ADMIN: borrando usuario");

  await fetch(`${BASE_FN}/admin-delete-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  cargarUsuariosAdmin();
}

// ============================================================
// LISTAR ELEMENTOS (operativos, preventivos, emergencias)
// ============================================================

async function cargarListadoAdmin() {
  alert("ADMIN: cargando listado de elementos");

  const cont = document.getElementById("admin-listado");
  cont.innerHTML = "<p>Cargando...</p>";

  const res = await fetch(`${BASE_FN}/admin-list-elements`);
  const json = await res.json();

  cont.innerHTML = "";

  json.data.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <strong>${item.tipo}:</strong> ${item.titulo}<br>
      <button onclick="borrarElemento('${item.id}', '${item.tipo}')">Borrar</button>
    `;
    cont.appendChild(div);
  });

  alert("ADMIN: elementos cargados");
}

// ============================================================
// BORRAR ELEMENTO
// ============================================================

async function borrarElemento(id, tipo) {
  if (!confirm("¿Eliminar elemento?")) return;

  alert("ADMIN: borrando elemento");

  await fetch(`${BASE_FN}/admin-delete-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, tipo })
  });

  cargarListadoAdmin();
}

// ============================================================
// CREAR ELEMENTO
// ============================================================

async function crearElemento(tipo, values) {
  await fetch(`${BASE_FN}/admin-create-element`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, values })
  });

  cargarListadoAdmin();
}

// ============================================================
// BOTONES ELEMENTO
// ============================================================

document.getElementById("btn-crear-operativo").addEventListener("click", async () => {
  crearElemento("operativos", {
    titulo: document.getElementById("op-titulo").value,
    descripcion: document.getElementById("op-descripcion").value
  });
});

document.getElementById("btn-crear-preventivo").addEventListener("click", async () => {
  crearElemento("preventivo", {
    titulo: document.getElementById("op-titulo").value,
    descripcion: document.getElementById("op-descripcion").value
  });
});

document.getElementById("btn-crear-emergencias").addEventListener("click", async () => {
  crearElemento("emergencias", {
    titulo: document.getElementById("op-titulo").value,
    descripcion: document.getElementById("op-descripcion").value
  });
});

// ============================================================
// CREAR HORAS
// ============================================================

const { data: evento } = await supabase
  .from(tabla)
  .select("duracion_horas")
  .eq("id", evento_id)
  .maybeSingle();

const horas = evento?.duracion_horas || 0;
const año = new Date().getFullYear();

// ============================================================
// CREAR SUSCRIPCIONES
// ============================================================

async function crearSuscripcion(values) {
  await fetch(`${BASE_FN}/admin-create-suscripcion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  cargarSuscripcionesAdmin();
}
