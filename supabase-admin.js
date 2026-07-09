// ============================================================
// ADMIN: Archivo supabase-admin.js adaptado a Edge Functions
// ============================================================

alert("ADMIN: supabase-admin.js se está ejecutando");

// URL base de tus Edge Functions
const BASE_FN = "https://hptnaoliiychgkxsaksy.supabase.co/functions/v1";

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
// CAMBIAR ROL
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
