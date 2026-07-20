// supabase-admin.js

import { supabase } from "./app.js";

// ===============================
// CARGAR LISTADO GENERAL (operativos, preventivos, emergencias)
// ===============================
export async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");
  cont.innerHTML = "<p>Cargando...</p>";

  const [operativos, preventivos, emergencias] = await Promise.all([
    supabase.from("operativos").select("*").order("fecha", { ascending: false }),
    supabase.from("preventivos").select("*").order("fecha", { ascending: false }),
    supabase.from("emergencias").select("*").order("fecha", { ascending: false })
  ]);

  cont.innerHTML = "";

  cont.innerHTML += `<h3>Operativos</h3>`;
  operativos.data.forEach(op => {
    cont.innerHTML += `
      <div>
        <strong>${op.titulo}</strong><br>
        ${op.descripcion || ""}
      </div>
    `;
  });

  cont.innerHTML += `<h3>Preventivos</h3>`;
  preventivos.data.forEach(pr => {
    cont.innerHTML += `
      <div>
        <strong>${pr.titulo}</strong><br>
        ${pr.descripcion || ""}
      </div>
    `;
  });

  cont.innerHTML += `<h3>Emergencias</h3>`;
  emergencias.data.forEach(em => {
    cont.innerHTML += `
      <div>
        <strong>${em.titulo}</strong><br>
        ${em.descripcion || ""}
      </div>
    `;
  });
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
// CREAR EMERGENCIA
// ===============================
document.getElementById("btn-crear-emergencia").addEventListener("click", async () => {
  const titulo = document.getElementById("em-titulo").value.trim();
  const descripcion = document.getElementById("em-descripcion").value.trim();

  if (!titulo) return alert("Introduce un título.");

  await supabase.from("emergencias").insert([{ titulo, descripcion }]);
  alert("Emergencia creada.");
  cargarListadoAdmin();
});

// ===============================
// GESTIÓN DE USUARIOS
// ===============================
document.getElementById("btn-actualizar-usuarios").addEventListener("click", async () => {
  const cont = document.getElementById("admin-usuarios");
  cont.innerHTML = "<p>Cargando usuarios...</p>";

  const { data: usuarios } = await supabase.from("usuarios").select("*");

  cont.innerHTML = "";

  usuarios.forEach(u => {
    cont.innerHTML += `
      <div style="background:#eee; padding:10px; margin-bottom:8px; border-radius:6px;">
        <strong>${u.nombre}</strong><br>
        Tel: ${u.telefono || "—"}<br>
        Rol: ${u.rol || "usuario"}
      </div>
    `;
  });
});
