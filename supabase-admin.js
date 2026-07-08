// ============================================================
// CLIENTE ADMIN (usa la service_role_key)
// ============================================================

const supabaseAdmin = window.supabase.createClient(
  "https://hptnaoliiychgkxsaksy.supabase.co",
  "service_role_key_aquí"   // ⚠️ IMPORTANTE: pon tu clave de servicio real
);

// ============================================================
// LISTADO DE ELEMENTOS (operativos, preventivos, emergencias)
// ============================================================

async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  if (!cont) return;

  cont.innerHTML = "<p>Cargando elementos...</p>";

  const [op, pr, em] = await Promise.all([
    supabaseAdmin.from("operativos").select("*"),
    supabaseAdmin.from("preventivos").select("*"),
    supabaseAdmin.from("emergencias").select("*")
  ]);

  cont.innerHTML = "";

  const render = (lista, tipo) => {
    if (!lista.data) return;
    lista.data.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("card");
      div.innerHTML = `
        <strong>${tipo}:</strong> ${item.titulo}<br>
        <button data-id="${item.id}" data-tipo="${tipo}" class="btn-borrar">Borrar</button>
      `;
      cont.appendChild(div);
    });
  };

  render(op, "operativos");
  render(pr, "preventivos");
  render(em, "emergencias");

  document.querySelectorAll(".btn-borrar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const tipo = btn.dataset.tipo;

      await supabaseAdmin.from(tipo).delete().eq("id", id);
      cargarListadoAdmin();
    });
  });
}

// ============================================================
// GESTIÓN DE USUARIOS
// ============================================================

async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios");
  cont.innerHTML = "<p>Cargando usuarios...</p>";

  const { data: usuarios } = await supabaseAdmin
    .from("usuarios")
    .select("*");

  cont.innerHTML = "";

  usuarios.forEach(u => {
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
}

// ============================================================
// EDITAR USUARIO
// ============================================================

async function editarUsuario(id) {
  const nombre = prompt("Nuevo nombre:");
  const telefono = prompt("Nuevo teléfono:");
  if (!nombre) return;

  await supabaseAdmin.from("usuarios")
    .update({ nombre, telefono })
    .eq("id", id);

  cargarUsuariosAdmin();
}

// ============================================================
// CAMBIAR ROL
// ============================================================

async function cambiarRol(id) {
  const nuevoRol = prompt("Nuevo rol (usuario/admin/coordinador):");
  if (!nuevoRol) return;

  await supabaseAdmin.from("usuarios")
    .update({ rol: nuevoRol })
    .eq("id", id);

  cargarUsuariosAdmin();
}

// ============================================================
// BORRAR USUARIO
// ============================================================

async function borrarUsuario(id) {
  if (!confirm("¿Eliminar usuario?")) return;

  await supabaseAdmin.from("usuarios")
    .delete()
    .eq("id", id);

  cargarUsuariosAdmin();
}
